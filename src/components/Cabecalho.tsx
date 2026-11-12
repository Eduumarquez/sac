"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { reiniciarDemo } from "@/lib/db";

const LINKS = [
  { href: "/matricula/", rotulo: "Matrícula" },
  { href: "/painel/", rotulo: "Academia" },
  { href: "/personal/", rotulo: "Personal" },
  { href: "/nutricionista/", rotulo: "Nutricionista" },
  { href: "/aluno/", rotulo: "Aluno" },
];

export function Cabecalho() {
  const caminho = usePathname();
  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-4 overflow-x-auto px-4 py-3">
        <Link href="/" className="text-lg font-bold text-teal-800">SAC</Link>
        <nav className="flex gap-1">
          {LINKS.map((l) => {
            const ativo = caminho?.startsWith(l.href.replace(/\/$/, ""));
            return (
              <Link key={l.href} href={l.href} className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 text-sm ${ativo ? "bg-teal-50 font-medium text-teal-800" : "text-zinc-600 hover:bg-zinc-100"}`}>
                {l.rotulo}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={() => {
            reiniciarDemo();
          }}
          className="ml-auto whitespace-nowrap text-xs text-zinc-400 hover:text-zinc-700"
          title="Apaga as alterações e volta aos dados de exemplo"
        >
          Reiniciar demonstração
        </button>
      </div>
    </header>
  );
}
