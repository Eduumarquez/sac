"use client";

/**
 * Camada de dados do modo demonstração: tudo fica no localStorage do navegador.
 * As funções de escrita têm a mesma forma que terão com o Supabase, então dá para
 * trocar a implementação depois sem mexer nas telas.
 */
import { useSyncExternalStore } from "react";
import type { BancoDados } from "./tipos";
import { criarBancoDemo } from "./seed";

const CHAVE = "sac-db-v1";
const ouvintes = new Set<() => void>();
let cache: BancoDados | null = null;

function carregar(): BancoDados {
  if (cache) return cache;
  try {
    const salvo = localStorage.getItem(CHAVE);
    if (salvo) {
      cache = migrar(JSON.parse(salvo) as BancoDados);
      return cache;
    }
  } catch {
    /* localStorage indisponível: segue só em memória */
  }
  cache = criarBancoDemo();
  salvar(cache);
  return cache;
}

/** Completa coleções que não existiam em versões anteriores do banco salvo. */
function migrar(db: BancoDados): BancoDados {
  return { ...db, notas: db.notas ?? [], feedbacks: db.feedbacks ?? [] };
}

function salvar(db: BancoDados) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(db));
  } catch {
    /* ignora */
  }
}

/** Aplica uma alteração imutável no banco e avisa as telas. */
export function alterar(fn: (db: BancoDados) => BancoDados) {
  cache = fn(carregar());
  salvar(cache);
  ouvintes.forEach((o) => o());
}

export function reiniciarDemo() {
  cache = criarBancoDemo();
  salvar(cache);
  ouvintes.forEach((o) => o());
}

function assinar(cb: () => void) {
  ouvintes.add(cb);
  const aoMudarOutraAba = (e: StorageEvent) => {
    if (e.key === CHAVE) {
      cache = null;
      cb();
    }
  };
  window.addEventListener("storage", aoMudarOutraAba);
  return () => {
    ouvintes.delete(cb);
    window.removeEventListener("storage", aoMudarOutraAba);
  };
}

/** Retorna o banco (ou null durante a renderização no servidor). */
export function useBanco(): BancoDados | null {
  return useSyncExternalStore(assinar, carregar, () => null);
}

// ---------- pessoa em uso (login de demonstração), uma por tipo ----------

const CHAVE_PERFIL = "sac-perfil-v2";
export type TipoPerfil = "personal" | "nutricionista" | "aluno";
const ouvintesPerfil = new Set<() => void>();
let perfilCache: string | undefined;

function lerPerfis(): string {
  if (perfilCache !== undefined) return perfilCache;
  try {
    perfilCache = localStorage.getItem(CHAVE_PERFIL) ?? "{}";
  } catch {
    perfilCache = "{}";
  }
  return perfilCache;
}

export function definirPerfil(p: { tipo: TipoPerfil; id: string }) {
  const atual = JSON.parse(lerPerfis()) as Partial<Record<TipoPerfil, string>>;
  perfilCache = JSON.stringify({ ...atual, [p.tipo]: p.id });
  try {
    localStorage.setItem(CHAVE_PERFIL, perfilCache);
  } catch {
    /* ignora */
  }
  ouvintesPerfil.forEach((o) => o());
}

/** Id da pessoa escolhida para aquele tipo de perfil, se houver. */
export function usePerfil(tipo: TipoPerfil): string | undefined {
  const bruto = useSyncExternalStore(
    (cb) => {
      ouvintesPerfil.add(cb);
      return () => ouvintesPerfil.delete(cb);
    },
    lerPerfis,
    () => "{}",
  );
  return (JSON.parse(bruto) as Partial<Record<TipoPerfil, string>>)[tipo];
}
