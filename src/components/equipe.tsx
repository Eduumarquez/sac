"use client";

import { useState, type ReactNode } from "react";
import { Apple, CalendarDays, DoorOpen, FlaskConical, Stethoscope, ClipboardCheck, Dumbbell, MessageSquareText, Phone, Send, Smile, UserPlus } from "lucide-react";
import { alterar } from "@/lib/db";
import type { BancoDados, Sensacao } from "@/lib/tipos";
import { formatarData, isoAgora, novoId } from "@/lib/datas";
import { Avatar, Botao, Cartao, avisar } from "./ui";

export const SENSACOES: { valor: Sensacao; emoji: string; rotulo: string }[] = [
  { valor: 1, emoji: "😣", rotulo: "Péssimo" },
  { valor: 2, emoji: "😕", rotulo: "Ruim" },
  { valor: 3, emoji: "😐", rotulo: "Ok" },
  { valor: 4, emoji: "🙂", rotulo: "Bom" },
  { valor: 5, emoji: "🤩", rotulo: "Ótimo" },
];
export const emojiSensacao = (v: number) => SENSACOES.find((s) => s.valor === v)?.emoji ?? "";

const PAPEL: Record<string, string> = { dono: "Academia", recepcao: "Recepção", personal: "Personal", nutricionista: "Nutricionista", fisioterapeuta: "Fisioterapia" };

type Evento = { id: string; data: string; icone: ReactNode; titulo: ReactNode; texto?: ReactNode; autor?: string; destaque?: boolean };

/** Tudo o que aconteceu com o aluno, de todas as áreas, em uma linha só. */
function eventosDoAluno(db: BancoDados, alunoId: string): Evento[] {
  const prof = (id?: string) => db.profissionais.find((p) => p.id === id);
  const aluno = db.alunos.find((a) => a.id === alunoId)!;
  const ev: Evento[] = [
    { id: "matricula", data: aluno.matriculadoEm, icone: <UserPlus size={15} />, titulo: "Matrícula feita", texto: `Plano ${db.planos.find((p) => p.id === aluno.planoId)?.nome ?? ""}` },
  ];
  for (const n of db.notas.filter((x) => x.alunoId === alunoId)) {
    const p = prof(n.autorId);
    const doAluno = n.autorId === alunoId;
    ev.push({ id: n.id, data: n.data, icone: <MessageSquareText size={15} />, titulo: <>Recado {doAluno ? "do aluno" : `de ${p?.nome ?? "alguém da equipe"}`}</>, texto: n.texto, autor: p ? PAPEL[p.papel] : doAluno ? "pelo app" : undefined, destaque: true });
  }
  for (const f of db.feedbacks.filter((x) => x.alunoId === alunoId)) {
    ev.push({ id: f.id, data: f.data, icone: <Smile size={15} />, titulo: <>Treino {f.divisao.split(" ")[0]} avaliado: {emojiSensacao(f.sensacao)} {SENSACOES.find((s) => s.valor === f.sensacao)?.rotulo}</>, texto: f.comentario ? `“${f.comentario}”` : undefined, destaque: f.sensacao <= 2 });
  }
  for (const t of db.treinos.filter((x) => x.alunoId === alunoId)) {
    ev.push({ id: t.id, data: t.criadoEm, icone: <Dumbbell size={15} />, titulo: "Treino montado", texto: `${t.divisoes.length} divisões, por ${prof(t.personalId)?.nome ?? "personal"}` });
  }
  for (const a of db.avaliacoes.filter((x) => x.alunoId === alunoId)) {
    ev.push({ id: a.id, data: a.data, icone: <ClipboardCheck size={15} />, titulo: "Avaliação física", texto: `${a.pesoKg} kg${a.gorduraPct ? ` · ${a.gorduraPct}% de gordura` : ""}` });
  }
  for (const c of db.consultas.filter((x) => x.alunoId === alunoId)) {
    ev.push({ id: c.id, data: c.data, icone: <Apple size={15} />, titulo: "Consulta com a nutricionista", texto: c.anotacoes });
  }
  for (const c of db.contatos.filter((x) => x.alunoId === alunoId)) {
    ev.push({ id: c.id, data: c.data, icone: <Phone size={15} />, titulo: "Academia entrou em contato", texto: `por ${prof(c.responsavelId)?.nome ?? "recepção"}` });
  }
  for (const e of db.encaminhamentos.filter((x) => x.alunoId === alunoId)) {
    ev.push({ id: e.id, data: e.data, icone: <Stethoscope size={15} />, titulo: <>Encaminhado para {prof(e.paraId)?.nome ?? "fisioterapia"}</>, texto: e.motivo, autor: prof(e.deId)?.nome, destaque: true });
  }
  for (const x of db.exames.filter((y) => y.alunoId === alunoId)) {
    ev.push({ id: x.id, data: x.data, icone: <FlaskConical size={15} />, titulo: <>Exames de sangue {x.enviadoPor === "aluno" ? "enviados pelo aluno" : "registrados"}</>, texto: x.valores.length ? `${x.valores.length} marcadores` : x.arquivoNome });
  }
  const RES: Record<string, string> = { pausou: "pausou o plano", trocou_plano: "trocou de plano", treino_curto: "aceitou um ajuste no treino", cancelou: "cancelou" };
  for (const c of db.cancelamentos.filter((x) => x.alunoId === alunoId)) {
    ev.push({ id: c.id, data: c.data, icone: <DoorOpen size={15} />, titulo: <>Pediu para cancelar e {RES[c.resultado]}</>, texto: c.detalhe, autor: c.origem === "app" ? "pelo app" : "na recepção", destaque: true });
  }
  for (const g of db.agendamentos.filter((x) => x.alunoId === alunoId)) {
    ev.push({ id: g.id, data: g.inicio, icone: <CalendarDays size={15} />, titulo: <>{g.tipo === "avaliacao" ? "Avaliação física" : "Consulta"} {g.status === "feito" ? "realizada" : g.status === "faltou" ? "(faltou)" : "marcada"}</>, texto: `com ${prof(g.profissionalId)?.nome ?? ""}` });
  }
  return ev.filter((e) => e.data <= new Date(Date.now() + 30 * 86_400_000).toISOString()).sort((a, b) => b.data.localeCompare(a.data));
}

