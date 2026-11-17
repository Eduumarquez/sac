"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { ArrowDownCircle, Clock, HeartHandshake, PauseCircle, PiggyBank, Stethoscope, X } from "lucide-react";
import { alterar } from "@/lib/db";
import type { BancoDados, MotivoCancelamento, ResultadoCancelamento } from "@/lib/tipos";
import { MOTIVOS_CANCELAMENTO, dinheiroSalvo, valorMensal } from "@/lib/regras";
import { dataISO, formatarData, formatarDinheiro, isoAgora, novoId } from "@/lib/datas";
import { Avatar, Botao, Cartao, avisar } from "./ui";

type Oferta = { id: ResultadoCancelamento | "reavaliar"; titulo: string; texto: string; icone: ReactNode; planoId?: string; dias?: number };

/**
 * Antes de cancelar, o sistema pergunta o motivo e oferece uma saída que mantém o aluno:
 * pausar, trocar para um plano mais barato, treino curto ou reavaliação com o personal.
 */
export function FluxoCancelamento({ db, alunoId, origem, aberto, aoFechar }: { db: BancoDados; alunoId: string; origem: "recepcao" | "app"; aberto: boolean; aoFechar: () => void }) {
  const [motivo, setMotivo] = useState<MotivoCancelamento | null>(null);
  if (!aberto) return null;
  const aluno = db.alunos.find((a) => a.id === alunoId)!;
  const primeiro = aluno.nome.split(" ")[0];
  const doAluno = origem === "app";
  const plano = db.planos.find((p) => p.id === aluno.planoId);
  const maisBaratos = db.planos.filter((p) => !p.agregador && p.periodicidadeMeses === 1 && p.valorCentavos < (plano ? valorMensal(db, aluno) : 0)).sort((a, b) => b.valorCentavos - a.valorCentavos);
  const personal = db.profissionais.find((p) => p.id === aluno.personalId);

  const ofertas: Oferta[] = [];
  if (motivo === "preco" && maisBaratos[0]) ofertas.push({ id: "trocou_plano", planoId: maisBaratos[0].id, icone: <ArrowDownCircle size={20} />, titulo: `Trocar para o plano ${maisBaratos[0].nome}`, texto: `${formatarDinheiro(maisBaratos[0].valorCentavos)} por mês. ${maisBaratos[0].descricao}` });
  if (motivo === "tempo" || motivo === "resultado") ofertas.push({ id: "treino_curto", icone: <Clock size={20} />, titulo: motivo === "tempo" ? "Treino de 40 minutos" : "Treino novo com reavaliação", texto: motivo === "tempo" ? `${personal?.nome ?? "O professor"} monta um treino mais curto para os dias corridos.` : `${personal?.nome ?? "O professor"} faz uma reavaliação esta semana e monta um treino novo.` });
  if (motivo === "saude") ofertas.push({ id: "treino_curto", icone: <Stethoscope size={20} />, titulo: "Treino adaptado", texto: "O personal adapta o treino à lesão ou condição, com liberação médica." });
  if (motivo) ofertas.push({ id: "pausou", dias: motivo === "mudanca" || motivo === "saude" ? 60 : 30, icone: <PauseCircle size={20} />, titulo: `Pausar o plano por ${motivo === "mudanca" || motivo === "saude" ? 60 : 30} dias`, texto: "Sem cobrança durante a pausa. Depois o plano volta sozinho." });

  function concluir(resultado: ResultadoCancelamento, oferta?: Oferta) {
    const motivoTexto = MOTIVOS_CANCELAMENTO.find((m) => m.id === motivo)?.rotulo ?? "";
    alterar((d) => {
      const valor = valorMensal(d, aluno);
      let alunos = d.alunos;
      let notas = d.notas;
      let agendamentos = d.agendamentos;
      if (resultado === "cancelou") alunos = alunos.map((a) => (a.id === alunoId ? { ...a, status: "cancelado" as const } : a));
      if (resultado === "pausou") {
        const ate = dataISO(new Date(Date.now() + (oferta?.dias ?? 30) * 86_400_000));
        alunos = alunos.map((a) => (a.id === alunoId ? { ...a, status: "pausado" as const, pausadoAte: ate } : a));
      }
      if (resultado === "trocou_plano" && oferta?.planoId) alunos = alunos.map((a) => (a.id === alunoId ? { ...a, planoId: oferta.planoId! } : a));
      if (resultado === "treino_curto") {
        notas = [...notas, { id: novoId(), alunoId, autorId: doAluno ? alunoId : "p-rec", data: isoAgora(), texto: `Quase cancelou (${motivoTexto.toLowerCase()}). Combinado: ${oferta?.titulo.toLowerCase()}. Por favor, priorize.` }];
        if (motivo === "resultado" && aluno.personalId) {
          const quando = new Date(Date.now() + 2 * 86_400_000); quando.setHours(18, 0, 0, 0);
          agendamentos = [...agendamentos, { id: novoId(), alunoId, profissionalId: aluno.personalId, tipo: "avaliacao", inicio: quando.toISOString(), status: "marcado" }];
        }
      }
      return {
        ...d, alunos, notas, agendamentos,
        cancelamentos: [...d.cancelamentos, { id: novoId(), alunoId, data: isoAgora(), motivo: motivo ?? "outro", origem, resultado, detalhe: oferta?.titulo, valorMensalCentavos: valor }],
      };
    });
    avisar(resultado === "cancelou" ? "Cancelamento registrado" : doAluno ? "Combinado! A equipe já foi avisada." : `${primeiro} continua com a gente`);
    setMotivo(null);
    aoFechar();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-900/40 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label="Pedido de cancelamento">
      <div className="animar-entrada max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 shadow-xl sm:rounded-3xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">{doAluno ? "Antes de cancelar, conta pra gente" : `Pedido de cancelamento de ${primeiro}`}</h2>
            <p className="text-sm text-zinc-500">{motivo ? (doAluno ? "Talvez uma destas opções resolva:" : `Ofereça uma destas opções para ${primeiro}:`) : "Qual é o principal motivo?"}</p>
          </div>
          <button onClick={() => { setMotivo(null); aoFechar(); }} aria-label="Fechar" className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100"><X size={20} /></button>
        </div>

        {!motivo ? (
          <div className="grid grid-cols-2 gap-2">
            {MOTIVOS_CANCELAMENTO.map((m) => (
              <button key={m.id} onClick={() => setMotivo(m.id)} className="rounded-xl border border-zinc-200 px-3 py-3 text-left text-sm font-medium hover:border-marca-400 hover:bg-marca-50">{m.rotulo}</button>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {ofertas.map((o) => (
              <button key={o.id + o.titulo} onClick={() => concluir(o.id === "reavaliar" ? "treino_curto" : (o.id as ResultadoCancelamento), o)}
                className="flex w-full items-start gap-3 rounded-2xl border border-marca-200 bg-marca-50/60 p-4 text-left hover:bg-marca-50">
                <span className="mt-0.5 text-marca-700">{o.icone}</span>
                <span><span className="block font-semibold text-marca-900">{o.titulo}</span><span className="text-sm text-zinc-600">{o.texto}</span></span>
              </button>
            ))}
            <div className="flex items-center justify-between pt-2">
              <button onClick={() => setMotivo(null)} className="text-sm text-zinc-500 hover:underline">← Outro motivo</button>
              <Botao variante="fantasma" tamanho="sm" className="text-red-600" onClick={() => concluir("cancelou")}>{doAluno ? "Quero cancelar mesmo assim" : "Cancelar mesmo assim"}</Botao>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Quanto de mensalidade a equipe manteve nos últimos 90 dias. */
export function CartaoDinheiroSalvo({ db, compacto }: { db: BancoDados; compacto?: boolean }) {
  const { totalMensalCentavos, itens } = dinheiroSalvo(db);
  if (compacto) {
    if (!totalMensalCentavos) return null;
    return (
      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-gradient-to-r from-marca-700 to-marca-800 px-4 py-3 text-white shadow-sm">
        <PiggyBank size={22} className="text-amber-300" />
        <p className="flex-1 text-sm">A equipe manteve <strong className="text-base">{formatarDinheiro(totalMensalCentavos)}/mês</strong> em mensalidades nos últimos 90 dias ({itens.length} {itens.length === 1 ? "aluno" : "alunos"}).</p>
      </div>
    );
  }
  return (
    <Cartao titulo="Dinheiro salvo pela retenção" icone={<HeartHandshake size={18} />}>
      <div className="flex flex-wrap items-end gap-x-6 gap-y-1">
        <p className="text-4xl font-bold text-marca-800">{formatarDinheiro(totalMensalCentavos)}<span className="text-base font-normal text-zinc-500">/mês</span></p>
        <p className="pb-1 text-sm text-zinc-500">≈ {formatarDinheiro(totalMensalCentavos * 12)} por ano se esses alunos ficarem</p>
      </div>
      <p className="mt-1 text-sm text-zinc-500">Alunos em risco contatados que voltaram a treinar e pedidos de cancelamento revertidos, nos últimos 90 dias.</p>
      {itens.length > 0 ? (
        <ul className="mt-4 divide-y divide-zinc-100">
          {itens.map((i) => {
            const a = db.alunos.find((x) => x.id === i.alunoId)!;
            return (
              <li key={i.alunoId}>
                <Link href={`/painel/aluno/?id=${a.id}`} className="flex items-center gap-3 py-2.5 hover:bg-zinc-50">
                  <Avatar nome={a.nome} tamanho="sm" />
                  <span className="min-w-0 flex-1 text-sm">
                    <span className="font-medium">{a.nome}</span>
                    <span className="block text-zinc-500">{i.como === "contato" ? "Voltou a treinar depois do contato" : "Desistiu de cancelar"} · {formatarData(i.data)}</span>
                  </span>
                  <span className="text-sm font-semibold text-marca-700">+{formatarDinheiro(i.valorMensalCentavos)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : <p className="mt-3 text-sm text-zinc-500">Use a Lista do dia e o fluxo de cancelamento para começar a medir.</p>}
    </Cartao>
  );
}
