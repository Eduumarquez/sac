import type { Aluno, BancoDados, CategoriaProduto, Cobranca, Credito, EtapaRegua, ItemVenda, Meta, MotivoCancelamento, Plano, Profissional, ValorExame, Venda } from "./tipos";
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
      sensacoesRecentes: (db.feedbacks ?? [])
        .filter((f) => f.alunoId === alunoId)
        .sort((a, b) => b.data.localeCompare(a.data))
        .map((f) => f.sensacao),
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

// ---------- valor, retenção e dinheiro salvo ----------

/** Quanto o aluno paga por mês (planos anuais divididos por 12; agregadores = 0). */
export function valorMensal(db: Pick<BancoDados, "planos">, aluno: Pick<Aluno, "planoId">): number {
  const p = db.planos.find((x) => x.id === aluno.planoId);
  return p ? Math.round(p.valorCentavos / p.periodicidadeMeses) : 0;
}

export type ItemSalvo = { alunoId: string; data: string; como: "contato" | "cancelamento"; valorMensalCentavos: number };

/**
 * Mensalidade que continuou entrando graças à equipe nos últimos 90 dias:
 * alunos em risco que foram contatados e voltaram a treinar, e pedidos de
 * cancelamento revertidos (pausa, troca de plano ou treino curto).
 * Cada aluno conta uma vez.
 */
export function dinheiroSalvo(db: BancoDados, hoje = new Date()): { totalMensalCentavos: number; itens: ItemSalvo[] } {
  const limite = new Date(hoje.getTime() - 90 * 86_400_000).toISOString();
  const porAluno = new Map<string, ItemSalvo>();
  const ativo = (id: string) => db.alunos.find((a) => a.id === id && a.status !== "cancelado");
  for (const c of db.cancelamentos) {
    if (c.data < limite || c.resultado === "cancelou" || !ativo(c.alunoId) || porAluno.has(c.alunoId)) continue;
    porAluno.set(c.alunoId, { alunoId: c.alunoId, data: c.data, como: "cancelamento", valorMensalCentavos: c.valorMensalCentavos });
  }
  for (const c of db.contatos) {
    const a = ativo(c.alunoId);
    if (c.data < limite || !a || porAluno.has(c.alunoId)) continue;
    const voltou = db.checkins.some((k) => k.alunoId === c.alunoId && k.data > c.data);
    const valor = valorMensal(db, a);
    if (voltou && valor > 0) porAluno.set(c.alunoId, { alunoId: c.alunoId, data: c.data, como: "contato", valorMensalCentavos: valor });
  }
  const itens = [...porAluno.values()].sort((a, b) => b.data.localeCompare(a.data));
  return { totalMensalCentavos: itens.reduce((s, i) => s + i.valorMensalCentavos, 0), itens };
}

// ---------- acesso (catraca / QR) ----------

/** Regra da catraca: cancelado, pausado ou com mensalidade atrasada há mais de 15 dias não entra. */
export function regraDeAcesso(db: BancoDados, alunoId: string, hoje = new Date()): { liberado: boolean; motivo?: string } {
  const a = db.alunos.find((x) => x.id === alunoId);
  if (!a) return { liberado: false, motivo: "Aluno não encontrado" };
  if (a.status === "cancelado") return { liberado: false, motivo: "Matrícula cancelada" };
  if (a.status === "pausado" || (a.pausadoAte && a.pausadoAte >= dataISO(hoje))) return { liberado: false, motivo: `Plano pausado${a.pausadoAte ? ` até ${a.pausadoAte.split("-").reverse().join("/")}` : ""}` };
  const atrasos = db.cobrancas
    .filter((c) => c.alunoId === alunoId && statusCobranca(c, hoje) === "atrasado")
    .map((c) => diasEntre(new Date(c.vencimento + "T12:00:00"), hoje));
  const maior = atrasos.length ? Math.max(...atrasos) : 0;
  if (maior > 15) return { liberado: false, motivo: `Mensalidade atrasada há ${maior} dias` };
  return { liberado: true };
}

