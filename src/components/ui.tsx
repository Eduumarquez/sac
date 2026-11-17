"use client";

import Link from "next/link";
import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { CheckCircle2, Inbox, Loader2, X } from "lucide-react";
import type { NivelRisco } from "@/lib/risco";
import { iniciais } from "@/lib/mascaras";

/* ---------------- estrutura ---------------- */

export function Cartao({ titulo, acao, children, className = "", icone }: { titulo?: ReactNode; acao?: ReactNode; children: ReactNode; className?: string; icone?: ReactNode }) {
  return (
    <section className={`rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm sm:p-5 ${className}`}>
      {(titulo || acao) && (
        <div className="mb-3 flex items-center justify-between gap-2">
          {titulo && (
            <h2 className="flex items-center gap-2 font-semibold text-zinc-900">
              {icone && <span className="text-marca-600">{icone}</span>}
              {titulo}
            </h2>
          )}
          {acao}
        </div>
      )}
      {children}
    </section>
  );
}

export function CabecalhoPagina({ titulo, subtitulo, acao, voltar }: { titulo: ReactNode; subtitulo?: ReactNode; acao?: ReactNode; voltar?: { href: string; rotulo: string } }) {
  return (
    <div className="mb-6">
      {voltar && (
        <Link href={voltar.href} className="mb-3 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900">
          ← {voltar.rotulo}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">{titulo}</h1>
          {subtitulo && <p className="mt-1 text-zinc-500">{subtitulo}</p>}
        </div>
        {acao}
      </div>
    </div>
  );
}

/* ---------------- botões ---------------- */

type Variante = "primario" | "secundario" | "perigo" | "fantasma";
const estilosBotao: Record<Variante, string> = {
  primario: "bg-marca-700 text-white shadow-sm hover:bg-marca-800 disabled:bg-zinc-200 disabled:text-zinc-400 disabled:shadow-none",
  secundario: "border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50 disabled:text-zinc-400",
  perigo: "bg-red-600 text-white hover:bg-red-700",
  fantasma: "text-marca-700 hover:bg-marca-50",
};

export function Botao({ children, variante = "primario", tamanho = "md", icone, className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante; tamanho?: "sm" | "md" | "lg"; icone?: ReactNode }) {
  const t = { sm: "px-2.5 py-1.5 text-sm", md: "px-4 py-2.5 text-sm", lg: "px-5 py-3.5 text-base" }[tamanho];
  return (
    <button {...props} className={`inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors disabled:cursor-not-allowed ${t} ${estilosBotao[variante]} ${className}`}>
      {icone}
      {children}
    </button>
  );
}

export function BotaoLink({ href, children, variante = "primario", icone, className = "" }: { href: string; children: ReactNode; variante?: Variante; icone?: ReactNode; className?: string }) {
  return (
    <Link href={href} className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${estilosBotao[variante]} ${className}`}>
      {icone}
      {children}
    </Link>
  );
}

/* ---------------- formulários ---------------- */

export function Campo({ rotulo, children, dica, erro }: { rotulo: string; children: ReactNode; dica?: string; erro?: string | false }) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium text-zinc-700">{rotulo}</span>
      {children}
      {erro ? <span className="mt-1 block text-xs text-red-600">{erro}</span> : dica && <span className="mt-1 block text-xs text-zinc-500">{dica}</span>}
    </label>
  );
}

export const estiloInput =
  "w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-base sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-marca-500 focus:outline-none focus:ring-4 focus:ring-marca-100";

/* ---------------- etiquetas e indicadores ---------------- */

type Cor = "zinc" | "verde" | "amarelo" | "vermelho" | "azul";
const cores: Record<Cor, string> = {
  zinc: "bg-zinc-100 text-zinc-700",
  verde: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  amarelo: "bg-amber-50 text-amber-800 ring-1 ring-amber-200",
  vermelho: "bg-red-50 text-red-700 ring-1 ring-red-200",
  azul: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
};

export function Etiqueta({ children, cor = "zinc" }: { children: ReactNode; cor?: Cor }) {
  return <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${cores[cor]}`}>{children}</span>;
}

export function EtiquetaRisco({ nivel, pontuacao }: { nivel: NivelRisco; pontuacao: number }) {
  const cor = nivel === "alto" ? "vermelho" : nivel === "medio" ? "amarelo" : "verde";
  const texto = nivel === "alto" ? "Risco alto" : nivel === "medio" ? "Atenção" : "Engajado";
  return (
    <span title={`Pontuação de risco: ${pontuacao} de 100`}>
      <Etiqueta cor={cor}>
        <span className={`h-1.5 w-1.5 rounded-full ${nivel === "alto" ? "bg-red-500" : nivel === "medio" ? "bg-amber-500" : "bg-emerald-500"}`} />
        {texto}
      </Etiqueta>
    </span>
  );
}

export function Indicador({ rotulo, valor, detalhe, icone, destaque }: { rotulo: string; valor: ReactNode; detalhe?: ReactNode; icone?: ReactNode; destaque?: "vermelho" | "verde" }) {
  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{rotulo}</p>
        {icone && <span className={destaque === "vermelho" ? "text-red-500" : "text-marca-600"}>{icone}</span>}
      </div>
      <p className={`mt-2 text-2xl font-bold ${destaque === "vermelho" ? "text-red-600" : "text-zinc-900"}`}>{valor}</p>
      {detalhe && <p className="mt-1 text-xs text-zinc-500">{detalhe}</p>}
    </div>
  );
}

export function Avatar({ nome, tamanho = "md" }: { nome: string; tamanho?: "sm" | "md" | "lg" }) {
  const t = { sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-14 w-14 text-lg" }[tamanho];
  const paleta = ["bg-marca-100 text-marca-800", "bg-sky-100 text-sky-800", "bg-violet-100 text-violet-800", "bg-amber-100 text-amber-800", "bg-rose-100 text-rose-800"];
  const cor = paleta[[...nome].reduce((s, c) => s + c.charCodeAt(0), 0) % paleta.length];
  return <span aria-hidden className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ${t} ${cor}`}>{iniciais(nome)}</span>;
}

export function BarraProgresso({ valor, total, rotulo }: { valor: number; total: number; rotulo?: string }) {
  const pct = total ? Math.round((valor / total) * 100) : 0;
  return (
    <div>
      {rotulo && (
        <div className="mb-1 flex justify-between text-xs text-zinc-500">
          <span>{rotulo}</span>
          <span>{valor} de {total}</span>
        </div>
      )}
      <div className="h-2 overflow-hidden rounded-full bg-zinc-100" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-marca-500 transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function Vazio({ children, icone, acao }: { children: ReactNode; icone?: ReactNode; acao?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-zinc-300 px-4 py-8 text-center">
      <span className="text-zinc-300">{icone ?? <Inbox size={28} />}</span>
      <p className="max-w-sm text-sm text-zinc-500">{children}</p>
      {acao}
    </div>
  );
}

export function Carregando() {
  return (
    <div className="flex items-center justify-center gap-2 p-12 text-sm text-zinc-500">
      <Loader2 className="animate-spin" size={18} /> Carregando...
    </div>
  );
}

export function Abas<T extends string>({ abas, atual, aoTrocar }: { abas: { id: T; rotulo: string; contador?: number }[]; atual: T; aoTrocar: (id: T) => void }) {
  return (
    <div role="tablist" className="mb-5 flex gap-1 overflow-x-auto rounded-xl bg-zinc-100 p-1">
      {abas.map((a) => (
        <button
          key={a.id}
          role="tab"
          aria-selected={a.id === atual}
          onClick={() => aoTrocar(a.id)}
          className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${a.id === atual ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-800"}`}
        >
          {a.rotulo}
          {a.contador ? <span className="rounded-full bg-red-500 px-1.5 text-xs text-white">{a.contador}</span> : null}
        </button>
      ))}
    </div>
  );
}

