export type Papel = "dono" | "recepcao" | "personal" | "nutricionista";

export type Profissional = {
  id: string;
  nome: string;
  papel: Papel;
  registro?: string; // CREF ou CRN
  telefone?: string;
};

export type Plano = {
  id: string;
  nome: string;
  valorCentavos: number;
  periodicidadeMeses: number;
  incluiPersonal: boolean;
  incluiNutricionista: boolean;
  descricao: string;
};

export type Objetivo = "emagrecimento" | "hipertrofia" | "condicionamento" | "saude" | "reabilitacao";

export type StatusAluno = "ativo" | "pausado" | "cancelado";

export type Aluno = {
  id: string;
  nome: string;
  cpf?: string;
  telefone: string;
  email: string;
  nascimento: string; // AAAA-MM-DD
  objetivo: Objetivo;
  planoId: string;
  personalId?: string;
  nutricionistaId?: string;
  matriculadoEm: string; // ISO
  status: StatusAluno;
  origem: "direto" | "wellhub" | "totalpass";
  consentimentoSaudeEm?: string;
};

export type Anamnese = {
  alunoId: string;
  data: string;
  respostas: Record<string, boolean>;
  lesoes: string;
  medicamentos: string;
  observacoes: string;
};

export type Checkin = { id: string; alunoId: string; data: string };

export type StatusCobranca = "pendente" | "pago" | "atrasado";

export type Cobranca = {
  id: string;
  alunoId: string;
  valorCentavos: number;
  vencimento: string; // AAAA-MM-DD
  status: StatusCobranca;
  pagoEm?: string;
  metodo?: "pix" | "cartao" | "boleto";
};

export type ExercicioTreino = {
  exercicio: string;
  series: number;
  repeticoes: string;
  cargaKg?: number;
  observacao?: string;
};

export type DivisaoTreino = { nome: string; exercicios: ExercicioTreino[] };

export type Treino = {
  id: string;
  alunoId: string;
  personalId: string;
  nome: string;
  criadoEm: string;
  ativo: boolean;
  divisoes: DivisaoTreino[];
};

export type RegistroCarga = {
  id: string;
  alunoId: string;
  exercicio: string;
  cargaKg: number;
  repeticoes: number;
  data: string;
};

export type AvaliacaoFisica = {
  id: string;
  alunoId: string;
  personalId: string;
  data: string;
  pesoKg: number;
  alturaCm: number;
  gorduraPct?: number;
  cinturaCm?: number;
  quadrilCm?: number;
  bracoCm?: number;
  coxaCm?: number;
  observacoes?: string;
};

export type Refeicao = { nome: string; horario: string; itens: string };

export type PlanoAlimentar = {
  id: string;
  alunoId: string;
  nutricionistaId: string;
  criadoEm: string;
  ativo: boolean;
  metaKcal: number;
  proteinaG?: number;
  refeicoes: Refeicao[];
  orientacoes: string;
};

export type ConsultaNutricional = {
  id: string;
  alunoId: string;
  nutricionistaId: string;
  data: string;
  pesoKg?: number;
  adesao?: 1 | 2 | 3 | 4 | 5; // quanto o aluno seguiu o plano
  anotacoes: string;
  proximoRetorno?: string; // AAAA-MM-DD
};

export type ContatoRetencao = {
  id: string;
  alunoId: string;
  data: string;
  responsavelId?: string;
  resultado: "contatado" | "voltou" | "sem_resposta";
};

/** Recado deixado por alguém da equipe na ficha do aluno. */
export type Nota = { id: string; alunoId: string; autorId: string; data: string; texto: string };

/** Como o aluno se sentiu no treino (1 = péssimo, 5 = ótimo). */
export type Sensacao = 1 | 2 | 3 | 4 | 5;
export type FeedbackTreino = { id: string; alunoId: string; data: string; divisao: string; sensacao: Sensacao; comentario?: string };

export type BancoDados = {
  versao: 1;
  academia: { nome: string };
  profissionais: Profissional[];
  planos: Plano[];
  alunos: Aluno[];
  anamneses: Anamnese[];
  checkins: Checkin[];
  cobrancas: Cobranca[];
  treinos: Treino[];
  registrosCarga: RegistroCarga[];
  avaliacoes: AvaliacaoFisica[];
  planosAlimentares: PlanoAlimentar[];
  consultas: ConsultaNutricional[];
  contatos: ContatoRetencao[];
  notas: Nota[];
  feedbacks: FeedbackTreino[];
};
