/** Opções para encaminhar e liberar alunos na fisioterapia, montadas por toques em vez de texto. */

export const TIPOS_QUEIXA = ["Dor", "Lesão", "Pós-cirurgia", "Limitação de movimento"];
export const REGIOES = ["Ombro", "Cotovelo", "Punho", "Coluna cervical", "Coluna lombar", "Quadril", "Joelho", "Tornozelo"];
export const LADOS = ["Direito", "Esquerdo", "Os dois lados"];
export const HA_QUANTO = ["Há poucos dias", "Há 1 a 2 semanas", "Há mais de um mês"];

/** "Dor no joelho direito há 1 a 2 semanas." */
export function textoQueixa(q: { tipo: string; regiao: string; lado?: string; tempo?: string; detalhe?: string }) {
  const regiao = q.regiao.toLowerCase();
  const lado = q.lado === "Os dois lados" ? " (dos dois lados)" : q.lado ? ` ${q.lado.toLowerCase()}` : "";
  const artigo = /^(coluna)/.test(regiao) ? "na" : "no";
  const tempo = q.tempo ? ` ${q.tempo.toLowerCase()}` : "";
  const detalhe = q.detalhe?.trim() ? ` ${q.detalhe.trim().replace(/\.$/, "")}.` : "";
  return `${q.tipo} ${artigo} ${regiao}${lado}${tempo}.${detalhe}`;
}

export const ORIENTACOES_FISIO = [
  "Liberado sem restrições",
  "Evitar impacto (corrida e saltos)",
  "Evitar agachamento profundo",
  "Evitar carga acima da cabeça",
  "Reduzir a carga pela metade",
  "Fortalecimento antes do treino",
  "Alongar ao final do treino",
];
export const PERIODOS = ["por 2 semanas", "por 4 semanas", "por 6 semanas", "por 8 semanas"];

/** "Evitar impacto (corrida e saltos); reduzir a carga pela metade por 4 semanas." */
export function textoLiberacao(itens: string[], periodo?: string) {
  if (!itens.length) return "";
  const corpo = itens.map((t, i) => (i ? t.charAt(0).toLowerCase() + t.slice(1) : t)).join("; ");
  return `${corpo}${periodo ? ` ${periodo}` : ""}.`;
}