/* ---------------- avisos (toast) ---------------- */

type Aviso = { id: number; texto: string };
let avisos: Aviso[] = [];
const ouvintesAvisos = new Set<() => void>();
const emitirAvisos = () => ouvintesAvisos.forEach((o) => o());

/** Mostra uma confirmação rápida no rodapé da tela. */
export function avisar(texto: string) {
  const id = Date.now() + Math.random();
  avisos = [...avisos, { id, texto }];
  emitirAvisos();
  setTimeout(() => {
    avisos = avisos.filter((a) => a.id !== id);
    emitirAvisos();
  }, 3000);
}

export function Avisos() {
  const lista = useSyncExternalStore(
    (cb) => { ouvintesAvisos.add(cb); return () => ouvintesAvisos.delete(cb); },
    () => avisos,
    () => avisos,
  );
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex flex-col items-center gap-2 px-4 sm:bottom-6">
      {lista.map((a) => (
        <div key={a.id} className="animar-entrada flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-3 text-sm text-white shadow-lg">
          <CheckCircle2 size={18} className="text-emerald-400" /> {a.texto}
        </div>
      ))}
    </div>
  );
}

/* ---------------- janela de confirmação ---------------- */

export function Confirmacao({ aberta, titulo, texto, rotuloConfirmar, perigoso, aoConfirmar, aoFechar }: { aberta: boolean; titulo: string; texto: ReactNode; rotuloConfirmar: string; perigoso?: boolean; aoConfirmar: () => void; aoFechar: () => void }) {
  useEffect(() => {
    if (!aberta) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && aoFechar();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [aberta, aoFechar]);
  if (!aberta) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={aoFechar}>
      <div role="dialog" aria-modal="true" aria-label={titulo} className="animar-entrada w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-lg font-semibold">{titulo}</h2>
          <button onClick={aoFechar} aria-label="Fechar" className="text-zinc-400 hover:text-zinc-700"><X size={20} /></button>
        </div>
        <div className="mt-2 text-sm text-zinc-600">{texto}</div>
        <div className="mt-5 flex justify-end gap-2">
          <Botao variante="secundario" onClick={aoFechar}>Cancelar</Botao>
          <Botao variante={perigoso ? "perigo" : "primario"} onClick={() => { aoConfirmar(); aoFechar(); }}>{rotuloConfirmar}</Botao>
        </div>
      </div>
    </div>
  );
}

