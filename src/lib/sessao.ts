/**
 * Login de demonstração: guarda quem entrou e qual papel tem.
 * Com o Supabase, este arquivo passa a usar o login real (e-mail e senha),
 * e as mesmas regras de acesso continuam valendo.
 */
import { useSyncExternalStore } from "react";
import type { BancoDados } from "./tipos";
import { definirPerfil } from "./db";

export type PapelSessao = "demo" | "dono" | "recepcao" | "personal" | "nutricionista" | "fisioterapeuta" | "aluno";
export type Sessao = { papel: PapelSessao; id?: string; nome: string };

/** Áreas que cada papel pode abrir. A primeira é para onde a pessoa vai ao entrar. */
export const ACESSO: Record<PapelSessao, string[]> = {
  demo: ["/painel/", "/matricula/", "/recepcao/", "/personal/", "/nutricionista/", "/fisioterapia/", "/aluno/"],
  dono: ["/painel/", "/recepcao/", "/matricula/"],
  recepcao: ["/recepcao/", "/painel/", "/matricula/"],
  personal: ["/personal/"],
  nutricionista: ["/nutricionista/"],
  fisioterapeuta: ["/fisioterapia/"],
  aluno: ["/aluno/"],
};

export const NOME_PAPEL: Record<PapelSessao, string> = {
  demo: "Demonstração completa", dono: "Dono", recepcao: "Recepção", personal: "Personal",
  nutricionista: "Nutricionista", fisioterapeuta: "Fisioterapia", aluno: "Aluno",
};

/** Páginas abertas para quem não entrou. */
export const PUBLICAS = ["/", "/entrar/", "/matricula/"];

export function podeAbrir(s: Sessao | null, caminho: string): boolean {
  const c = caminho.endsWith("/") ? caminho : caminho + "/";
  if (PUBLICAS.includes(c)) return true;
  if (!s) return false;
  return ACESSO[s.papel].some((a) => c.startsWith(a));
}

export const inicioDo = (s: Sessao) => ACESSO[s.papel][0];

const CHAVE = "sac-sessao-v1";
const ouvintes = new Set<() => void>();
let cache: string | undefined;

function ler(): string {
  if (cache !== undefined) return cache;
  try { cache = localStorage.getItem(CHAVE) ?? ""; } catch { cache = ""; }
  return cache;
}
function gravar(v: string) {
  cache = v;
  try { if (v) localStorage.setItem(CHAVE, v); else localStorage.removeItem(CHAVE); } catch { /* ignora */ }
  ouvintes.forEach((o) => o());
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => { if (e.key === CHAVE) { cache = undefined; ouvintes.forEach((o) => o()); } });
}

/** undefined enquanto carrega no navegador; null quando ninguém entrou. */
export function useSessao(): Sessao | null | undefined {
  const bruto = useSyncExternalStore(
    (cb) => { ouvintes.add(cb); return () => ouvintes.delete(cb); },
    ler,
    () => "\u0000",
  );
  if (bruto === "\u0000") return undefined;
  try { return bruto ? (JSON.parse(bruto) as Sessao) : null; } catch { return null; }
}

export function entrar(s: Sessao) {
  if (s.id && (s.papel === "personal" || s.papel === "nutricionista" || s.papel === "fisioterapeuta" || s.papel === "aluno")) {
    definirPerfil({ tipo: s.papel, id: s.id });
  }
  gravar(JSON.stringify(s));
}

export function sair() { gravar(""); }

const semAcento = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** E-mail de acesso de cada pessoa da equipe na demonstração. */
const emailEquipe = (nome: string) => `${semAcento(nome.split(" ")[0])}@novaera.com`;

export type Conta = { email: string; sessao: Sessao; detalhe: string };

/** Contas que existem na demonstração: equipe e alunos ativos. */
export function contasDemo(db: BancoDados): Conta[] {
  const equipe: Conta[] = db.profissionais.map((p) => ({
    email: emailEquipe(p.nome),
    sessao: { papel: p.papel as PapelSessao, id: p.id, nome: p.nome.replace(/\s*\(.*\)$/, "") },
    detalhe: NOME_PAPEL[p.papel as PapelSessao] ?? p.papel,
  }));
  const alunos: Conta[] = db.alunos.map((a) => ({
    email: a.email.toLowerCase(),
    sessao: { papel: "aluno", id: a.id, nome: a.nome },
    detalhe: "Aluno",
  }));
  return [...equipe, ...alunos];
}

export function acharConta(db: BancoDados, email: string): Conta | undefined {
  const e = email.trim().toLowerCase();
  return contasDemo(db).find((c) => c.email === e);
}
