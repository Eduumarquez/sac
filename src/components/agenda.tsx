"use client";

import { useState } from "react";
import { CalendarDays, CalendarPlus, Check, ClipboardCheck, Apple, Users } from "lucide-react";
import { alterar } from "@/lib/db";
import type { Agendamento, Aula, BancoDados } from "@/lib/tipos";
import { dataISO, horariosEntre, novoId } from "@/lib/datas";
import { Botao, Campo, Cartao, Escolha, Etiqueta, Vazio, avisar, estiloInput } from "./ui";

export const hora = (iso: string) => new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
function rotuloDia(iso: string) {
  const d = new Date(iso);
  const hoje = dataISO(new Date());
  const amanha = dataISO(new Date(Date.now() + 86_400_000));
  if (dataISO(d) === hoje) return "Hoje";
  if (dataISO(d) === amanha) return "Amanhã";
  const t = d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "short" });
  return t.charAt(0).toUpperCase() + t.slice(1);
}

type ItemAgenda = { id: string; inicio: string; titulo: string; detalhe: string; tipo: "aula" | "avaliacao" | "consulta"; agendamento?: Agendamento };

function agruparPorDia<T extends { inicio: string }>(itens: T[]) {
  const grupos = new Map<string, T[]>();
  for (const i of [...itens].sort((a, b) => a.inicio.localeCompare(b.inicio))) {
    const k = dataISO(new Date(i.inicio));
    grupos.set(k, [...(grupos.get(k) ?? []), i]);
  }
  return [...grupos.entries()];
}

const ICONE = { aula: <Users size={16} />, avaliacao: <ClipboardCheck size={16} />, consulta: <Apple size={16} /> };

