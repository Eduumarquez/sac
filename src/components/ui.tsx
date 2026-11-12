"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { NivelRisco } from "@/lib/risco";

export function Cartao({ titulo, acao, children, className = "" }: { titulo?: ReactNode; acao?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-zinc-200 bg-white p-4 ${className}`}>
      {(titulo || acao) && (
        <div className="mb-3 flex items-center justify-between gap-2">
          {titulo && <h2 className="font-semibold">{titulo}</h2>}
          {acao}
        </div>
      )}
      {children}
    </section>
  );
}

export function Botao({ children, variante = "primario", className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variante?: "primario" | "secundario" | "perigo" }) {
  const estilos = {
    primario: "bg-teal-700 text-white hover:bg-teal-800 disabled:bg-zinc-300",
    secundario: "border border-zinc-300 bg-white hover:bg-zinc-50",
    perigo: "bg-red-600 text-white hover:bg-red-700",
  }[variante];
  return (
    <button {...props} className={`rounded-lg px-3 py-2 text-sm font-medium ${estilos} ${className}`}>
      {children}
    </button>
  );
}

export function BotaoLink({ href, children, variante = "primario" }: { href: string; children: ReactNode; variante?: "primario" | "secundario" }) {
  const estilos = variante === "primario" ? "bg-teal-700 text-white hover:bg-teal-800" : "border border-zinc-300 bg-white hover:bg-zinc-50";
  return (
    <Link href={href} className={`inline-block rounded-lg px-3 py-2 text-sm font-medium ${estilos}`}>
      {children}
    </Link>
  );
}

export function Campo({ rotulo, children, dica }: { rotulo: string; children: ReactNode; dica?: string }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-zinc-700">{rotulo}</span>
      {children}
      {dica && <span className="mt-1 block text-xs text-zinc-500">{dica}</span>}
    </label>
  );
}

export const estiloInput = "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-teal-600 focus:outline-none";

export function Etiqueta({ children, cor = "zinc" }: { children: ReactNode; cor?: "zinc" | "verde" | "amarelo" | "vermelho" | "azul" }) {
  const c = {
    zinc: "bg-zinc-100 text-zinc-700",
    verde: "bg-emerald-100 text-emerald-800",
    amarelo: "bg-amber-100 text-amber-800",
    vermelho: "bg-red-100 text-red-800",
    azul: "bg-sky-100 text-sky-800",
  }[cor];
  return <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${c}`}>{children}</span>;
}

export function EtiquetaRisco({ nivel, pontuacao }: { nivel: NivelRisco; pontuacao: number }) {
  const cor = nivel === "alto" ? "vermelho" : nivel === "medio" ? "amarelo" : "verde";
  return <Etiqueta cor={cor}>risco {nivel === "medio" ? "médio" : nivel} · {pontuacao}</Etiqueta>;
}

export function Indicador({ rotulo, valor, detalhe }: { rotulo: string; valor: ReactNode; detalhe?: ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <p className="text-xs text-zinc-500">{rotulo}</p>
      <p className="mt-1 text-2xl font-bold">{valor}</p>
      {detalhe && <p className="mt-1 text-xs text-zinc-500">{detalhe}</p>}
    </div>
  );
}

export function Vazio({ children }: { children: ReactNode }) {
  return <p className="rounded-lg border border-dashed border-zinc-300 p-4 text-center text-sm text-zinc-500">{children}</p>;
}

export function Carregando() {
  return <p className="p-8 text-center text-sm text-zinc-500">Carregando...</p>;
}

export function Abas<T extends string>({ abas, atual, aoTrocar }: { abas: { id: T; rotulo: string }[]; atual: T; aoTrocar: (id: T) => void }) {
  return (
    <div className="mb-4 flex gap-1 overflow-x-auto border-b border-zinc-200">
      {abas.map((a) => (
        <button
          key={a.id}
          onClick={() => aoTrocar(a.id)}
          className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium ${a.id === atual ? "border-teal-700 text-teal-800" : "border-transparent text-zinc-500 hover:text-zinc-800"}`}
        >
          {a.rotulo}
        </button>
      ))}
    </div>
  );
}

/** Gráfico de linha simples em SVG, com pontos e rótulos de início e fim. */
export function GraficoLinha({ pontos, unidade, altura = 120 }: { pontos: { x: Date; y: number }[]; unidade: string; altura?: number }) {
  if (pontos.length < 2) return <Vazio>Registre pelo menos 2 medidas para ver o gráfico.</Vazio>;
  const ord = [...pontos].sort((a, b) => a.x.getTime() - b.x.getTime());
  const largura = 320;
  const m = { t: 16, b: 20, l: 8, r: 8 };
  const xs = ord.map((p) => p.x.getTime());
  const ys = ord.map((p) => p.y);
  const [x0, x1] = [Math.min(...xs), Math.max(...xs)];
  let [y0, y1] = [Math.min(...ys), Math.max(...ys)];
  if (y0 === y1) { y0 -= 1; y1 += 1; }
  const px = (x: number) => m.l + ((x - x0) / (x1 - x0 || 1)) * (largura - m.l - m.r);
  const py = (y: number) => m.t + (1 - (y - y0) / (y1 - y0)) * (altura - m.t - m.b);
  const d = ord.map((p, i) => `${i ? "L" : "M"}${px(p.x.getTime())},${py(p.y)}`).join(" ");
  const primeiro = ord[0], ultimo = ord[ord.length - 1];
  const delta = ultimo.y - primeiro.y;
  return (
    <div>
      <svg viewBox={`0 0 ${largura} ${altura}`} className="w-full" role="img" aria-label={`Evolução de ${primeiro.y} para ${ultimo.y} ${unidade}`}>
        <path d={d} fill="none" stroke="#0f766e" strokeWidth={2} />
        {ord.map((p, i) => (
          <circle key={i} cx={px(p.x.getTime())} cy={py(p.y)} r={3} fill="#0f766e" />
        ))}
        <text x={px(primeiro.x.getTime())} y={altura - 4} fontSize={10} fill="#71717a">{primeiro.x.toLocaleDateString("pt-BR")}</text>
        <text x={px(ultimo.x.getTime())} y={altura - 4} fontSize={10} fill="#71717a" textAnchor="end">{ultimo.x.toLocaleDateString("pt-BR")}</text>
      </svg>
      <p className="mt-1 text-sm text-zinc-600">
        {primeiro.y} → <strong>{ultimo.y} {unidade}</strong>{" "}
        <span className={delta === 0 ? "" : delta > 0 ? "text-sky-700" : "text-emerald-700"}>
          ({delta > 0 ? "+" : ""}{Math.round(delta * 10) / 10} {unidade})
        </span>
      </p>
    </div>
  );
}
