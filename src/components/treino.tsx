"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, PlayCircle, Repeat2, Timer, X } from "lucide-react";
import type { DivisaoTreino, RegistroCarga } from "@/lib/tipos";
import { infoExercicio, linkVideo } from "@/lib/exercicios";
import { BarraProgresso, Cartao } from "./ui";

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/** Barra flutuante com a contagem do descanso entre séries. */
function Descanso({ fim, total, aoMudar, aoParar }: { fim: number; total: number; aoMudar: (fim: number) => void; aoParar: () => void }) {
  const [agora, setAgora] = useState(() => Date.now());
  const avisou = useRef(false);
  useEffect(() => {
    const t = setInterval(() => setAgora(Date.now()), 250);
    return () => clearInterval(t);
  }, []);
  const resta = Math.max(0, Math.ceil((fim - agora) / 1000));
  useEffect(() => {
    if (resta === 0 && !avisou.current) {
      avisou.current = true;
      try { navigator.vibrate?.([200, 100, 200]); } catch { /* sem vibração */ }
    }
  }, [resta]);
  const pct = Math.min(100, ((total - resta) / total) * 100);
  return (
    <div role="timer" aria-live="polite" className="fixed inset-x-3 bottom-20 z-40 mx-auto max-w-md overflow-hidden rounded-2xl bg-zinc-900 text-white shadow-2xl sm:bottom-6">
      <div className="h-1 bg-white/10"><div className="h-full bg-marca-400 transition-all" style={{ width: `${pct}%` }} /></div>
      <div className="flex items-center gap-3 px-4 py-3">
        <Timer size={20} className={resta === 0 ? "text-marca-300" : "text-white/70"} />
        <div className="flex-1">
          <p className="text-xs text-white/60">{resta === 0 ? "Descanso terminou" : "Descanso"}</p>
          <p className="text-2xl font-bold tabular-nums leading-none">{resta === 0 ? "Bora! 💪" : mmss(resta)}</p>
        </div>
        {resta > 0 && <button onClick={() => aoMudar(fim + 15_000)} className="rounded-lg bg-white/10 px-3 py-2 text-sm font-medium hover:bg-white/20">+15s</button>}
        <button onClick={aoParar} aria-label="Fechar descanso" className="rounded-lg p-2 text-white/70 hover:bg-white/10">{resta === 0 ? <Check size={18} /> : <X size={18} />}</button>
      </div>
    </div>
  );
}

/**
 * Sessão de treino do dia: séries marcadas uma a uma com descanso automático,
 * execução de cada exercício, vídeo e troca quando o aparelho está ocupado.
 */
