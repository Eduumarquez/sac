"use client";

import { useState } from "react";
import { alterar } from "@/lib/db";
import { dataISO, isoAgora, novoId } from "@/lib/datas";
import type { DivisaoTreino, PlanoAlimentar, Refeicao, Treino } from "@/lib/tipos";
import { Plus, Trash2, TriangleAlert } from "lucide-react";
import { EXERCICIOS, NOMES_DIVISAO, OPCOES_REPETICOES, OPCOES_SERIES, opcoesExercicio } from "@/lib/exercicios";
import { ALIMENTOS, HORARIOS, OPCOES_KCAL, OPCOES_PROTEINA, ORIENTACOES, REFEICOES_PADRAO, RESTRICOES, conflitosDe, grupoDaRefeicao, juntarItens, separarItens, separarOrientacoes, somaDoDia } from "@/lib/alimentos";
import { Botao, Campo, Chip, Escolha, EscolhaMultipla, avisar, estiloInput } from "./ui";

/** Lista de opções que também mostra o valor atual, se ele não estiver nela (dados antigos). */
const comAtual = (opcoes: string[], atual: string) => (atual && !opcoes.includes(atual) ? [atual, ...opcoes] : opcoes);

export function EditorTreino({ alunoId, personalId, atual, aoSalvar }: { alunoId: string; personalId: string; atual?: Treino; aoSalvar: () => void }) {
  const [divisoes, setDivisoes] = useState<DivisaoTreino[]>(
    atual ? structuredClone(atual.divisoes) : [{ nome: NOMES_DIVISAO[0], exercicios: [{ exercicio: "", series: 3, repeticoes: "12" }] }],
  );
  const exercicios = opcoesExercicio();
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
            <Escolha rotulo="Nome da divisão" className="min-w-0 flex-1" valor={d.nome} opcoes={comAtual(NOMES_DIVISAO, d.nome).map((n) => ({ valor: n, texto: n }))} aoMudar={(v) => mudar((x) => { x[i].nome = v; })} />
            <Botao variante="secundario" aria-label="Remover divisão" onClick={() => mudar((x) => { x.splice(i, 1); })} icone={<Trash2 size={16} />}><span className="hidden sm:inline">Remover</span></Botao>
          </div>
          <div className="mt-3 hidden grid-cols-12 gap-1 px-1 text-xs text-zinc-400 sm:grid"><span className="col-span-5">Exercício</span><span className="col-span-2">Séries</span><span className="col-span-2">Reps</span><span className="col-span-2">Carga (kg)</span></div>
          <div className="mt-2 space-y-2">
            {d.exercicios.map((e, j) => (
              <div key={j} className="grid grid-cols-12 gap-1">
                <Escolha rotulo="Exercício" className="col-span-12 sm:col-span-5" valor={e.exercicio}
                  opcoes={[{ valor: "", texto: "Escolha o exercício" }, ...(e.exercicio && !EXERCICIOS[e.exercicio] ? [{ valor: e.exercicio, texto: e.exercicio }] : []), ...exercicios]}
                  aoMudar={(v) => mudar((x) => { x[i].exercicios[j].exercicio = v; })} />
                <Escolha rotulo="Séries" className="col-span-3 sm:col-span-2" valor={String(e.series)} opcoes={comAtual(OPCOES_SERIES.map(String), String(e.series)).map((n) => ({ valor: n, texto: `${n}×` }))} aoMudar={(v) => mudar((x) => { x[i].exercicios[j].series = Number(v); })} />
                <Escolha rotulo="Repetições" className="col-span-4 sm:col-span-2" valor={e.repeticoes} opcoes={comAtual(OPCOES_REPETICOES, e.repeticoes).map((n) => ({ valor: n, texto: n }))} aoMudar={(v) => mudar((x) => { x[i].exercicios[j].repeticoes = v; })} />
                <input className={`${estiloInput} col-span-3 sm:col-span-2`} type="number" step="0.5" placeholder="kg" aria-label="Carga em kg" value={e.cargaKg ?? ""} onChange={(ev) => mudar((x) => { x[i].exercicios[j].cargaKg = ev.target.value ? Number(ev.target.value) : undefined; })} />
                <button className="col-span-2 flex items-center justify-center text-zinc-400 hover:text-red-600 sm:col-span-1" onClick={() => mudar((x) => { x[i].exercicios.splice(j, 1); })} aria-label="Remover exercício"><Trash2 size={16} /></button>
              </div>
            ))}
            <button className="inline-flex items-center gap-1 text-sm font-medium text-marca-700 hover:underline" onClick={() => mudar((x) => { x[i].exercicios.push({ exercicio: "", series: 3, repeticoes: "12" }); })}><Plus size={16} /> Adicionar exercício</button>
          </div>
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
        <Botao variante="secundario" onClick={() => mudar((x) => { x.push({ nome: NOMES_DIVISAO.find((n) => n.startsWith(String.fromCharCode(65 + x.length)) && !x.some((d) => d.nome === n)) ?? NOMES_DIVISAO[0], exercicios: [{ exercicio: "", series: 3, repeticoes: "12" }] }); })}>+ divisão</Botao>
        <Botao onClick={salvar}>Salvar novo treino</Botao>
      </div>
      <p className="text-xs text-zinc-500">Escolha exercício, séries e repetições; a carga é digitada porque muda de aluno para aluno. Salvar cria uma nova versão e arquiva a anterior.</p>
    </div>
  );
}

