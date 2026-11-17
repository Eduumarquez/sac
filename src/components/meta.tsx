"use client";

import { useState } from "react";
import { Target } from "lucide-react";
import { alterar } from "@/lib/db";
import type { BancoDados, Meta } from "@/lib/tipos";
import { progressoMeta } from "@/lib/regras";
import { dataISO, diasEntre, formatarData, isoAgora, novoId } from "@/lib/datas";
import { Botao, Campo, Cartao, avisar, estiloInput } from "./ui";

const um = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
const unidade = (m: Pick<Meta, "tipo">) => (m.tipo === "peso" ? "kg" : "% de gordura");

/** Barra da meta: de onde saiu, onde está e onde quer chegar. */
export function BarraMeta({ db, meta, claro }: { db: BancoDados; meta: Meta; claro?: boolean }) {
  const { atual, progresso } = progressoMeta(db, meta);
  const faltam = diasEntre(new Date(), new Date(meta.prazo + "T12:00:00"));
  const pct = Math.round(progresso * 100);
  return (
    <div>
      <div className={`flex items-baseline justify-between text-sm ${claro ? "text-white/80" : "text-zinc-500"}`}>
        <span>{um(meta.inicial)}</span>
        <span className={`text-base font-semibold ${claro ? "text-white" : "text-zinc-900"}`}>{um(atual)} {meta.tipo === "peso" ? "kg" : "%"}</span>
        <span>meta {um(meta.alvo)}</span>
      </div>
      <div className={`mt-1.5 h-2.5 overflow-hidden rounded-full ${claro ? "bg-white/20" : "bg-zinc-100"}`} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Progresso da meta">
        <div className={`h-full rounded-full ${claro ? "bg-amber-300" : "bg-marca-500"}`} style={{ width: `${Math.max(3, pct)}%` }} />
      </div>
      <p className={`mt-1.5 text-xs ${claro ? "text-white/70" : "text-zinc-500"}`}>
        {pct}% do caminho · {faltam >= 0 ? `faltam ${faltam} dias (até ${formatarData(meta.prazo)})` : `prazo era ${formatarData(meta.prazo)}`}
      </p>
    </div>
  );
}

/** Meta única do aluno, criada e ajustada por personal ou nutricionista. */
export function MetaAluno({ db, alunoId, autorId }: { db: BancoDados; alunoId: string; autorId: string }) {
  const meta = db.metas.find((m) => m.alunoId === alunoId);
  const [editando, setEditando] = useState(false);
  const [tipo, setTipo] = useState<Meta["tipo"]>(meta?.tipo ?? "peso");
  const [alvo, setAlvo] = useState(meta ? String(meta.alvo) : "");
  const [prazo, setPrazo] = useState(meta?.prazo ?? dataISO(new Date(Date.now() + 90 * 86_400_000)));
  const autor = db.profissionais.find((p) => p.id === meta?.criadaPorId);

  function salvar() {
    const v = Number(alvo.replace(",", "."));
    if (!v) return;
    alterar((d) => {
      const base = { ...d, metas: d.metas.filter((m) => m.alunoId !== alunoId) };
      const inicial = meta && meta.tipo === tipo ? meta.inicial : progressoMeta(d, { id: "", alunoId, tipo, inicial: v, alvo: v, prazo, criadaPorId: autorId, criadaEm: "0000" }).atual;
      return {
        ...base,
        metas: [...base.metas, { id: meta?.id ?? novoId(), alunoId, tipo, inicial, alvo: v, prazo, criadaPorId: autorId, criadaEm: meta && meta.tipo === tipo ? meta.criadaEm : isoAgora() }],
        notas: [...d.notas, { id: novoId(), alunoId, autorId, data: isoAgora(), texto: `Meta ${meta ? "ajustada" : "definida"}: ${um(v)} ${unidade({ tipo })} até ${formatarData(prazo)}.` }],
      };
    });
    avisar("Meta salva. A equipe e o aluno já veem.");
    setEditando(false);
  }

  return (
    <Cartao titulo="Meta da equipe" icone={<Target size={18} />}
      acao={!editando && <button className="rounded-lg px-2 py-1 text-sm font-medium text-marca-700 hover:bg-marca-50" onClick={() => setEditando(true)}>{meta ? "Ajustar" : "Definir meta"}</button>}>
      {editando ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <Campo rotulo="Medida">
            <select className={estiloInput} value={tipo} onChange={(e) => setTipo(e.target.value as Meta["tipo"])}>
              <option value="peso">Peso (kg)</option>
              <option value="gordura">Gordura (%)</option>
            </select>
          </Campo>
          <Campo rotulo="Chegar em"><input className={estiloInput} inputMode="decimal" value={alvo} onChange={(e) => setAlvo(e.target.value)} placeholder={tipo === "peso" ? "Ex.: 75" : "Ex.: 20"} /></Campo>
          <Campo rotulo="Até"><input type="date" className={estiloInput} value={prazo} onChange={(e) => setPrazo(e.target.value)} /></Campo>
          <div className="flex gap-2 sm:col-span-3">
            <Botao onClick={salvar} disabled={!alvo}>Salvar meta</Botao>
            <Botao variante="secundario" onClick={() => setEditando(false)}>Cancelar</Botao>
          </div>
        </div>
      ) : meta ? (
        <>
          <BarraMeta db={db} meta={meta} />
          <p className="mt-2 text-xs text-zinc-400">Definida por {autor?.nome ?? "equipe"}. Personal, nutricionista e aluno acompanham a mesma meta.</p>
        </>
      ) : (
        <p className="text-sm text-zinc-500">Defina uma meta só para o aluno. Personal e nutricionista trabalham em cima dela, e o aluno acompanha no app.</p>
      )}
    </Cartao>
  );
}