/** Agenda dos próximos dias de um profissional (ou de toda a academia, sem profissionalId). */
export function AgendaEquipe({ db, profissionalId, dias = 7, titulo = "Agenda" }: { db: BancoDados; profissionalId?: string; dias?: number; titulo?: string }) {
  const agora = new Date();
  const ini = new Date(agora); ini.setHours(0, 0, 0, 0);
  const fim = new Date(ini.getTime() + dias * 86_400_000);
  const dentro = (iso: string) => iso >= ini.toISOString() && iso < fim.toISOString();
  const nome = (id: string) => db.alunos.find((a) => a.id === id)?.nome ?? "";
  const prof = (id: string) => db.profissionais.find((p) => p.id === id)?.nome ?? "";
  const itens: ItemAgenda[] = [
    ...db.aulas.filter((a) => dentro(a.inicio) && (!profissionalId || a.profissionalId === profissionalId))
      .map((a) => ({ id: a.id, inicio: a.inicio, tipo: "aula" as const, titulo: a.nome, detalhe: `${a.inscritos.length}/${a.vagas} inscritos${profissionalId ? "" : ` · ${prof(a.profissionalId)}`}` })),
    ...db.agendamentos.filter((g) => dentro(g.inicio) && g.status !== "faltou" && (!profissionalId || g.profissionalId === profissionalId))
      .map((g) => ({ id: g.id, inicio: g.inicio, tipo: g.tipo, agendamento: g, titulo: `${g.tipo === "avaliacao" ? "Avaliação física" : "Consulta"} · ${nome(g.alunoId)}`, detalhe: profissionalId ? "" : prof(g.profissionalId) })),
  ];
  const marcar = (g: Agendamento, status: Agendamento["status"]) => {
    alterar((d) => ({ ...d, agendamentos: d.agendamentos.map((x) => (x.id === g.id ? { ...x, status } : x)) }));
    avisar(status === "feito" ? "Atendimento concluído" : "Falta registrada");
  };
  return (
    <Cartao titulo={titulo} icone={<CalendarDays size={18} />}>
      {!itens.length ? <p className="text-sm text-zinc-500">Nada marcado para os próximos {dias} dias.</p> : (
        <div className="space-y-4">
          {agruparPorDia(itens).map(([dia, lista]) => (
            <section key={dia}>
              <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-400">{rotuloDia(lista[0].inicio)}</h3>
              <ul className="space-y-1.5">
                {lista.map((i) => (
                  <li key={i.id} className={`flex flex-wrap items-center gap-3 rounded-xl px-3 py-2 ${i.agendamento?.status === "feito" ? "bg-zinc-50 text-zinc-400" : "bg-zinc-50"}`}>
                    <span className="w-12 text-sm font-semibold tabular-nums text-zinc-700">{hora(i.inicio)}</span>
                    <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${i.tipo === "aula" ? "bg-sky-100 text-sky-700" : i.tipo === "consulta" ? "bg-amber-100 text-amber-700" : "bg-marca-100 text-marca-800"}`}>{ICONE[i.tipo]}</span>
                    <span className="min-w-0 flex-1 text-sm">
                      <span className="font-medium text-zinc-900">{i.titulo}</span>
                      {i.detalhe && <span className="block text-xs text-zinc-500">{i.detalhe}</span>}
                    </span>
                    {i.agendamento?.status === "feito" && <Etiqueta cor="verde"><Check size={12} /> feito</Etiqueta>}
                    {i.agendamento?.status === "marcado" && new Date(i.inicio) <= new Date(Date.now() + 3 * 3600_000) && (
                      <span className="flex gap-1">
                        <button onClick={() => marcar(i.agendamento!, "feito")} className="rounded-lg bg-white px-2 py-1 text-xs font-medium text-marca-700 ring-1 ring-zinc-200">Feito</button>
                        <button onClick={() => marcar(i.agendamento!, "faltou")} className="rounded-lg bg-white px-2 py-1 text-xs text-zinc-500 ring-1 ring-zinc-200">Faltou</button>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </Cartao>
  );
}

/** Formulário curto para marcar avaliação (personal) ou consulta (nutri). */
const HORAS_AGENDA = horariosEntre(6, 22);

export function AgendarAtendimento({ alunoId, profissionalId, tipo, db }: { alunoId: string; profissionalId: string; tipo: Agendamento["tipo"]; db: BancoDados }) {
  const amanha = dataISO(new Date(Date.now() + 86_400_000));
  const [dia, setDia] = useState(amanha);
  const [h, setH] = useState("18:00");
  const proximo = db.agendamentos.filter((g) => g.alunoId === alunoId && g.tipo === tipo && g.status === "marcado" && g.inicio >= new Date().toISOString()).sort((a, b) => a.inicio.localeCompare(b.inicio))[0];
  function salvar() {
    const inicio = new Date(`${dia}T${h}:00`).toISOString();
    alterar((d) => ({ ...d, agendamentos: [...d.agendamentos, { id: novoId(), alunoId, profissionalId, tipo, inicio, status: "marcado" }] }));
    avisar(`${tipo === "avaliacao" ? "Avaliação" : "Consulta"} marcada. O aluno vê no app.`);
  }
  return (
    <Cartao titulo={tipo === "avaliacao" ? "Agendar avaliação" : "Agendar consulta"} icone={<CalendarPlus size={18} />}>
      {proximo && <p className="mb-3 rounded-xl bg-marca-50 px-3 py-2 text-sm text-marca-900">Já marcada: {rotuloDia(proximo.inicio).toLowerCase()} às {hora(proximo.inicio)}.</p>}
      <div className="flex flex-wrap items-end gap-2">
        <Campo rotulo="Dia"><input type="date" className={estiloInput} value={dia} min={dataISO(new Date())} onChange={(e) => setDia(e.target.value)} /></Campo>
        <Campo rotulo="Hora"><Escolha rotulo="Hora" className="w-28" valor={h} opcoes={HORAS_AGENDA.map((x) => ({ valor: x, texto: x }))} aoMudar={setH} /></Campo>
        <Botao onClick={salvar}>Marcar</Botao>
      </div>
    </Cartao>
  );
}

/** Para o aluno: compromissos marcados e grade de aulas com reserva. */
export function AgendaDoAluno({ db, alunoId }: { db: BancoDados; alunoId: string }) {
  const agora = new Date().toISOString();
  const prof = (id: string) => db.profissionais.find((p) => p.id === id)?.nome ?? "";
  const meus = db.agendamentos.filter((g) => g.alunoId === alunoId && g.status === "marcado" && g.inicio >= agora).sort((a, b) => a.inicio.localeCompare(b.inicio));
  const aulas = db.aulas.filter((a) => a.inicio >= agora);
  const reservar = (a: Aula) => {
    const dentro = a.inscritos.includes(alunoId);
    if (!dentro && a.inscritos.length >= a.vagas) return;
    alterar((d) => ({ ...d, aulas: d.aulas.map((x) => (x.id === a.id ? { ...x, inscritos: dentro ? x.inscritos.filter((i) => i !== alunoId) : [...x.inscritos, alunoId] } : x)) }));
    avisar(dentro ? "Reserva cancelada" : `Vaga reservada: ${a.nome}, ${rotuloDia(a.inicio).toLowerCase()} às ${hora(a.inicio)}`);
  };
  return (
    <div className="animar-entrada space-y-4">
      <section>
        <h2 className="mb-2 text-lg font-semibold">Meus compromissos</h2>
        {!meus.length && !aulas.some((a) => a.inscritos.includes(alunoId)) ? (
          <Vazio icone={<CalendarDays size={28} />}>Nada marcado. Reserve uma aula abaixo.</Vazio>
        ) : (
          <ul className="space-y-2">
            {meus.map((g) => (
              <li key={g.id} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-zinc-200/80">
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${g.tipo === "consulta" ? "bg-amber-100 text-amber-700" : "bg-marca-100 text-marca-800"}`}>{ICONE[g.tipo]}</span>
                <span className="text-sm">
                  <span className="block font-medium">{g.tipo === "avaliacao" ? "Avaliação física" : "Consulta com a nutri"}</span>
                  <span className="text-zinc-500">{rotuloDia(g.inicio)} às {hora(g.inicio)} · {prof(g.profissionalId)}</span>
                </span>
              </li>
            ))}
            {aulas.filter((a) => a.inscritos.includes(alunoId)).sort((a, b) => a.inicio.localeCompare(b.inicio)).map((a) => (
              <li key={a.id} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-zinc-200/80">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700">{ICONE.aula}</span>
                <span className="text-sm"><span className="block font-medium">{a.nome}</span><span className="text-zinc-500">{rotuloDia(a.inicio)} às {hora(a.inicio)}</span></span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Aulas da semana</h2>
        <div className="space-y-4">
          {agruparPorDia(aulas).map(([dia, lista]) => (
            <div key={dia}>
              <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-400">{rotuloDia(lista[0].inicio)}</h3>
              <ul className="space-y-2">
                {lista.map((a) => {
                  const dentro = a.inscritos.includes(alunoId);
                  const cheia = a.inscritos.length >= a.vagas && !dentro;
                  return (
                    <li key={a.id} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-zinc-200/80">
                      <span className="w-12 text-sm font-semibold tabular-nums">{hora(a.inicio)}</span>
                      <span className="min-w-0 flex-1 text-sm">
                        <span className="block font-medium">{a.nome}</span>
                        <span className="text-zinc-500">{a.duracaoMin} min · {prof(a.profissionalId).split(" ")[0]} · {a.vagas - a.inscritos.length} vagas</span>
                      </span>
                      <button onClick={() => reservar(a)} disabled={cheia} aria-pressed={dentro}
                        className={`rounded-xl px-3 py-2 text-sm font-medium ${dentro ? "bg-marca-50 text-marca-800 ring-1 ring-marca-200" : cheia ? "bg-zinc-100 text-zinc-400" : "bg-marca-700 text-white"}`}>
                        {dentro ? "Reservado ✓" : cheia ? "Lotada" : "Reservar"}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
