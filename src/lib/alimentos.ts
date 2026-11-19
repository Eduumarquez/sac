/**
 * Opções do plano alimentar, para a nutricionista montar tocando em vez de escrever.
 * Calorias e proteína são valores aproximados por porção (tabelas de referência como a TACO),
 * servem para a soma do dia, não substituem o cálculo da nutricionista.
 */
import { horariosEntre } from "./datas";

export type Alimento = { nome: string; kcal: number; proteinaG: number; grupo: "leve" | "principal" | "ambos" };

export const ALIMENTOS: Alimento[] = [
  { nome: "2 ovos mexidos", kcal: 150, proteinaG: 12, grupo: "leve" },
  { nome: "1 omelete de 2 ovos", kcal: 180, proteinaG: 13, grupo: "ambos" },
  { nome: "1 fatia de pão integral", kcal: 70, proteinaG: 3, grupo: "leve" },
  { nome: "1 pão francês", kcal: 140, proteinaG: 4, grupo: "leve" },
  { nome: "1 tapioca média", kcal: 140, proteinaG: 0, grupo: "leve" },
  { nome: "1 fatia de queijo branco", kcal: 60, proteinaG: 5, grupo: "leve" },
  { nome: "1 copo de leite desnatado", kcal: 70, proteinaG: 7, grupo: "leve" },
  { nome: "1 iogurte natural", kcal: 100, proteinaG: 6, grupo: "leve" },
  { nome: "2 colheres de aveia", kcal: 75, proteinaG: 3, grupo: "leve" },
  { nome: "1 colher de pasta de amendoim", kcal: 95, proteinaG: 4, grupo: "leve" },
  { nome: "1 punhado de castanhas", kcal: 130, proteinaG: 3, grupo: "leve" },
  { nome: "1 dose de whey", kcal: 120, proteinaG: 24, grupo: "leve" },
  { nome: "1 banana", kcal: 90, proteinaG: 1, grupo: "leve" },
  { nome: "1 maçã", kcal: 70, proteinaG: 0, grupo: "leve" },
  { nome: "1 fatia de mamão", kcal: 60, proteinaG: 1, grupo: "leve" },
  { nome: "1 fruta da estação", kcal: 70, proteinaG: 1, grupo: "ambos" },
  { nome: "1 xícara de café sem açúcar", kcal: 2, proteinaG: 0, grupo: "leve" },
  { nome: "4 colheres de arroz", kcal: 130, proteinaG: 3, grupo: "principal" },
  { nome: "4 colheres de arroz integral", kcal: 120, proteinaG: 3, grupo: "principal" },
  { nome: "1 concha de feijão", kcal: 80, proteinaG: 5, grupo: "principal" },
  { nome: "120 g de frango grelhado", kcal: 190, proteinaG: 38, grupo: "principal" },
  { nome: "120 g de carne magra", kcal: 230, proteinaG: 34, grupo: "principal" },
  { nome: "120 g de peixe", kcal: 150, proteinaG: 28, grupo: "principal" },
  { nome: "100 g de batata-doce", kcal: 80, proteinaG: 1, grupo: "ambos" },
  { nome: "legumes cozidos", kcal: 40, proteinaG: 2, grupo: "principal" },
  { nome: "salada verde à vontade", kcal: 20, proteinaG: 1, grupo: "principal" },
  { nome: "1 colher de chá de azeite", kcal: 40, proteinaG: 0, grupo: "principal" },
];

export const REFEICOES_PADRAO: { nome: string; horario: string; grupo: "leve" | "principal" }[] = [
  { nome: "Café da manhã", horario: "07:00", grupo: "leve" },
  { nome: "Lanche da manhã", horario: "10:00", grupo: "leve" },
  { nome: "Almoço", horario: "12:30", grupo: "principal" },
  { nome: "Lanche da tarde", horario: "15:30", grupo: "leve" },
  { nome: "Pré-treino", horario: "17:00", grupo: "leve" },
  { nome: "Pós-treino", horario: "19:00", grupo: "leve" },
  { nome: "Jantar", horario: "20:00", grupo: "principal" },
  { nome: "Ceia", horario: "22:00", grupo: "leve" },
];

