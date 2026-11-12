import type { DadosAluno } from "./risco";

/** Dados de exemplo para ver o painel funcionando antes de ligar o Supabase. */
const hoje = new Date();
const diasAtras = (n: number) => new Date(hoje.getTime() - n * 24 * 60 * 60 * 1000);
const serie = (dias: number[]) => dias.map(diasAtras);

export type AlunoDemo = DadosAluno & { id: string; nome: string; telefone: string };

export const alunosDemo: AlunoDemo[] = [
  {
    id: "1", nome: "Mariana Costa", telefone: "5527999990001",
    matriculadoEm: diasAtras(40), checkins: serie([16, 18, 21, 23, 25, 28, 30]),
    diasAtrasoPagamento: 0, treinoAtualCriadoEm: diasAtras(40),
  },
  {
    id: "2", nome: "Rafael Souza", telefone: "5527999990002",
    matriculadoEm: diasAtras(400), checkins: serie([3, 10, 17, 20, 22, 24, 27, 29, 31, 34, 36, 38]),
    diasAtrasoPagamento: 0, treinoAtualCriadoEm: diasAtras(120),
  },
  {
    id: "3", nome: "Juliana Alves", telefone: "5527999990003",
    matriculadoEm: diasAtras(200), checkins: serie([1, 2, 4, 6, 8, 9, 11, 13]),
    diasAtrasoPagamento: 0, treinoAtualCriadoEm: diasAtras(20),
  },
  {
    id: "4", nome: "Carlos Lima", telefone: "5527999990004",
    matriculadoEm: diasAtras(75), checkins: serie([9, 15, 19, 26]),
    diasAtrasoPagamento: 20, treinoAtualCriadoEm: null,
  },
  {
    id: "5", nome: "Beatriz Rocha", telefone: "5527999990005",
    matriculadoEm: diasAtras(500), checkins: serie([2, 5, 7, 12, 14, 16, 19, 21]),
    diasAtrasoPagamento: 5, treinoAtualCriadoEm: diasAtras(30),
  },
];
