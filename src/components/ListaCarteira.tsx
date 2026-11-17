"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { Avatar } from "./ui";

export type ItemCarteira = { id: string; nome: string; href: string; linha: ReactNode; etiquetas: ReactNode; urgente: boolean };

/** Lista de alunos de um profissional, separando quem precisa de ação de quem está em dia. */
export function ListaCarteira({ itens, vazio }: { itens: ItemCarteira[]; vazio: ReactNode }) {
  if (!itens.length) return <>{vazio}</>;
  const grupos = [
    { titulo: "Precisam de você", lista: itens.filter((i) => i.urgente) },
    { titulo: "Em dia", lista: itens.filter((i) => !i.urgente) },
  ].filter((g) => g.lista.length);
  return (
    <div className="space-y-6">
      {grupos.map((g) => (
        <section key={g.titulo}>
          <h2 className="mb-2 text-sm font-semibold text-zinc-500">{g.titulo} · {g.lista.length}</h2>
          <ul className="divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
            {g.lista.map((i) => (
              <li key={i.id}>
                <Link href={i.href} className="flex items-center gap-3 px-4 py-3.5 hover:bg-zinc-50">
                  <Avatar nome={i.nome} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-zinc-900">{i.nome}</p>
                    <p className="truncate text-sm text-zinc-500">{i.linha}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">{i.etiquetas}</div>
                  </div>
                  <ChevronRight size={18} className="shrink-0 text-zinc-300" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
