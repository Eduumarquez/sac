/**
 * Termômetro de risco de evasão (versão 1, baseada em regras).
 *
 * Cada regra soma pontos e explica o motivo. A pontuação vai de 0 a 100.
 * Quando houver dados suficientes dos pilotos, estas regras podem ser
 * substituídas ou calibradas por um modelo estatístico.
 */

export type DadosAluno = {
  /** Data de matrícula */
  matriculadoEm: Date;
  /** Datas dos check-ins (qualquer ordem) */
  checkins: Date[];
  /** Dias de atraso da cobrança mais antiga em aberto (0 se em dia) */
  diasAtrasoPagamento: number;
  /** Data em que o treino atual foi criado (null se não tem treino) */
  treinoAtualCriadoEm: Date | null;
  /** Notas de 1 a 5 dos últimos treinos, do mais recente para o mais antigo */
  sensacoesRecentes?: number[];
};

export type NivelRisco = "baixo" | "medio" | "alto";

export type ResultadoRisco = {
  pontuacao: number;
  nivel: NivelRisco;
  motivos: string[];
};

const DIA_MS = 24 * 60 * 60 * 1000;
const fmt = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 1 });

function diasEntre(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / DIA_MS);
}

function checkinsNoPeriodo(checkins: Date[], hoje: Date, inicioDias: number, fimDias: number): number {
  return checkins.filter((c) => {
    const d = diasEntre(c, hoje);
    return d >= inicioDias && d < fimDias;
  }).length;
}

export function calcularRisco(aluno: DadosAluno, hoje: Date = new Date()): ResultadoRisco {
  let pontuacao = 0;
  const motivos: string[] = [];

  // 1. Dias sem treinar
  const ultimo = aluno.checkins.reduce<Date | null>(
    (max, c) => (max === null || c > max ? c : max),
    null,
  );
  const diasSemTreinar = ultimo ? diasEntre(ultimo, hoje) : diasEntre(aluno.matriculadoEm, hoje);
  if (diasSemTreinar >= 14) {
    pontuacao += 40;
    motivos.push(`${diasSemTreinar} dias sem treinar`);
  } else if (diasSemTreinar >= 7) {
    pontuacao += 20;
    motivos.push(`${diasSemTreinar} dias sem treinar`);
  }

  // 2. Queda de frequência: últimas 2 semanas contra as 4 semanas anteriores
  const recentes = checkinsNoPeriodo(aluno.checkins, hoje, 0, 14) / 2;
  const anteriores = checkinsNoPeriodo(aluno.checkins, hoje, 14, 42) / 4;
  if (anteriores >= 1 && recentes < anteriores * 0.5) {
    pontuacao += 25;
    motivos.push(
      `frequência caiu de ${fmt(anteriores)} para ${fmt(recentes)} treinos/semana`,
    );
  }

  // 3. Iniciante: os primeiros 90 dias são os de maior desistência
  const diasDeCasa = diasEntre(aluno.matriculadoEm, hoje);
  if (diasDeCasa <= 90) {
    pontuacao += 10;
    motivos.push(`iniciante (${diasDeCasa} dias de casa)`);
  }

  // 4. Pagamento atrasado
  if (aluno.diasAtrasoPagamento > 15) {
    pontuacao += 20;
    motivos.push(`pagamento atrasado há ${aluno.diasAtrasoPagamento} dias`);
  } else if (aluno.diasAtrasoPagamento > 0) {
    pontuacao += 10;
    motivos.push(`pagamento atrasado há ${aluno.diasAtrasoPagamento} dias`);
  }

  // 5. Treino desatualizado
  if (!aluno.treinoAtualCriadoEm) {
    pontuacao += 10;
    motivos.push("sem treino montado");
  } else {
    const idadeTreino = diasEntre(aluno.treinoAtualCriadoEm, hoje);
    if (idadeTreino > 60) {
      pontuacao += 10;
      motivos.push(`treino sem atualização há ${idadeTreino} dias`);
    }
  }

  // 6. Não está gostando dos treinos: média das 2 últimas avaliações até 2
  const ultimas = (aluno.sensacoesRecentes ?? []).slice(0, 2);
  if (ultimas.length === 2 && (ultimas[0] + ultimas[1]) / 2 <= 2) {
    pontuacao += 15;
    motivos.push("não está gostando dos treinos");
  }

  pontuacao = Math.min(100, pontuacao);
  const nivel: NivelRisco = pontuacao >= 50 ? "alto" : pontuacao >= 25 ? "medio" : "baixo";
  return { pontuacao, nivel, motivos };
}

/** Mensagem curta e humana para o professor mandar no WhatsApp. */
export function mensagemSugerida(primeiroNome: string, risco: ResultadoRisco): string {
  if (risco.motivos.some((m) => m.includes("gostando"))) {
    return `Oi ${primeiroNome}! Vi que os últimos treinos não foram legais. Me conta o que está pegando? Quero ajustar para ficar do seu jeito.`;
  }
  if (risco.motivos.some((m) => m.includes("sem treinar"))) {
    return `Oi ${primeiroNome}! Senti sua falta aqui na academia. Tá tudo bem? Quer que eu ajuste seu treino para encaixar melhor na sua rotina?`;
  }
  if (risco.motivos.some((m) => m.includes("frequência caiu"))) {
    return `Oi ${primeiroNome}! Vi que a correria apertou. Que tal a gente montar um treino mais curto para os dias corridos?`;
  }
  if (risco.motivos.some((m) => m.includes("treino"))) {
    return `Oi ${primeiroNome}! Tá na hora de renovar seu treino. Qual dia fica bom para a gente montar um novo?`;
  }
  return `Oi ${primeiroNome}! Passando para saber como estão os treinos. Precisa de alguma coisa?`;
}