export const grupoDaRefeicao = (nome: string) => REFEICOES_PADRAO.find((r) => r.nome === nome)?.grupo ?? "leve";

/** De 05:00 a 23:30, de meia em meia hora. */
export const HORARIOS = horariosEntre(5, 23.5);

export const OPCOES_KCAL = Array.from({ length: 29 }, (_, i) => 1200 + i * 100); // 1200 a 4000
export const OPCOES_PROTEINA = Array.from({ length: 22 }, (_, i) => 40 + i * 10); // 40 a 250 g

export const ORIENTACOES = [
  "Beber pelo menos 2,5 L de água por dia.",
  "Não pular refeições.",
  "Evitar frituras e ultraprocessados.",
  "Evitar refrigerante e suco de caixinha.",
  "Reduzir açúcar e doces durante a semana.",
  "Preferir alimentos integrais.",
  "Comer devagar e mastigar bem.",
  "Uma refeição livre no fim de semana.",
];

/** Itens da refeição guardados como texto: "2 ovos mexidos, 1 banana". */
export const separarItens = (texto: string) => texto.split(/,\s*/).map((t) => t.trim()).filter(Boolean);
export const juntarItens = (lista: string[]) => lista.join(", ");

/** Orientações guardadas como frases: "Frase um. Frase dois." */
export const separarOrientacoes = (texto: string) => texto.split(/(?<=\.)\s+/).map((t) => t.trim()).filter(Boolean);

/** Soma aproximada das porções conhecidas. */
export function somaDoDia(refeicoes: { itens: string }[]) {
  let kcal = 0, proteinaG = 0;
  for (const r of refeicoes) for (const i of separarItens(r.itens)) {
    const a = ALIMENTOS.find((x) => x.nome === i);
    if (a) { kcal += a.kcal; proteinaG += a.proteinaG; }
  }
  return { kcal, proteinaG };
}

/** Alergias, intolerâncias e restrições, com os alimentos do catálogo que cada uma pede para evitar. */
export const RESTRICOES: { nome: string; tipo: "alergia" | "intolerancia" | "escolha"; evita: string[] }[] = [
  { nome: "Lactose", tipo: "intolerancia", evita: ["1 fatia de queijo branco", "1 copo de leite desnatado", "1 iogurte natural", "1 dose de whey"] },
  { nome: "Glúten", tipo: "intolerancia", evita: ["1 fatia de pão integral", "1 pão francês", "2 colheres de aveia"] },
  { nome: "Proteína do leite", tipo: "alergia", evita: ["1 fatia de queijo branco", "1 copo de leite desnatado", "1 iogurte natural", "1 dose de whey"] },
  { nome: "Ovo", tipo: "alergia", evita: ["2 ovos mexidos", "1 omelete de 2 ovos"] },
  { nome: "Amendoim", tipo: "alergia", evita: ["1 colher de pasta de amendoim"] },
  { nome: "Castanhas", tipo: "alergia", evita: ["1 punhado de castanhas"] },
  { nome: "Peixe", tipo: "alergia", evita: ["120 g de peixe"] },
  { nome: "Frutos do mar", tipo: "alergia", evita: [] },
  { nome: "Soja", tipo: "alergia", evita: [] },
  { nome: "Vegetariano", tipo: "escolha", evita: ["120 g de frango grelhado", "120 g de carne magra", "120 g de peixe"] },
  { nome: "Vegano", tipo: "escolha", evita: ["120 g de frango grelhado", "120 g de carne magra", "120 g de peixe", "2 ovos mexidos", "1 omelete de 2 ovos", "1 fatia de queijo branco", "1 copo de leite desnatado", "1 iogurte natural", "1 dose de whey"] },
];

/** Quais restrições do aluno um alimento fere. */
export const conflitosDe = (alimento: string, restricoes: string[]) =>
  RESTRICOES.filter((r) => restricoes.includes(r.nome) && r.evita.includes(alimento)).map((r) => r.nome);