export function FormAvaliacao({ alunoId, personalId, alturaAnterior, aoSalvar }: { alunoId: string; personalId: string; alturaAnterior?: number; aoSalvar: () => void }) {
  const [v, setV] = useState<Record<string, string>>({ altura: alturaAnterior ? String(alturaAnterior) : "" });
  const n = (k: string) => (v[k] ? Number(v[k].replace(",", ".")) : undefined);
  const valido = !!n("peso") && !!n("altura");
  const bio: [string, string][] = [["magra", "Massa magra (kg)"], ["muscular", "Massa muscular (kg)"], ["agua", "Água corporal (%)"], ["visceral", "Gordura visceral (nível)"], ["tmb", "Metabolismo basal (kcal)"]];
  const campos: [string, string][] = [["peso", "Peso (kg)"], ["altura", "Altura (cm)"], ["gordura", "Gordura (%)"], ["cintura", "Cintura (cm)"], ["quadril", "Quadril (cm)"], ["braco", "Braço (cm)"], ["coxa", "Coxa (cm)"]];
  function salvar() {
    alterar((db) => ({
      ...db,
      avaliacoes: [...db.avaliacoes, {
        id: novoId(), alunoId, personalId, data: isoAgora(), pesoKg: n("peso")!, alturaCm: n("altura")!, gorduraPct: n("gordura"),
        cinturaCm: n("cintura"), quadrilCm: n("quadril"), bracoCm: n("braco"), coxaCm: n("coxa"), observacoes: v.obs,
        massaMagraKg: n("magra"), massaMuscularKg: n("muscular"), aguaPct: n("agua"), gorduraVisceral: n("visceral"), metabolismoBasalKcal: n("tmb"),
        origem: bio.some(([k]) => v[k]) ? "bioimpedancia" : "manual",
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
      <details className="rounded-xl border border-zinc-200 p-3" open={bio.some(([k]) => v[k])}>
        <summary className="cursor-pointer text-sm font-medium text-zinc-700">Bioimpedância (opcional)</summary>
        <p className="mt-1 text-xs text-zinc-500">Copie os valores do relatório da balança (InBody, Tanita, Omron ou outra). O aluno vê a composição corporal no app.</p>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {bio.map(([k, r]) => (
            <Campo key={k} rotulo={r}><input className={estiloInput} inputMode="decimal" value={v[k] ?? ""} onChange={(e) => setV({ ...v, [k]: e.target.value })} /></Campo>
          ))}
        </div>
      </details>
      <Campo rotulo="Observações"><textarea className={estiloInput} rows={2} value={v.obs ?? ""} onChange={(e) => setV({ ...v, obs: e.target.value })} /></Campo>
      <Botao disabled={!valido} onClick={salvar}>Salvar avaliação</Botao>
    </div>
  );
}

/** Uma refeição: horário e nome em listas, alimentos em botões. */
function EditorRefeicao({ r, restricoes, aoMudar, aoRemover }: { r: Refeicao; restricoes: string[]; aoMudar: (r: Refeicao) => void; aoRemover: () => void }) {
  const escolhidos = separarItens(r.itens);
  const [aberto, setAberto] = useState(escolhidos.length === 0);
  const [todos, setTodos] = useState(false);
  const grupo = grupoDaRefeicao(r.nome);
  const lista = (todos ? ALIMENTOS : ALIMENTOS.filter((a) => a.grupo === grupo || a.grupo === "ambos")).filter((a) => !escolhidos.includes(a.nome));
  const alternar = (nome: string) => aoMudar({ ...r, itens: juntarItens(escolhidos.includes(nome) ? escolhidos.filter((x) => x !== nome) : [...escolhidos, nome]) });
  const nomes = comAtual(REFEICOES_PADRAO.map((p) => p.nome), r.nome);
  const horarios = comAtual(HORARIOS, r.horario).sort();
  const soma = somaDoDia([r]);
  const alerta = (nome: string) => { const c = conflitosDe(nome, restricoes); return c.length ? `Atenção: ${c.join(", ")}` : undefined; };
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-3">
      <div className="flex gap-2">
        <Escolha rotulo="Horário" className="w-[5.75rem] shrink-0" valor={r.horario || "12:00"} opcoes={horarios.map((h) => ({ valor: h, texto: h }))} aoMudar={(v) => aoMudar({ ...r, horario: v })} />
        <Escolha rotulo="Refeição" className="min-w-0 flex-1" valor={r.nome} opcoes={nomes.map((n) => ({ valor: n, texto: n }))} aoMudar={(v) => aoMudar({ ...r, nome: v })} />
        <button type="button" className="shrink-0 rounded-lg px-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600" onClick={aoRemover} aria-label={`Remover ${r.nome}`}><Trash2 size={16} /></button>
      </div>
      {escolhidos.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {escolhidos.map((e) => <Chip key={e} ativo alerta={alerta(e)} aoTocar={() => alternar(e)}>{e}</Chip>)}
        </div>
      )}
      {aberto && (
        <div className="mt-2.5 rounded-lg border border-dashed border-zinc-300 bg-white p-2">
          <p className="mb-1.5 text-xs text-zinc-500">Toque para incluir{todos ? "" : ` · sugeridos para ${r.nome.toLowerCase()}`}</p>
          <div className="flex flex-wrap gap-1.5">
            {lista.map((a) => <Chip key={a.nome} ativo={false} alerta={alerta(a.nome)} aoTocar={() => alternar(a.nome)}>{a.nome}</Chip>)}
          </div>
          <button type="button" className="mt-2 text-xs font-medium text-marca-700 hover:underline" onClick={() => setTodos(!todos)}>{todos ? "Mostrar só os sugeridos" : "Ver todos os alimentos"}</button>
        </div>
      )}
      <div className="mt-2 flex items-center justify-between gap-2 text-xs">
        <button type="button" className="inline-flex items-center gap-1 font-medium text-marca-700 hover:underline" onClick={() => setAberto(!aberto)}>
          {aberto ? "Pronto" : <><Plus size={14} /> Escolher alimentos</>}
        </button>
        {soma.kcal > 0 && <span className="text-zinc-500">≈ {soma.kcal} kcal · {soma.proteinaG} g de proteína</span>}
      </div>
    </div>
  );
}

export function EditorPlanoAlimentar({ alunoId, nutricionistaId, atual, aoSalvar }: { alunoId: string; nutricionistaId: string; atual?: PlanoAlimentar; aoSalvar: () => void }) {
  const [meta, setMeta] = useState(atual?.metaKcal ?? 1800);
  const [prot, setProt] = useState<number | undefined>(atual?.proteinaG);
  const [orients, setOrients] = useState<string[]>(separarOrientacoes(atual?.orientacoes ?? ""));
  const [restricoes, setRestricoes] = useState<string[]>(atual?.restricoes ?? []);
  const [refeicoes, setRefeicoes] = useState<Refeicao[]>(atual ? structuredClone(atual.refeicoes) : [
    { nome: "Café da manhã", horario: "07:00", itens: "" }, { nome: "Almoço", horario: "12:30", itens: "" }, { nome: "Jantar", horario: "20:00", itens: "" },
  ]);
  const ordenadas = [...refeicoes.entries()].sort(([, a], [, b]) => a.horario.localeCompare(b.horario));
  const soma = somaDoDia(refeicoes);
  const kcalOpcoes = comAtual(OPCOES_KCAL.map(String), String(meta)).map(Number).sort((a, b) => a - b);
  const protOpcoes = comAtual(OPCOES_PROTEINA.map(String), prot == null ? "" : String(prot)).map(Number).sort((a, b) => a - b);

  function adicionar() {
    const usada = new Set(refeicoes.map((r) => r.nome));
    const prox = REFEICOES_PADRAO.find((p) => !usada.has(p.nome)) ?? REFEICOES_PADRAO[1];
    setRefeicoes((x) => [...x, { nome: prox.nome, horario: prox.horario, itens: "" }]);
  }
  function salvar() {
    if (!refeicoes.some((r) => r.itens.trim())) return avisar("Escolha os alimentos de pelo menos uma refeição");
    const novo: PlanoAlimentar = {
      id: novoId(), alunoId, nutricionistaId, criadoEm: isoAgora(), ativo: true, metaKcal: meta,
      proteinaG: prot, restricoes, refeicoes: refeicoes.filter((r) => r.itens.trim()).sort((a, b) => a.horario.localeCompare(b.horario)), orientacoes: orients.map((o) => (/[.!?]$/.test(o) ? o : `${o}.`)).join(" "),
    };
    alterar((db) => ({ ...db, planosAlimentares: [...db.planosAlimentares.map((p) => (p.alunoId === alunoId ? { ...p, ativo: false } : p)), novo] }));
    avisar("Plano alimentar salvo");
    aoSalvar();
  }
  const diferenca = soma.kcal - meta;
  const conflitos = refeicoes.flatMap((r) => separarItens(r.itens).filter((i) => conflitosDe(i, restricoes).length).map((i) => `${i} (${r.nome})`));
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Campo rotulo="Meta diária">
          <Escolha rotulo="Meta diária em kcal" valor={String(meta)} opcoes={kcalOpcoes.map((k) => ({ valor: String(k), texto: `${k.toLocaleString("pt-BR")} kcal` }))} aoMudar={(v) => setMeta(Number(v))} />
        </Campo>
        <Campo rotulo="Proteína por dia">
          <Escolha rotulo="Proteína por dia em gramas" valor={prot == null ? "" : String(prot)} opcoes={[{ valor: "", texto: "Sem meta" }, ...protOpcoes.map((g) => ({ valor: String(g), texto: `${g} g` }))]} aoMudar={(v) => setProt(v ? Number(v) : undefined)} />
        </Campo>
      </div>

      <div className="rounded-xl border border-red-200 bg-red-50/50 p-3">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-red-900"><TriangleAlert size={16} /> Alergias e restrições</p>
        <p className="mb-2 text-xs text-red-800/80">O aluno vê no app, e os alimentos que não combinam ficam marcados em vermelho.</p>
        <EscolhaMultipla opcoes={RESTRICOES.map((r) => r.nome)} valor={restricoes} aoMudar={setRestricoes} outro="Outra (ex.: corante, kiwi)" rotuloOutro="Outra alergia ou restrição" />
      </div>

      {ordenadas.map(([i, r]) => (
        <EditorRefeicao key={i} r={r} restricoes={restricoes} aoMudar={(nova) => setRefeicoes((x) => x.map((y, j) => (j === i ? nova : y)))} aoRemover={() => setRefeicoes((x) => x.filter((_, j) => j !== i))} />
      ))}
      <button type="button" className="inline-flex items-center gap-1 text-sm font-medium text-marca-700 hover:underline" onClick={adicionar}><Plus size={16} /> Adicionar refeição</button>

      {conflitos.length > 0 && (
        <p role="alert" className="flex gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-900"><TriangleAlert size={16} className="mt-0.5 shrink-0" /> Estes alimentos não combinam com as restrições do aluno: {conflitos.join(", ")}.</p>
      )}

      {soma.kcal > 0 && (
        <div className="rounded-xl bg-marca-50 p-3 text-sm text-marca-900">
          <p><strong>Soma do dia: ≈ {soma.kcal.toLocaleString("pt-BR")} kcal</strong> de {meta.toLocaleString("pt-BR")} kcal{prot ? <> · {soma.proteinaG} g de {prot} g de proteína</> : <> · {soma.proteinaG} g de proteína</>}</p>
          <p className="mt-0.5 text-xs text-marca-800">{Math.abs(diferenca) <= 100 ? "Bem perto da meta." : diferenca < 0 ? `Faltam cerca de ${Math.abs(diferenca)} kcal para a meta.` : `Passou cerca de ${diferenca} kcal da meta.`} Valores aproximados por porção.</p>
        </div>
      )}

      <Campo rotulo="Orientações gerais" grupo>
        <EscolhaMultipla opcoes={ORIENTACOES} valor={orients} aoMudar={setOrients} outro="Outra orientação" rotuloOutro="Outra orientação geral" />
      </Campo>
      <Botao onClick={salvar}>Salvar plano alimentar</Botao>
    </div>
  );
}

const NOTAS_CONSULTA = [
  "Seguiu bem o plano", "Dificuldade no fim de semana", "Sente fome à noite", "Pouca água durante o dia",
  "Pulou refeições", "Ajustei as calorias", "Troquei alimentos por preferência", "Pediu opções de lanche",
  "Melhorou o intestino", "Mais disposição para treinar",
];

export function FormConsulta({ alunoId, nutricionistaId, aoSalvar }: { alunoId: string; nutricionistaId: string; aoSalvar: () => void }) {
  const [peso, setPeso] = useState("");
  const [adesao, setAdesao] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [notas, setNotas] = useState<string[]>([]);
  const [retorno, setRetorno] = useState(dataISO(new Date(Date.now() + 30 * 86_400_000)));
  function salvar() {
    alterar((db) => ({
      ...db,
      consultas: [...db.consultas, { id: novoId(), alunoId, nutricionistaId, data: isoAgora(), pesoKg: peso ? Number(peso.replace(",", ".")) : undefined, adesao, anotacoes: notas.map((n) => n.replace(/\.$/, "")).join(". ") + ".", proximoRetorno: retorno || undefined }],
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
      <Campo rotulo="Quanto o aluno seguiu o plano?" grupo>
        <div className="flex gap-1">
          {([1, 2, 3, 4, 5] as const).map((n) => (
            <button key={n} onClick={() => setAdesao(n)} className={`h-10 w-10 rounded-xl border text-sm ${adesao === n ? "border-marca-700 bg-marca-50 text-marca-800" : "border-zinc-300"}`}>{n}</button>
          ))}
        </div>
      </Campo>
      <Campo rotulo="Como foi a consulta?" grupo>
        <EscolhaMultipla opcoes={NOTAS_CONSULTA} valor={notas} aoMudar={setNotas} outro="Outra observação" rotuloOutro="Outra observação da consulta" />
      </Campo>
      <Botao disabled={!notas.length} onClick={salvar}>Registrar consulta</Botao>
    </div>
  );
}
