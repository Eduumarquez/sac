"use client";

import { ChevronDown } from "lucide-react";
import { definirPerfil, usePerfil, type TipoPerfil } from "@/lib/db";
import { Avatar } from "./ui";

/** Login de demonstração: mostra quem está usando a tela e permite trocar. */
export function SeletorPessoa({ opcoes, tipo, rotulo }: { opcoes: { id: string; nome: string }[]; tipo: TipoPerfil; rotulo: string }) {
  const escolhido = usePerfil(tipo);
  const atual = opcoes.find((o) => o.id === escolhido) ?? opcoes[0];
  if (!atual) return null;
  return (
    <label className="relative inline-flex cursor-pointer items-center gap-2 rounded-full border border-zinc-200 bg-white py-1 pl-1 pr-3 text-sm shadow-sm hover:border-zinc-300">
      <Avatar nome={atual.nome} tamanho="sm" />
      <span className="flex flex-col leading-tight">
        <span className="text-[11px] text-zinc-400">{rotulo}</span>
        <span className="font-medium text-zinc-800">{atual.nome}</span>
      </span>
      <ChevronDown size={16} className="text-zinc-400" />
      <select aria-label={`${rotulo}: trocar pessoa`} className="absolute inset-0 cursor-pointer opacity-0" value={atual.id} onChange={(e) => definirPerfil({ tipo, id: e.target.value })}>
        {opcoes.map((o) => (
          <option key={o.id} value={o.id}>{o.nome}</option>
        ))}
      </select>
    </label>
  );
}

/** Id da pessoa selecionada (ou a primeira da lista). */
export function usePessoaSelecionada(opcoes: { id: string }[], tipo: TipoPerfil): string | undefined {
  const escolhido = usePerfil(tipo);
  if (escolhido && opcoes.some((o) => o.id === escolhido)) return escolhido;
  return opcoes[0]?.id;
}