// ---------- régua de cobrança ----------

export const ETAPAS_REGUA: { id: EtapaRegua; rotulo: string }[] = [
  { id: "antes", rotulo: "3 dias antes do vencimento" },
  { id: "no_dia", rotulo: "No dia do vencimento" },
  { id: "3_dias", rotulo: "3 dias de atraso" },
  { id: "7_dias", rotulo: "7 dias de atraso" },
];

/** Em que etapa da régua a cobrança está hoje (ou null se não é dia de lembrar). */
export function etapaDaRegua(c: Cobranca, hoje = new Date()): EtapaRegua | null {
  if (statusCobranca(c, hoje) === "pago") return null;
  const d = diasEntre(new Date(c.vencimento + "T12:00:00"), new Date(dataISO(hoje) + "T12:00:00"));
  if (d >= -3 && d <= -1) return "antes";
  if (d === 0) return "no_dia";
  if (d >= 3 && d <= 6) return "3_dias";
  if (d >= 7) return "7_dias";
  return null;
}

/** Lembretes que a régua manda hoje e ainda não foram enviados. */
export function lembretesDeHoje(db: BancoDados, hoje = new Date()): { cobranca: Cobranca; etapa: EtapaRegua }[] {
  return db.cobrancas.flatMap((c) => {
    const etapa = etapaDaRegua(c, hoje);
    if (!etapa) return [];
    if (db.lembretes.some((l) => l.cobrancaId === c.id && l.etapa === etapa)) return [];
    return [{ cobranca: c, etapa }];
  });
}