export function SessaoTreino({ divisao, ultimasCargas, comCarga, aoConcluir, aoRegistrarCarga }: {
  divisao: DivisaoTreino;
  ultimasCargas: RegistroCarga[];
  comCarga: boolean;
  aoConcluir: () => void;
  aoRegistrarCarga?: (exercicio: string, kg: number) => void;
}) {
  const [series, setSeries] = useState<Record<string, number>>({});
  const [trocas, setTrocas] = useState<Record<string, string>>({});
  const [aberto, setAberto] = useState<string | null>(null);
  const [descanso, setDescanso] = useState<{ fim: number; total: number } | null>(null);
  const [cargas, setCargas] = useState<Record<string, string>>({});
  const concluiu = useRef(false);

  const feitos = divisao.exercicios.filter((e) => (series[e.exercicio] ?? 0) >= e.series).length;

  function marcar(ex: string, total: number, alvo: number) {
    const novo = { ...series, [ex]: alvo };
    setSeries(novo);
    const nome = trocas[ex] ?? ex;
    const seg = infoExercicio(nome)?.descansoSeg ?? 60;
    const terminouExercicio = alvo >= total;
    const terminouTudo = divisao.exercicios.every((e) => (novo[e.exercicio] ?? 0) >= e.series);
    if (terminouTudo) {
      setDescanso(null);
      if (!concluiu.current) { concluiu.current = true; aoConcluir(); }
      return;
    }
    if (alvo > (series[ex] ?? 0) && seg > 0) setDescanso({ fim: Date.now() + (terminouExercicio ? Math.max(seg, 60) : seg) * 1000, total: terminouExercicio ? Math.max(seg, 60) : seg });
    if (terminouExercicio && aberto === ex) setAberto(null);
  }

  return (
    <>
      <Cartao>
        <BarraProgresso valor={feitos} total={divisao.exercicios.length} rotulo="Exercícios feitos" />
        <ul className="mt-3 divide-y divide-zinc-100">
          {divisao.exercicios.map((e) => {
            const nome = trocas[e.exercicio] ?? e.exercicio;
            const info = infoExercicio(nome);
            const feitasSeries = series[e.exercicio] ?? 0;
            const feito = feitasSeries >= e.series;
            const ultima = ultimasCargas.filter((r) => r.exercicio === nome).sort((a, b) => b.data.localeCompare(a.data))[0];
            const carga = ultima?.cargaKg ?? (nome === e.exercicio ? e.cargaKg : undefined);
            const expandido = aberto === e.exercicio;
            return (
              <li key={e.exercicio} className="py-3">
                <div className="flex items-start gap-3">
                  <button onClick={() => marcar(e.exercicio, e.series, feito ? 0 : e.series)} aria-pressed={feito} aria-label={`Marcar ${nome} como feito`}
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition ${feito ? "border-marca-600 bg-marca-600 text-white" : "border-zinc-300 hover:border-marca-500"}`}>
                    {feito && <Check size={16} />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <button onClick={() => setAberto(expandido ? null : e.exercicio)} aria-expanded={expandido} className="flex w-full items-start justify-between gap-2 text-left">
                      <span>
                        <span className={`font-medium ${feito ? "text-zinc-400 line-through" : "text-zinc-900"}`}>{nome}</span>
                        {nome !== e.exercicio && <span className="ml-2 rounded-full bg-sky-50 px-2 py-0.5 text-xs text-sky-700">no lugar de {e.exercicio}</span>}
                        <span className="block text-sm text-zinc-500">
                          {e.series} séries × {e.repeticoes}{carga != null && <> · <strong className="text-zinc-700">{carga} kg</strong></>}
                        </span>
                      </span>
                      <ChevronDown size={18} className={`mt-1 shrink-0 text-zinc-400 transition ${expandido ? "rotate-180" : ""}`} />
                    </button>

                    {!feito && e.series > 1 && (
                      <div className="mt-2 flex flex-wrap gap-1.5" aria-label="Séries">
                        {Array.from({ length: e.series }, (_, i) => (
                          <button key={i} onClick={() => marcar(e.exercicio, e.series, i < feitasSeries ? i : i + 1)} aria-pressed={i < feitasSeries} aria-label={`Série ${i + 1}`}
                            className={`h-9 min-w-9 rounded-lg px-2 text-sm font-semibold transition ${i < feitasSeries ? "bg-marca-600 text-white" : i === feitasSeries ? "bg-marca-50 text-marca-800 ring-2 ring-marca-300" : "bg-zinc-100 text-zinc-500"}`}>
                            {i < feitasSeries ? <Check size={14} className="mx-auto" /> : i + 1}
                          </button>
                        ))}
                      </div>
                    )}

                    {expandido && info && (
                      <div className="animar-entrada mt-3 space-y-3 rounded-xl bg-zinc-50 p-3 text-sm">
                        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{info.grupo} · como fazer</p>
                        <ol className="list-decimal space-y-1 pl-5 text-zinc-700">{info.passos.map((p) => <li key={p}>{p}</li>)}</ol>
                        <p className="rounded-lg bg-amber-50 p-2 text-amber-900"><strong>Dica:</strong> {info.dica}</p>
                        <a href={linkVideo(nome)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-medium text-marca-700 hover:underline">
                          <PlayCircle size={18} /> Ver vídeos da execução
                        </a>
                        {info.alternativas.length > 0 && (
                          <div>
                            <p className="mb-1.5 flex items-center gap-1.5 font-medium text-zinc-700"><Repeat2 size={16} /> Aparelho ocupado? Troque por:</p>
                            <div className="flex flex-wrap gap-1.5">
                              {info.alternativas.map((alt) => (
                                <button key={alt} onClick={() => { setTrocas({ ...trocas, [e.exercicio]: alt }); setAberto(null); }} className="rounded-full bg-white px-3 py-1.5 text-sm ring-1 ring-zinc-200 hover:ring-marca-400">{alt}</button>
                              ))}
                              {nome !== e.exercicio && <button onClick={() => { const t = { ...trocas }; delete t[e.exercicio]; setTrocas(t); }} className="rounded-full px-3 py-1.5 text-sm text-zinc-500 underline">Voltar para {e.exercicio}</button>}
                            </div>
                          </div>
                        )}
                        {comCarga && aoRegistrarCarga && carga != null && (
                          <div className="flex items-center gap-2">
                            <input inputMode="decimal" aria-label={`Nova carga em ${nome}`} placeholder="Nova carga" value={cargas[nome] ?? ""}
                              onChange={(ev) => setCargas({ ...cargas, [nome]: ev.target.value })}
                              className="w-28 rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-base focus:border-marca-500 focus:outline-none sm:text-sm" />
                            <span className="text-zinc-400">kg</span>
                            {cargas[nome] && <button onClick={() => { const v = Number(cargas[nome].replace(",", ".")); if (v) { aoRegistrarCarga(nome, v); setCargas({ ...cargas, [nome]: "" }); } }} className="rounded-lg bg-marca-50 px-3 py-1.5 font-medium text-marca-800">Salvar</button>}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </Cartao>
      {descanso && <Descanso key={descanso.fim - descanso.total * 1000} fim={descanso.fim} total={descanso.total} aoMudar={(fim) => setDescanso({ fim, total: descanso.total + 15 })} aoParar={() => setDescanso(null)} />}
    </>
  );
}