/* ---------------- gráfico ---------------- */

/** Gráfico de linha simples em SVG, com área, pontos e variação. */
export function GraficoLinha({ pontos, unidade, altura = 140, menorEhMelhor }: { pontos: { x: Date; y: number }[]; unidade: string; altura?: number; menorEhMelhor?: boolean }) {
  if (pontos.length < 2) return <Vazio>Registre pelo menos 2 medidas para ver a evolução.</Vazio>;
  const ord = [...pontos].sort((a, b) => a.x.getTime() - b.x.getTime());
  const largura = 320;
  const m = { t: 12, b: 22, l: 6, r: 6 };
  const xs = ord.map((p) => p.x.getTime());
  const ys = ord.map((p) => p.y);
  const [x0, x1] = [Math.min(...xs), Math.max(...xs)];
  let [y0, y1] = [Math.min(...ys), Math.max(...ys)];
  const folga = (y1 - y0) * 0.15 || 1;
  y0 -= folga; y1 += folga;
  const px = (x: number) => m.l + ((x - x0) / (x1 - x0 || 1)) * (largura - m.l - m.r);
  const py = (y: number) => m.t + (1 - (y - y0) / (y1 - y0)) * (altura - m.t - m.b);
  const linha = ord.map((p, i) => `${i ? "L" : "M"}${px(p.x.getTime())},${py(p.y)}`).join(" ");
  const area = `${linha} L${px(x1)},${altura - m.b} L${px(x0)},${altura - m.b} Z`;
  const primeiro = ord[0], ultimo = ord[ord.length - 1];
  const delta = Math.round((ultimo.y - primeiro.y) * 10) / 10;
  const bom = delta === 0 ? null : menorEhMelhor ? delta < 0 : delta > 0;
  return (
    <div>
      <div className="mb-2 flex items-baseline gap-2">
        <span className="text-2xl font-bold">{ultimo.y} <span className="text-sm font-normal text-zinc-500">{unidade}</span></span>
        {delta !== 0 && (
          <span className={`text-sm font-medium ${bom ? "text-emerald-600" : "text-zinc-500"}`}>
            {delta > 0 ? "▲" : "▼"} {Math.abs(delta)} {unidade}
          </span>
        )}
      </div>
      <svg viewBox={`0 0 ${largura} ${altura}`} className="w-full" role="img" aria-label={`Evolução de ${primeiro.y} para ${ultimo.y} ${unidade}`}>
        <defs>
          <linearGradient id="grad-area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#1fa37a" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#1fa37a" stopOpacity={0} />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#grad-area)" />
        <path d={linha} fill="none" stroke="#128763" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        {ord.map((p, i) => (
          <circle key={i} cx={px(p.x.getTime())} cy={py(p.y)} r={i === ord.length - 1 ? 4.5 : 3} fill="white" stroke="#128763" strokeWidth={2}>
            <title>{`${p.x.toLocaleDateString("pt-BR")}: ${p.y} ${unidade}`}</title>
          </circle>
        ))}
        <text x={px(x0)} y={altura - 6} fontSize={10} fill="#a1a1aa">{primeiro.x.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</text>
        <text x={px(x1)} y={altura - 6} fontSize={10} fill="#a1a1aa" textAnchor="end">{ultimo.x.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</text>
      </svg>
    </div>
  );
}

/** Barras verticais simples, com o valor em cima e o rótulo embaixo. */
export function GraficoBarras({ dados, altura = 120, destacarUltimo = true }: { dados: { rotulo: string; valor: number }[]; altura?: number; destacarUltimo?: boolean }) {
  const max = Math.max(1, ...dados.map((d) => d.valor));
  return (
    <div className="flex items-end gap-1.5" style={{ height: altura + 36 }} role="img" aria-label={dados.map((d) => `${d.rotulo}: ${d.valor}`).join(", ")}>
      {dados.map((d, i) => {
        const ultimo = destacarUltimo && i === dados.length - 1;
        return (
          <div key={d.rotulo + i} className="flex flex-1 flex-col items-center justify-end gap-1">
            <span className={`text-xs font-medium ${ultimo ? "text-marca-800" : "text-zinc-500"}`}>{d.valor}</span>
            <div className={`w-full max-w-10 rounded-t-md ${ultimo ? "bg-marca-600" : "bg-marca-200"}`} style={{ height: Math.max(3, (d.valor / max) * altura) }} />
            <span className="whitespace-nowrap text-[10px] text-zinc-400">{d.rotulo}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Barra horizontal com rótulo e valor, para comparar partes de um todo. */
export function BarraHorizontal({ rotulo, valor, total, cor = "bg-marca-500", detalhe }: { rotulo: string; valor: number; total: number; cor?: string; detalhe?: ReactNode }) {
  const pct = total ? Math.round((valor / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm"><span className="text-zinc-700">{rotulo}</span><span className="font-medium text-zinc-900">{detalhe ?? valor}</span></div>
      <div className="h-2 overflow-hidden rounded-full bg-zinc-100"><div className={`h-full rounded-full ${cor}`} style={{ width: `${pct}%` }} /></div>
    </div>
  );
}
