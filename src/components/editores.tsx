"use client";

import { useState } from "react";
import { alterar } from "@/lib/db";
import { dataISO, isoAgora, novoId } from "@/lib/datas";
import type { DivisaoTreino, PlanoAlimentar, Refeicao, Treino } from "@/lib/tipos";
import { Plus, Trash2 } from "lucide-react";
import { Botao, Campo, avisar, estiloInput } from "./ui";

export function EditorTreino({ alunoId, personalId, atual, aoSalvar }: { alunoId: string; personalId: string; atual?: Treino; aoSalvar: () => void }) {
  const [divisoes, setDivisoes] = useState<DivisaoTreino[]>(
    atual ? structuredClone(atual.divisoes) : [{ nome: "A", exercicios: [{ exercicio: "", series: 3, repeticoes: "12" }] }],
  );
  const mudar = (fn: (d: DivisaoTreino[]) => void) => setDivisoes((x) => { const c = structuredClone(x); fn(c); return c; });

  function salvar() {
    const limpas = divisoes
      .map((d) => ({ ...d, exercicios: d.exercicios.filter((e) => e.exercicio.trim()) }))
      .filter((d) => d.exercicios.length);
    const novo: Treino = { id: novoId(), alunoId, personalId, nome: "Treino atual", criadoEm: isoAgora(), ativo: true, divisoes: limpas };
    alterar((db) => ({ ...db, treinos: [...db.treinos.map((t) => (t.alunoId === alunoId ? { ...t, ativo: false } : t)), novo] }));
    avisar("Treino salvo. O aluno já vê no app.");
    aoSalvar();
  }

  return (
    <div className="space-y-4">
      {divisoes.map((d, i) => (
        <div key={i} className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-3">
          <div className="flex gap-2">
            <input className={estiloInput} value={d.nome} onChange={(e) => mudar((x) => { x[i].nome = e.target.value; })} placeholder="Nome da divisão (ex.: A - Peito)" />
            <Botao variante="secundario" aria-label="Remover divisão" onClick={() => mudar((x) => { x.splice(i, 1); })} icone={<Trash2 size={16} />}><span className="hidden sm:inline">Remover</span></Botao>
          </div>
          <div className="mt-3 hidden grid-cols-12 gap-1 px-1 text-xs text-zinc-400 sm:grid"><span className="col-span-5">Exercício</span><span className="col-span-2">Séries</span><span className="col-span-2">Reps</span><span className="col-span-2">Carga (kg)</span></div>
          <div className="mt-2 space-y-2">
            {d.exercicios.map((e, j) => (
              <div key={j} className="grid grid-cols-12 gap-1">
                <input className={`${estiloInput} col-span-12 sm:col-span-5`} placeholder="Exercício" aria-label="Exercício" value={e.exercicio} onChange={(ev) => mudar((x) => { x[i].exercicios[j].exercicio = ev.target.value; })} />
                <input className={`${estiloInput} col-span-3 sm:col-span-2`} type="number" min={1} title="Séries" aria-label="Séries" placeholder="Séries" value={e.series} onChange={(ev) => mudar((x) => { x[i].exercicios[j].series = Number(ev.target.value); })} />
                <input className={`${estiloInput} col-span-3 sm:col-span-2`} title="Repetições" aria-label="Repetições" placeholder="Reps" value={e.repeticoes} onChange={(ev) => mudar((x) => { x[i].exercicios[j].repeticoes = ev.target.value; })} />
                <input className={`${estiloInput} col-span-4 sm:col-span-2`} type="number" step="0.5" placeholder="kg" aria-label="Carga em kg" value={e.cargaKg ?? ""} onChange={(ev) => mudar((x) => { x[i].exercicios[j].cargaKg = ev.target.value ? Number(ev.target.value) : undefined; })} />
                <button className="col-span-2 flex items-center justify-center text-zinc-400 hover:text-red-600 sm:col-span-1" onClick={() => mudar((x) => { x[i].exercicios.splice(j, 1); })} aria-label="Remover exercício"><Trash2 size={16} /></button>
              </div>
            ))}
            <button className="inline-flex items-center gap-1 text-sm font-medium text-marca-700 hover:underline" onClick={() => mudar((x) => { x[i].exercicios.push({ exercicio: "", series: 3, repeticoes: "12" }); })}><Plus size={16} /> Adicionar exercício</button>
          </div>
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
        <Botao variante="secundario" onClick={() => mudar((x) => { x.push({ nome: String.fromCharCode(65 + x.length), exercicios: [{ exercicio: "", series: 3, repeticoes: "12" }] }); })}>+ divisão</Botao>
        <Botao onClick={salvar}>Salvar novo treino</Botao>
      </div>
      <p className="text-xs text-zinc-500">Colunas: exercício, séries, repetições e carga. Salvar cria uma nova versão e arquiva a anterior.</p>
    </div>
  );
}

export function FormAvaliacao({ alunoId, personalId, alturaAnterior, aoSalvar }: { alunoId: string; personalId: string; alturaAnterior?: number; aoSalvar: () => void }) {
  const [v, setV] = useState<Record<string, string>>({ altura: alturaAnterior ? String(alturaAnterior) : "" });
  const n = (k: string) => (v[k] ? Number(v[k].replace(",", ".")) : undefined);
  const valido = !!n("peso") && !!n("altura");
  const campos: [string, string][] = [["peso", "Peso (kg)"], ["altura", "Altura (cm)"], ["gordura", "Gordura (%)"], ["cintura", "Cintura (cm)"], ["quadril", "Quadril (cm)"], ["braco", "Braço (cm)"], ["coxa", "Coxa (cm)"]];
  function salvar() {
    alterar((db) => ({
      ...db,
      avaliacoes: [...db.avaliacoes, {
        id: novoId(), alunoId, personalId, data: isoAgora(), pesoKg: n("peso")!, alturaCm: n("altura")!, gorduraPct: n("gordura"),
        cinturaCm: n("cintura"), quadrilCm: n("quadril"), bracoCm: n("braco"), coxaCm: n("coxa"), observacoes: v.obs,
      }],
    }));
    avisar("Avaliação registrada");
    aoSalvar();
  }
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {campos.map(([k, r]) => (
          <Campo key={k} rotulo={r}><input className={estiloInput} inputMode="decimal" value={v[k] ?? ""} onChange={(e) => setV({ ...v, [k]: e.target.value })} /></Campo>
        ))}
      </div>
      <Campo rotulo="Observações"><textarea className={estiloInput} rows={2} value={v.obs ?? ""} onChange={(e) => setV({ ...v, obs: e.target.value })} /></Campo>
      <Botao disabled={!valido} onClick={salvar}>Salvar avaliação</Botao>
    </div>
  );
}

export function EditorPlanoAlimentar({ alunoId, nutricionistaId, atual, aoSalvar }: { alunoId: string; nutricionistaId: string; atual?: PlanoAlimentar; aoSalvar: () => void }) {
  const [meta, setMeta] = useState(String(atual?.metaKcal ?? 1800));
  const [prot, setProt] = useState(String(atual?.proteinaG ?? ""));
  const [orient, setOrient] = useState(atual?.orientacoes ?? "");
  const [refeicoes, setRefeicoes] = useState<Refeicao[]>(atual ? structuredClone(atual.refeicoes) : [
    { nome: "Café da manhã", horario: "07:00", itens: "" }, { nome: "Almoço", horario: "12:30", itens: "" }, { nome: "Jantar", horario: "20:00", itens: "" },
  ]);
  const mudar = (i: number, k: keyof Refeicao, val: string) => setRefeicoes((r) => r.map((x, j) => (j === i ? { ...x, [k]: val } : x)));
  function salvar() {
    const novo: PlanoAlimentar = {
      id: novoId(), alunoId, nutricionistaId, criadoEm: isoAgora(), ativo: true, metaKcal: Number(meta) || 0,
      proteinaG: prot ? Number(prot) : undefined, refeicoes: refeicoes.filter((r) => r.itens.trim()), orientacoes: orient,
    };
    alterar((db) => ({ ...db, planosAlimentares: [...db.planosAlimentares.map((p) => (p.alunoId === alunoId ? { ...p, ativo: false } : p)), novo] }));
    avisar("Plano alimentar salvo");
    aoSalvar();
  }
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Campo rotulo="Meta diária (kcal)"><input className={estiloInput} inputMode="numeric" value={meta} onChange={(e) => setMeta(e.target.value)} /></Campo>
        <Campo rotulo="Proteína (g/dia)"><input className={estiloInput} inputMode="numeric" value={prot} onChange={(e) => setProt(e.target.value)} /></Campo>
      </div>
      {refeicoes.map((r, i) => (
        <div key={i} className="grid grid-cols-12 gap-1">
          <input className={`${estiloInput} col-span-3 sm:col-span-2`} value={r.horario} onChange={(e) => mudar(i, "horario", e.target.value)} />
          <input className={`${estiloInput} col-span-9 sm:col-span-3`} value={r.nome} onChange={(e) => mudar(i, "nome", e.target.value)} />
          <input className={`${estiloInput} col-span-10 sm:col-span-6`} placeholder="Alimentos e quantidades" value={r.itens} onChange={(e) => mudar(i, "itens", e.target.value)} />
          <button className="col-span-2 flex items-center justify-center text-zinc-400 hover:text-red-600 sm:col-span-1" onClick={() => setRefeicoes((x) => x.filter((_, j) => j !== i))} aria-label="Remover refeição"><Trash2 size={16} /></button>
        </div>
      ))}
      <button className="text-sm text-marca-700 hover:underline" onClick={() => setRefeicoes((x) => [...x, { nome: "Lanche", horario: "", itens: "" }])}>+ refeição</button>
      <Campo rotulo="Orientações gerais"><textarea className={estiloInput} rows={2} value={orient} onChange={(e) => setOrient(e.target.value)} /></Campo>
      <Botao onClick={salvar}>Salvar plano alimentar</Botao>
    </div>
  );
}

export function FormConsulta({ alunoId, nutricionistaId, aoSalvar }: { alunoId: string; nutricionistaId: string; aoSalvar: () => void }) {
  const [peso, setPeso] = useState("");
  const [adesao, setAdesao] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [notas, setNotas] = useState("");
  const [retorno, setRetorno] = useState(dataISO(new Date(Date.now() + 30 * 86_400_000)));
  function salvar() {
    alterar((db) => ({
      ...db,
      consultas: [...db.consultas, { id: novoId(), alunoId, nutricionistaId, data: isoAgora(), pesoKg: peso ? Number(peso.replace(",", ".")) : undefined, adesao, anotacoes: notas, proximoRetorno: retorno || undefined }],
    }));
    avisar("Consulta registrada");
    aoSalvar();
  }
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Campo rotulo="Peso hoje (kg)"><input className={estiloInput} inputMode="decimal" value={peso} onChange={(e) => setPeso(e.target.value)} /></Campo>
        <Campo rotulo="Próximo retorno"><input type="date" className={estiloInput} value={retorno} onChange={(e) => setRetorno(e.target.value)} /></Campo>
      </div>
      <Campo rotulo="Quanto o aluno seguiu o plano?">
        <div className="flex gap-1">
          {([1, 2, 3, 4, 5] as const).map((n) => (
            <button key={n} onClick={() => setAdesao(n)} className={`h-10 w-10 rounded-xl border text-sm ${adesao === n ? "border-marca-700 bg-marca-50 text-marca-800" : "border-zinc-300"}`}>{n}</button>
          ))}
        </div>
      </Campo>
      <Campo rotulo="Anotações"><textarea className={estiloInput} rows={3} value={notas} onChange={(e) => setNotas(e.target.value)} /></Campo>
      <Botao disabled={!notas.trim()} onClick={salvar}>Registrar consulta</Botao>
    </div>
  );
}
