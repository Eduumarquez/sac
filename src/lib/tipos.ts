export type Papel = "dono" | "recepcao" | "personal" | "nutricionista" | "fisioterapeuta";

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
  /** Plano de agregador (Wellhub, Totalpass): não aparece na matrícula e não gera mensalidade */
  agregador?: "wellhub" | "totalpass";
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
  /** Plano pausado até esta data (AAAA-MM-DD) */
  pausadoAte?: string;
};

export type Anamnese = {
  alunoId: string;
  data: string;
  respostas: Record<string, boolean>;
  lesoes: string;
  medicamentos: string;
  observacoes: string;
};

export type ViaCheckin = "app" | "qr" | "wellhub" | "totalpass";
export type Checkin = { id: string; alunoId: string; data: string; via?: ViaCheckin };

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
  /** Bioimpedância */
  massaMagraKg?: number;
  massaMuscularKg?: number;
  aguaPct?: number;
  gorduraVisceral?: number;
  metabolismoBasalKcal?: number;
  origem?: "manual" | "bioimpedancia";
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
  /** Alergias, intolerâncias e restrições (ex.: "Lactose", "Vegano" ou outra escrita pela nutri). */
  restricoes?: string[];
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

/** Meta compartilhada por personal e nutricionista. */
export type Meta = { id: string; alunoId: string; tipo: "peso" | "gordura"; inicial: number; alvo: number; prazo: string; criadaPorId: string; criadaEm: string };

export type MotivoCancelamento = "preco" | "tempo" | "resultado" | "mudanca" | "saude" | "outro";
export type ResultadoCancelamento = "pausou" | "trocou_plano" | "treino_curto" | "cancelou";
export type PedidoCancelamento = { id: string; alunoId: string; data: string; motivo: MotivoCancelamento; origem: "recepcao" | "app"; resultado: ResultadoCancelamento; detalhe?: string; valorMensalCentavos: number };

export type Aula = { id: string; nome: string; inicio: string; duracaoMin: number; profissionalId: string; vagas: number; inscritos: string[] };
export type Agendamento = { id: string; alunoId: string; profissionalId: string; tipo: "avaliacao" | "consulta"; inicio: string; status: "marcado" | "feito" | "faltou" };

/** Tentativa de entrada na academia (catraca / QR). */
export type Acesso = { id: string; alunoId: string; data: string; liberado: boolean; motivo?: string; via: ViaCheckin };

/** Lembrete de cobrança enviado pela régua. */
export type Lembrete = { id: string; cobrancaId: string; etapa: EtapaRegua; data: string };
export type EtapaRegua = "antes" | "no_dia" | "3_dias" | "7_dias";

// ---------- loja, pacotes e serviços ----------
export type CategoriaProduto = "suplemento" | "acessorio" | "pacote" | "servico";
export type Produto = {
  id: string; nome: string; categoria: CategoriaProduto; precoCentavos: number; descricao: string;
  estoque?: number; emoji: string;
  /** pacote de sessões com um profissional */
  sessoes?: number; papel?: "personal" | "nutricionista" | "fisioterapeuta";
  /** % do valor que fica com o profissional (pacotes) */
  comissaoPct?: number;
  ativo: boolean;
};
export type ItemVenda = { produtoId: string; qtd: number; precoCentavos: number };
export type Venda = { id: string; alunoId: string; data: string; itens: ItemVenda[]; totalCentavos: number; status: "pago" | "retirado"; origem: "app" | "recepcao" };
/** Saldo de sessões comprado em pacote ou serviço avulso. */
export type Credito = { id: string; alunoId: string; produtoId: string; profissionalId?: string; sessoesTotal: number; usos: string[]; compradoEm: string };

// ---------- saúde ----------
export type ValorExame = { marcador: string; valor: number; unidade: string; refMin?: number; refMax?: number };
export type Exame = { id: string; alunoId: string; data: string; laboratorio?: string; arquivoNome?: string; valores: ValorExame[]; enviadoPor: "aluno" | "nutricionista" };
export type Encaminhamento = {
  id: string; alunoId: string; deId: string; paraId: string; data: string; motivo: string;
  status: "aberto" | "em_atendimento" | "liberado";
  /** orientação do fisioterapeuta para o treino */
  liberacao?: string; liberadoEm?: string;
};

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
  metas: Meta[];
  cancelamentos: PedidoCancelamento[];
  aulas: Aula[];
  agendamentos: Agendamento[];
  acessos: Acesso[];
  lembretes: Lembrete[];
  produtos: Produto[];
  vendas: Venda[];
  creditos: Credito[];
  exames: Exame[];
  encaminhamentos: Encaminhamento[];
};