/** Recados da equipe e histórico do aluno, visível para academia, personal e nutricionista. */
export function LinhaDoTempo({ db, alunoId, autorId }: { db: BancoDados; alunoId: string; autorId: string }) {
  const [texto, setTexto] = useState("");
  const [todos, setTodos] = useState(false);
  const eventos = eventosDoAluno(db, alunoId);
  const visiveis = todos ? eventos : eventos.slice(0, 8);
  const autor = db.profissionais.find((p) => p.id === autorId);

  function enviar() {
    const t = texto.trim();
    if (!t) return;
    alterar((d) => ({ ...d, notas: [...d.notas, { id: novoId(), alunoId, autorId, data: isoAgora(), texto: t }] }));
    setTexto("");
    avisar("Recado enviado para a equipe");
  }

  return (
    <Cartao titulo="Equipe e histórico" icone={<MessageSquareText size={18} />}>
      <div className="flex gap-3">
        {autor && <Avatar nome={autor.nome} tamanho="sm" />}
        <div className="flex-1">
          <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={2} aria-label="Recado para a equipe"
            placeholder="Deixe um recado para a equipe sobre este aluno"
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) enviar(); }}
            className="w-full resize-none rounded-xl border border-zinc-300 px-3 py-2 text-base focus:border-marca-500 focus:outline-none sm:text-sm" />
          <div className="mt-2 flex items-center justify-between gap-2">
            <p className="text-xs text-zinc-400">Personal, nutricionista e recepção veem este recado.</p>
            <Botao tamanho="sm" onClick={enviar} disabled={!texto.trim()} icone={<Send size={14} />}>Enviar</Botao>
          </div>
        </div>
      </div>

      <ol className="mt-5 space-y-4 border-l-2 border-zinc-100 pl-5">
        {visiveis.map((e) => (
          <li key={e.id} className="relative">
            <span className={`absolute -left-[33px] flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-white ${e.destaque ? "bg-marca-100 text-marca-800" : "bg-zinc-100 text-zinc-500"}`}>{e.icone}</span>
            <p className="text-sm font-medium text-zinc-900">{e.titulo}</p>
            {e.texto && <p className={`mt-0.5 text-sm ${e.destaque ? "rounded-xl bg-zinc-50 p-2.5 text-zinc-700" : "text-zinc-500"}`}>{e.texto}</p>}
            <p className="mt-0.5 text-xs text-zinc-400">{formatarData(e.data)}{e.autor ? ` · ${e.autor}` : ""}</p>
          </li>
        ))}
      </ol>
      {eventos.length > 8 && (
        <button onClick={() => setTodos(!todos)} className="mt-3 text-sm font-medium text-marca-700 hover:underline">
          {todos ? "Mostrar menos" : `Ver histórico completo (${eventos.length})`}
        </button>
      )}
    </Cartao>
  );
}

/** Últimas avaliações de treino de um aluno, para o personal. */
export function FeedbacksDoAluno({ db, alunoId }: { db: BancoDados; alunoId: string }) {
  const lista = db.feedbacks.filter((f) => f.alunoId === alunoId).sort((a, b) => b.data.localeCompare(a.data)).slice(0, 5);
  return (
    <Cartao titulo="Como o aluno sentiu os treinos" icone={<Smile size={18} />}>
      {!lista.length ? <p className="text-sm text-zinc-500">O aluno ainda não avaliou nenhum treino. Ele avalia pelo app ao terminar.</p> : (
        <ul className="divide-y divide-zinc-100">
          {lista.map((f) => (
            <li key={f.id} className="flex gap-3 py-2.5">
              <span className="text-2xl leading-none" aria-label={SENSACOES.find((s) => s.valor === f.sensacao)?.rotulo}>{emojiSensacao(f.sensacao)}</span>
              <div className="min-w-0">
                <p className="text-sm font-medium">{f.divisao} <span className="font-normal text-zinc-400">· {formatarData(f.data)}</span></p>
                {f.comentario && <p className="text-sm text-zinc-600">“{f.comentario}”</p>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Cartao>
  );
}
