"use client";

import { definirPerfil, usePerfil, type TipoPerfil } from "@/lib/db";
import { estiloInput } from "./ui";

/** Login de demonstração: escolhe quem está usando a tela. */
export function SeletorPessoa({ opcoes, tipo, rotulo }: { opcoes: { id: string; nome: string }[]; tipo: TipoPerfil; rotulo: string }) {
  const escolhido = usePerfil(tipo);
  const atual = escolhido && opcoes.some((o) => o.id === escolhido) ? escolhido : opcoes[0]?.id;
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-zinc-500">{rotulo}</span>
      <select className={`${estiloInput} w-auto`} value={atual ?? ""} onChange={(e) => definirPerfil({ tipo, id: e.target.value })}>
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