export function mensagemCobranca(nome: string, c: Cobranca, etapa: EtapaRegua): string {
  const valor = (c.valorCentavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const venc = c.vencimento.split("-").reverse().join("/");
  const primeiro = nome.split(" ")[0];
  if (etapa === "antes") return `Oi ${primeiro}! Sua mensalidade de ${valor} vence em ${venc}. Você pode pagar pelo app com Pix.`;
  if (etapa === "no_dia") return `Oi ${primeiro}! Hoje vence sua mensalidade de ${valor}. É só abrir o app e pagar com Pix.`;
  if (etapa === "3_dias") return `Oi ${primeiro}! Sua mensalidade de ${valor} venceu em ${venc}. Quer que eu te mande o Pix?`;
  return `Oi ${primeiro}, tudo bem? A mensalidade de ${valor} está em aberto desde ${venc}. Se estiver com alguma dificuldade, fala com a gente que a gente encontra um jeito.`;
}

// ---------- metas ----------

/** Valor atual da meta (última medida registrada) e quanto do caminho já foi feito, de 0 a 1. */
export function progressoMeta(db: BancoDados, meta: Meta): { atual: number; progresso: number; data?: string } {
  const medidas: { data: string; v: number }[] =
    meta.tipo === "peso"
      ? [
          ...db.avaliacoes.filter((a) => a.alunoId === meta.alunoId).map((a) => ({ data: a.data, v: a.pesoKg })),
          ...db.consultas.filter((c) => c.alunoId === meta.alunoId && c.pesoKg).map((c) => ({ data: c.data, v: c.pesoKg! })),
        ]
      : db.avaliacoes.filter((a) => a.alunoId === meta.alunoId && a.gorduraPct != null).map((a) => ({ data: a.data, v: a.gorduraPct! }));
  const ultima = medidas.filter((m) => m.data >= meta.criadaEm.slice(0, 10)).sort((a, b) => b.data.localeCompare(a.data))[0]
    ?? medidas.sort((a, b) => b.data.localeCompare(a.data))[0];
  const atual = ultima?.v ?? meta.inicial;
  const total = meta.alvo - meta.inicial;
  const progresso = total === 0 ? 1 : Math.max(0, Math.min(1, (atual - meta.inicial) / total));
  return { atual, progresso, data: ultima?.data };
}

export const MOTIVOS_CANCELAMENTO: { id: MotivoCancelamento; rotulo: string }[] = [
  { id: "preco", rotulo: "Está caro" },
  { id: "tempo", rotulo: "Falta de tempo" },
  { id: "resultado", rotulo: "Não vejo resultado" },
  { id: "mudanca", rotulo: "Vou me mudar" },
  { id: "saude", rotulo: "Saúde ou lesão" },
  { id: "outro", rotulo: "Outro motivo" },
];

// ---------- loja, pacotes e serviços ----------

/** Registra uma compra: baixa estoque, cria a venda e os créditos de sessões. Lança erro sem estoque. */
export function comprar(db: BancoDados, alunoId: string, itens: { produtoId: string; qtd: number }[], origem: Venda["origem"], agora = new Date()): BancoDados {
  const aluno = db.alunos.find((a) => a.id === alunoId);
  if (!aluno) throw new Error("Aluno não encontrado");
  const linhas: ItemVenda[] = itens.filter((i) => i.qtd > 0).map((i) => {
    const p = db.produtos.find((x) => x.id === i.produtoId);
    if (!p || !p.ativo) throw new Error("Produto indisponível");
    if (p.estoque != null && p.estoque < i.qtd) throw new Error(`Sem estoque de ${p.nome}`);
    return { produtoId: p.id, qtd: i.qtd, precoCentavos: p.precoCentavos };
  });
  if (!linhas.length) throw new Error("Carrinho vazio");
  const data = agora.toISOString();
  const fisio = db.profissionais.find((p) => p.papel === "fisioterapeuta");
  const creditos: Credito[] = [];
  for (const l of linhas) {
    const p = db.produtos.find((x) => x.id === l.produtoId)!;
    if (!p.sessoes) continue;
    const profissionalId = p.papel === "personal" ? aluno.personalId : p.papel === "nutricionista" ? aluno.nutricionistaId : fisio?.id;
    for (let k = 0; k < l.qtd; k++) creditos.push({ id: novoId(), alunoId, produtoId: p.id, profissionalId, sessoesTotal: p.sessoes, usos: [], compradoEm: data });
  }
  return {
    ...db,
    produtos: db.produtos.map((p) => {
      const l = linhas.find((x) => x.produtoId === p.id);
      return l && p.estoque != null ? { ...p, estoque: p.estoque - l.qtd } : p;
    }),
    vendas: [...db.vendas, { id: novoId(), alunoId, data, itens: linhas, totalCentavos: linhas.reduce((s, l) => s + l.qtd * l.precoCentavos, 0), status: "pago", origem }],
    creditos: [...db.creditos, ...creditos],
  };
}

export const saldoSessoes = (c: Credito) => c.sessoesTotal - c.usos.length;

/** Receita da loja num período, por categoria, e quanto vai para cada profissional. */
export function resumoLoja(db: BancoDados, desde: Date) {
  const vendas = db.vendas.filter((v) => new Date(v.data) >= desde);
  const porCategoria: Record<CategoriaProduto, number> = { suplemento: 0, acessorio: 0, pacote: 0, servico: 0 };
  let comissao = 0;
  for (const v of vendas) for (const l of v.itens) {
    const p = db.produtos.find((x) => x.id === l.produtoId);
    if (!p) continue;
    const total = l.qtd * l.precoCentavos;
    porCategoria[p.categoria] += total;
    if (p.comissaoPct) comissao += Math.round((total * p.comissaoPct) / 100);
  }
  const total = Object.values(porCategoria).reduce((s, n) => s + n, 0);
  return { vendas: vendas.length, total, porCategoria, comissaoProfissionais: comissao, academia: total - comissao };
}

// ---------- saúde ----------

/** "baixo", "alto" ou null quando está dentro da referência informada. */
export function foraDaReferencia(v: ValorExame): "baixo" | "alto" | null {
  if (v.refMin != null && v.valor < v.refMin) return "baixo";
  if (v.refMax != null && v.valor > v.refMax) return "alto";
  return null;
}
