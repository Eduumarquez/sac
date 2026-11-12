import type { Aluno, BancoDados, Cobranca, Plano, Profissional } from "./tipos";
import { calcularRisco, type ResultadoRisco } from "./risco";
import { dataISO, diasEntre, novoId, somarMeses } from "./datas";

/** Perguntas do PAR-Q (questionário de prontidão para atividade física). */
export const PERGUNTAS_PARQ: { id: string; texto: string }[] = [
  { id: "cardiaco", texto: "Algum médico já disse que você tem problema cardíaco e só deve fazer atividade física recomendada por médico?" },
  { id: "dor_peito_atividade", texto: "Você sente dor no peito quando faz atividade física?" },
  { id: "dor_peito_repouso", texto: "No último mês, você sentiu dor no peito sem estar fazendo atividade física?" },
  { id: "tontura", texto: "Você perde o equilíbrio por tontura ou já perdeu a consciência?" },
  { id: "osseo", texto: "Você tem algum problema ósseo ou articular que pode piorar com atividade física?" },
  { id: "pressao", texto: "Você toma algum remédio para pressão arterial ou para o coração?" },
  { id: "outro", texto: "Existe alguma outra razão pela qual você não deveria fazer atividade física?" },
];

/** Se alguma resposta do PAR-Q for "sim", pedimos atestado médico. */
export const precisaAtestado = (respostas: Record<string, boolean>) =>
  Object.values(respostas).some(Boolean);

/** Escolhe o profissional daquele papel com menos alunos ativos. */
export function profissionalMenosOcupado(
  db: Pick<BancoDados, "profissionais" | "alunos">,
  papel: "personal" | "nutricionista",
): Profissional | undefined {
  const campo = papel === "personal" ? "personalId" : "nutricionistaId";
  const carga = (p: Profissional) =>
    db.alunos.filter((a) => a.status === "ativo" && a[campo] === p.id).length;
  return db.profissionais
    .filter((p) => p.papel === papel)
    .sort((a, b) => carga(a) - carga(b))[0];
}

/** Gera as cobranças dos próximos 12 meses de acordo com a periodicidade do plano. */
export function gerarCobrancas(aluno: Aluno, plano: Plano, inicio: Date, meses = 12): Cobranca[] {
  const out: Cobranca[] = [];
  for (let m = 0; m < meses; m += plano.periodicidadeMeses) {
    out.push({
      id: novoId(),
      alunoId: aluno.id,
      valorCentavos: plano.valorCentavos,
      vencimento: dataISO(somarMeses(inicio, m)),
      status: "pendente",
    });
  }
  return out;
}

/** Atualiza para "atrasado" as cobranças pendentes já vencidas. */
export function statusCobranca(c: Cobranca, hoje = new Date()): Cobranca["status"] {
  if (c.status === "pago") return "pago";
  return c.vencimento < dataISO(hoje) ? "atrasado" : "pendente";
}

export function riscoDoAluno(db: BancoDados, alunoId: string, hoje = new Date()): ResultadoRisco {
  const aluno = db.alunos.find((a) => a.id === alunoId)!;
  const checkins = db.checkins.filter((c) => c.alunoId === alunoId).map((c) => new Date(c.data));
  const atrasadas = db.cobrancas
    .filter((c) => c.alunoId === alunoId && statusCobranca(c, hoje) === "atrasado")
    .map((c) => diasEntre(new Date(c.vencimento + "T12:00:00"), hoje));
  const treino = db.treinos.find((t) => t.alunoId === alunoId && t.ativo);
  return calcularRisco(
    {
      matriculadoEm: new Date(aluno.matriculadoEm),
      checkins,
      diasAtrasoPagamento: atrasadas.length ? Math.max(...atrasadas) : 0,
      treinoAtualCriadoEm: treino ? new Date(treino.criadoEm) : null,
    },
    hoje,
  );
}

/** Semanas seguidas (até a atual) com pelo menos 2 treinos. */
export function sequenciaSemanas(datas: Date[], hoje = new Date(), minimo = 2): number {
  let semanas = 0;
  for (let s = 0; s < 104; s++) {
    const fim = hoje.getTime() - s * 7 * 86_400_000;
    const ini = fim - 7 * 86_400_000;
    const n = datas.filter((d) => d.getTime() > ini && d.getTime() <= fim).length;
    if (n >= minimo) semanas++;
    else if (s === 0) continue; // semana atual ainda em andamento
    else break;
  }
  return semanas;
}

export function imc(pesoKg: number, alturaCm: number): number {
  const m = alturaCm / 100;
  return Math.round((pesoKg / (m * m)) * 10) / 10;
}
