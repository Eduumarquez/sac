import type { BancoDados, Checkin, RegistroCarga } from "./tipos";
import { dataISO, diasAtras, novoId, somarMeses } from "./datas";

/** Banco de demonstração: uma academia com equipe, planos e alunos em situações diferentes. */
export function criarBancoDemo(hoje = new Date()): BancoDados {
  const d = (n: number) => diasAtras(n, hoje).toISOString();
  const checkins = (alunoId: string, dias: number[]): Checkin[] =>
    dias.map((n) => ({ id: novoId(), alunoId, data: d(n) }));

  const profissionais = [
    { id: "p-dono", nome: "Eduardo (dono)", papel: "dono" as const },
    { id: "p-rec", nome: "Camila (recepção)", papel: "recepcao" as const },
    { id: "p-pers1", nome: "Lucas Pereira", papel: "personal" as const, registro: "CREF 012345-G/ES" },
    { id: "p-pers2", nome: "Fernanda Dias", papel: "personal" as const, registro: "CREF 067890-G/ES" },
    { id: "p-nutri1", nome: "Patrícia Moura", papel: "nutricionista" as const, registro: "CRN-4 12345" },
  ];

  const planos = [
    { id: "pl-basico", nome: "Básico", valorCentavos: 9990, periodicidadeMeses: 1, incluiPersonal: false, incluiNutricionista: false, descricao: "Musculação com acompanhamento do professor do salão." },
    { id: "pl-acomp", nome: "Acompanhado", valorCentavos: 17990, periodicidadeMeses: 1, incluiPersonal: true, incluiNutricionista: false, descricao: "Personal dedicado, treino individual e avaliação física mensal." },
    { id: "pl-completo", nome: "Completo", valorCentavos: 26990, periodicidadeMeses: 1, incluiPersonal: true, incluiNutricionista: true, descricao: "Personal + nutricionista, plano alimentar e consultas mensais." },
    { id: "pl-anual", nome: "Completo anual", valorCentavos: 269900, periodicidadeMeses: 12, incluiPersonal: true, incluiNutricionista: true, descricao: "O plano Completo pagando à vista por 12 meses (2 meses grátis)." },
  ];

  type Base = { id: string; nome: string; tel: string; nasc: string; obj: BancoDados["alunos"][number]["objetivo"]; plano: string; pers?: string; nutri?: string; desde: number; dias: number[]; atraso?: number; treinoHa?: number | null };
  const base: Base[] = [
    { id: "a1", nome: "Mariana Costa", tel: "5527999990001", nasc: "1998-04-12", obj: "emagrecimento", plano: "pl-completo", pers: "p-pers1", nutri: "p-nutri1", desde: 40, dias: [16, 18, 21, 23, 25, 28, 30, 33, 35, 37], treinoHa: 40 },
    { id: "a2", nome: "Rafael Souza", tel: "5527999990002", nasc: "1990-09-03", obj: "hipertrofia", plano: "pl-acomp", pers: "p-pers2", desde: 400, dias: [3, 10, 17, 20, 22, 24, 27, 29, 31, 34, 36, 38], treinoHa: 120 },
    { id: "a3", nome: "Juliana Alves", tel: "5527999990003", nasc: "1985-01-22", obj: "condicionamento", plano: "pl-completo", pers: "p-pers1", nutri: "p-nutri1", desde: 200, dias: [1, 2, 4, 6, 8, 9, 11, 13, 15, 16, 18, 20, 22, 23, 25, 27, 29, 30], treinoHa: 20 },
    { id: "a4", nome: "Carlos Lima", tel: "5527999990004", nasc: "1979-11-30", obj: "saude", plano: "pl-basico", desde: 75, dias: [9, 15, 19, 26, 33, 40], atraso: 20, treinoHa: null },
    { id: "a5", nome: "Beatriz Rocha", tel: "5527999990005", nasc: "2001-06-08", obj: "hipertrofia", plano: "pl-acomp", pers: "p-pers2", desde: 500, dias: [2, 5, 7, 12, 14, 16, 19, 21, 23, 26, 28], atraso: 5, treinoHa: 30 },
    { id: "a6", nome: "Pedro Henrique", tel: "5527999990006", nasc: "1995-02-17", obj: "emagrecimento", plano: "pl-completo", pers: "p-pers2", nutri: "p-nutri1", desde: 10, dias: [1, 3, 5, 8], treinoHa: 10 },
  ];

  const alunos = base.map((b) => ({
    id: b.id, nome: b.nome, telefone: b.tel, email: b.nome.split(" ")[0].toLowerCase() + "@exemplo.com",
    nascimento: b.nasc, objetivo: b.obj, planoId: b.plano, personalId: b.pers, nutricionistaId: b.nutri,
    matriculadoEm: d(b.desde), status: "ativo" as const, origem: "direto" as const, consentimentoSaudeEm: d(b.desde),
  }));

  const cobrancas = base.flatMap((b) => {
    const plano = planos.find((p) => p.id === b.plano)!;
    const out = [];
    // mensalidades desde a matrícula até o mês seguinte
    for (let m = 0; ; m++) {
      const venc = somarMeses(diasAtras(b.desde, hoje), m);
      if (venc.getTime() > hoje.getTime() + 31 * 86_400_000) break;
      const vencida = venc.getTime() < hoje.getTime();
      const emAtraso = b.atraso && vencida && hoje.getTime() - venc.getTime() <= (b.atraso + 1) * 86_400_000;
      out.push({
        id: novoId(), alunoId: b.id, valorCentavos: plano.valorCentavos, vencimento: dataISO(venc),
        status: vencida && !emAtraso ? ("pago" as const) : ("pendente" as const),
        pagoEm: vencida && !emAtraso ? venc.toISOString() : undefined,
        metodo: vencida && !emAtraso ? ("pix" as const) : undefined,
      });
      if (plano.periodicidadeMeses >= 12) break;
    }
    return out;
  });

  const treinoPadrao = (obj: string) =>
    obj === "hipertrofia"
      ? [
          { nome: "A - Peito e tríceps", exercicios: [
            { exercicio: "Supino reto", series: 4, repeticoes: "8-10", cargaKg: 40 },
            { exercicio: "Supino inclinado com halteres", series: 3, repeticoes: "10", cargaKg: 16 },
            { exercicio: "Crucifixo na máquina", series: 3, repeticoes: "12", cargaKg: 35 },
            { exercicio: "Tríceps na polia", series: 3, repeticoes: "12", cargaKg: 25 },
          ] },
          { nome: "B - Costas e bíceps", exercicios: [
            { exercicio: "Puxada frontal", series: 4, repeticoes: "10", cargaKg: 50 },
            { exercicio: "Remada baixa", series: 3, repeticoes: "10", cargaKg: 45 },
            { exercicio: "Rosca direta", series: 3, repeticoes: "10", cargaKg: 20 },
          ] },
          { nome: "C - Pernas", exercicios: [
            { exercicio: "Agachamento livre", series: 4, repeticoes: "8", cargaKg: 60 },
            { exercicio: "Leg press", series: 3, repeticoes: "12", cargaKg: 150 },
            { exercicio: "Cadeira extensora", series: 3, repeticoes: "12", cargaKg: 40 },
          ] },
        ]
      : [
          { nome: "A - Corpo inteiro", exercicios: [
            { exercicio: "Agachamento livre", series: 3, repeticoes: "12", cargaKg: 30 },
            { exercicio: "Supino reto", series: 3, repeticoes: "12", cargaKg: 25 },
            { exercicio: "Remada baixa", series: 3, repeticoes: "12", cargaKg: 30 },
            { exercicio: "Prancha", series: 3, repeticoes: "30s" },
          ] },
          { nome: "B - Cardio e core", exercicios: [
            { exercicio: "Esteira (intervalado)", series: 1, repeticoes: "20 min" },
            { exercicio: "Leg press", series: 3, repeticoes: "15", cargaKg: 80 },
            { exercicio: "Abdominal infra", series: 3, repeticoes: "15" },
          ] },
        ];

  const treinos = base
    .filter((b) => b.treinoHa != null)
    .map((b) => ({
      id: "t-" + b.id, alunoId: b.id, personalId: b.pers ?? "p-pers1", nome: "Treino atual",
      criadoEm: d(b.treinoHa!), ativo: true, divisoes: treinoPadrao(b.obj),
    }));

  // histórico de cargas (progressão) para quem tem treino
  const registrosCarga: RegistroCarga[] = [];
  for (const b of base.filter((x) => x.treinoHa != null)) {
    const ex = b.obj === "hipertrofia" ? ["Supino reto", "Agachamento livre"] : ["Agachamento livre", "Supino reto"];
    const inicio = b.obj === "hipertrofia" ? [40, 60] : [20, 15];
    b.dias.slice().reverse().forEach((dia, i) => {
      ex.forEach((nomeEx, j) => {
        if (i % 2 === j % 2) registrosCarga.push({ id: novoId(), alunoId: b.id, exercicio: nomeEx, cargaKg: inicio[j] + Math.floor(i / 2) * 2.5, repeticoes: 10, data: d(dia) });
      });
    });
  }

  const avaliacoes = [
    { id: novoId(), alunoId: "a1", personalId: "p-pers1", data: d(38), pesoKg: 82.4, alturaCm: 165, gorduraPct: 34, cinturaCm: 92, quadrilCm: 108 },
    { id: novoId(), alunoId: "a1", personalId: "p-pers1", data: d(8), pesoKg: 79.1, alturaCm: 165, gorduraPct: 32, cinturaCm: 88, quadrilCm: 105 },
    { id: novoId(), alunoId: "a3", personalId: "p-pers1", data: d(190), pesoKg: 68, alturaCm: 170, gorduraPct: 27 },
    { id: novoId(), alunoId: "a3", personalId: "p-pers1", data: d(100), pesoKg: 65.5, alturaCm: 170, gorduraPct: 24 },
    { id: novoId(), alunoId: "a3", personalId: "p-pers1", data: d(15), pesoKg: 64.2, alturaCm: 170, gorduraPct: 22 },
    { id: novoId(), alunoId: "a2", personalId: "p-pers2", data: d(130), pesoKg: 78, alturaCm: 180, gorduraPct: 15, bracoCm: 36 },
  ];

  const planosAlimentares = ["a1", "a3", "a6"].map((alunoId) => ({
    id: "pa-" + alunoId, alunoId, nutricionistaId: "p-nutri1", criadoEm: d(alunoId === "a6" ? 7 : 35), ativo: true,
    metaKcal: alunoId === "a3" ? 2000 : 1700, proteinaG: alunoId === "a3" ? 110 : 120,
    refeicoes: [
      { nome: "Café da manhã", horario: "07:00", itens: "2 ovos mexidos, 1 fatia de pão integral, 1 fruta" },
      { nome: "Lanche", horario: "10:00", itens: "1 iogurte natural, 1 colher de aveia" },
      { nome: "Almoço", horario: "12:30", itens: "4 col. de arroz, 1 concha de feijão, 120 g de frango, salada à vontade" },
      { nome: "Pré-treino", horario: "16:30", itens: "1 banana com 1 col. de pasta de amendoim" },
      { nome: "Jantar", horario: "20:00", itens: "120 g de peixe ou frango, legumes, 2 col. de arroz" },
    ],
    orientacoes: "Beber pelo menos 2,5 L de água por dia. Evitar refrigerante e doces durante a semana.",
  }));

  const consultas = [
    { id: novoId(), alunoId: "a1", nutricionistaId: "p-nutri1", data: d(35), pesoKg: 82.4, adesao: 3 as const, anotacoes: "Primeira consulta. Rotina corrida, pula o café da manhã.", proximoRetorno: dataISO(diasAtras(5, hoje)) },
    { id: novoId(), alunoId: "a1", nutricionistaId: "p-nutri1", data: d(12), pesoKg: 79.8, adesao: 4 as const, anotacoes: "Boa evolução. Ajustei lanche da tarde.", proximoRetorno: dataISO(diasAtras(-18, hoje)) },
    { id: novoId(), alunoId: "a3", nutricionistaId: "p-nutri1", data: d(30), pesoKg: 64.5, adesao: 5 as const, anotacoes: "Mantendo bem. Foco em proteína.", proximoRetorno: dataISO(diasAtras(-2, hoje)) },
  ];

  const anamneses = alunos.map((a) => ({
    alunoId: a.id, data: a.matriculadoEm, respostas: { osseo: a.id === "a4" }, lesoes: a.id === "a4" ? "Dor no joelho direito" : "", medicamentos: "", observacoes: "",
  }));

  return {
    versao: 1,
    academia: { nome: "Academia Demonstração" },
    profissionais, planos, alunos, anamneses,
    checkins: base.flatMap((b) => checkins(b.id, b.dias)),
    cobrancas, treinos, registrosCarga, avaliacoes, planosAlimentares, consultas,
    contatos: [],
  };
}
