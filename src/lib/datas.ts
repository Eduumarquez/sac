export const DIA_MS = 86_400_000;

export const agora = () => new Date();
export const isoAgora = () => new Date().toISOString();
export const diasAtras = (n: number, base = new Date()) => new Date(base.getTime() - n * DIA_MS);
export const diasEntre = (a: Date, b: Date) => Math.floor((b.getTime() - a.getTime()) / DIA_MS);

/** AAAA-MM-DD no fuso local */
export function dataISO(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function somarMeses(d: Date, meses: number): Date {
  const r = new Date(d);
  r.setMonth(r.getMonth() + meses);
  return r;
}

export function formatarData(iso: string): string {
  const d = iso.length === 10 ? new Date(iso + "T12:00:00") : new Date(iso);
  return d.toLocaleDateString("pt-BR");
}

export function formatarDinheiro(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function idade(nascimento: string, hoje = new Date()): number {
  const n = new Date(nascimento + "T12:00:00");
  let i = hoje.getFullYear() - n.getFullYear();
  const m = hoje.getMonth() - n.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < n.getDate())) i--;
  return i;
}

export const novoId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
