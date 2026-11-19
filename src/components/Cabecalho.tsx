"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Apple, Building2, ClipboardSignature, Dumbbell, LogIn, LogOut, Menu, RotateCcw, ScanLine, Smartphone, Stethoscope, X } from "lucide-react";
import { reiniciarDemo } from "@/lib/db";
import { ACESSO, NOME_PAPEL, sair, useSessao } from "@/lib/sessao";
import { Confirmacao, avisar } from "./ui";

export const AREAS = [
  { href: "/matricula/", rotulo: "Matrícula", icone: ClipboardSignature },
  { href: "/painel/", rotulo: "Academia", icone: Building2 },
  { href: "/recepcao/", rotulo: "Recepção", icone: ScanLine },
  { href: "/personal/", rotulo: "Personal", icone: Dumbbell },
  { href: "/nutricionista/", rotulo: "Nutricionista", icone: Apple },
  { href: "/fisioterapia/", rotulo: "Fisioterapia", icone: Stethoscope },
  { href: "/aluno/", rotulo: "App do aluno", icone: Smartphone },
];

export function Cabecalho() {
  const caminho = usePathname() ?? "/";
  const [menu, setMenu] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const sessao = useSessao();
  const router = useRouter();
  const areas = sessao && sessao.papel !== "aluno" ? AREAS.filter((a) => ACESSO[sessao.papel].includes(a.href)) : [];
  const ativa = areas.find((a) => caminho.startsWith(a.href.replace(/\/$/, "")));
  const demo = sessao?.papel === "demo";
  useEffect(() => setMenu(false), [caminho]);
  function fazerSaida() { sair(); setMenu(false); router.push("/entrar/"); avisar("Você saiu"); }

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-zinc-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-marca-700 text-sm text-white">S</span>
          <span className="hidden sm:inline">SAC</span>
        </Link>

        {ativa && areas.length > 1 && (
          <span className="flex items-center gap-1.5 text-sm font-medium text-zinc-700 lg:hidden">
            <ativa.icone size={16} className="text-marca-600" /> {ativa.rotulo}
          </span>
        )}

        <nav aria-label="Áreas do sistema" className="ml-4 hidden gap-1 lg:flex">
          {areas.length > 1 && areas.map((a) => {
            const on = a === ativa;
            return (
              <Link key={a.href} href={a.href} aria-current={on ? "page" : undefined} className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition-colors ${on ? "bg-marca-50 font-medium text-marca-800" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"}`}>
                <a.icone size={16} /> {a.rotulo}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          {demo && (
            <button onClick={() => setConfirmar(true)} title="Reiniciar demonstração" aria-label="Reiniciar demonstração" className="hidden rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 lg:flex">
              <RotateCcw size={16} />
            </button>
          )}
          {sessao && !demo && (
            <span className="hidden flex-col items-end text-right leading-tight sm:flex">
              <span className="text-sm font-medium text-zinc-800">{sessao.nome}</span>
              <span className="text-[11px] text-zinc-400">{NOME_PAPEL[sessao.papel]}</span>
            </span>
          )}
          {sessao ? (
            <button onClick={fazerSaida} className={`items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 ${areas.length > 1 ? "hidden lg:flex" : "flex"}`}>
              <LogOut size={16} /> Sair
            </button>
          ) : sessao === null && caminho !== "/entrar/" && (
            <Link href="/entrar/" className="flex items-center gap-1.5 rounded-lg bg-marca-700 px-3 py-2 text-sm font-medium text-white hover:bg-marca-800">
              <LogIn size={16} /> Entrar
            </Link>
          )}
          {areas.length > 1 && (
            <button onClick={() => setMenu(!menu)} aria-label={menu ? "Fechar menu" : "Abrir menu"} aria-expanded={menu} className="rounded-lg p-2 text-zinc-700 hover:bg-zinc-100 lg:hidden">
              {menu ? <X size={22} /> : <Menu size={22} />}
            </button>
          )}
        </div>
      </div>

      {menu && (
        <div className="animar-entrada border-t border-zinc-100 bg-white px-4 pb-4 pt-2 shadow-lg lg:hidden">
          <nav aria-label="Áreas do sistema" className="grid gap-1">
            {areas.map((a) => (
              <Link key={a.href} href={a.href} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-base ${a === ativa ? "bg-marca-50 font-medium text-marca-800" : "text-zinc-700"}`}>
                <a.icone size={20} /> {a.rotulo}
              </Link>
            ))}
          </nav>
          {demo && (
            <button onClick={() => setConfirmar(true)} className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-zinc-500">
              <RotateCcw size={18} /> Reiniciar demonstração
            </button>
          )}
          <button onClick={fazerSaida} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-zinc-700">
            <LogOut size={18} /> Sair{sessao ? ` (${sessao.nome})` : ""}
          </button>
        </div>
      )}

      <Confirmacao
        aberta={confirmar}
        titulo="Reiniciar a demonstração?"
        texto="Matrículas, treinos e registros feitos neste navegador serão apagados e os dados de exemplo voltam ao início."
        rotuloConfirmar="Reiniciar"
        perigoso
        aoConfirmar={() => { reiniciarDemo(); avisar("Demonstração reiniciada"); }}
        aoFechar={() => setConfirmar(false)}
      />
    </header>
  );
}
