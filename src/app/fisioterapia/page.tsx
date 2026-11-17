"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, Clock, Stethoscope } from "lucide-react";
import { alterar, useBanco } from "@/lib/db";
import type { Encaminhamento } from "@/lib/tipos";
import { formatarData, isoAgora, novoId } from "@/lib/datas";
import { Avatar, Botao, CabecalhoPagina, Campo, Carregando, Etiqueta, Indicador, Vazio, avisar, estiloInput } from "@/components/ui";
import { SeletorPessoa, usePessoaSelecionada } from "@/components/SeletorPessoa";

const ST: Record<Encaminhamento["status"], string> = { aberto: "Aguardando", em_atendimento: "Em atendimento", liberado: "Liberado" };

export default function AreaFisio() {
  const db = useBanco();
  const fisios = db?.profissionais.filter((p) => p.papel === "fisioterapeuta") ?? [];
  const eu = usePessoaSelecionada(fisios, "fisioterapeuta");
  const [liberando, setLiberando] = useState<string | null>(null);
  const [texto, setTexto] = useState("");
  if (!db) return <Carregando />;
  const meus = db.encaminhamentos.filter((e) => e.paraId === eu).sort((a, b) => a.data.localeCompare(b.data));
  const abertos = meus.filter((e) => e.status !== "liberado");
  const liberados = meus.filter((e) => e.status === "liberado").sort((a, b) => (b.liberadoEm ?? "").localeCompare(a.liberadoEm ?? ""));
  const nomeEu = fisios.find((p) => p.id === eu)?.nome.split(" ")[0];

  const atender = (e: Encaminhamento) => { alterar((d) => ({ ...d, encaminhamentos: d.encaminhamentos.map((x) => (x.id === e.id ? { ...x, status: "em_atendimento" } : x)) })); avisar("Atendimento iniciado"); };
  function liberar(e: Encaminhamento) {
    if (!texto.trim()) return;
    alterar((d) => ({
      ...d,
      encaminhamentos: d.encaminhamentos.map((x) => (x.id === e.id ? { ...x, status: "liberado", liberacao: texto.trim(), liberadoEm: isoAgora() } : x)),
      notas: [...d.notas, { id: novoId(), alunoId: e.alunoId, autorId: eu!, data: isoAgora(), texto: `Liberado para treinar. Orientação: ${texto.trim()}` }],
    }));
    avisar("Aluno liberado. O personal já vê a orientação.");
    setLiberando(null); setTexto("");
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <CabecalhoPagina titulo={`Olá, ${nomeEu ?? ""}`} subtitulo="Alunos encaminhados pela equipe e orientações para o treino"
        acao={<SeletorPessoa opcoes={fisios} tipo="fisioterapeuta" rotulo="Entrar como" />} />
      <div className="mb-6 grid grid-cols-3 gap-3">
        <Indicador rotulo="Aguardando" valor={meus.filter((e) => e.status === "aberto").length} icone={<Clock size={18} />} destaque={meus.some((e) => e.status === "aberto") ? "vermelho" : undefined} />
        <Indicador rotulo="Em atendimento" valor={meus.filter((e) => e.status === "em_atendimento").length} icone={<Stethoscope size={18} />} />
        <Indicador rotulo="Liberados" valor={liberados.length} icone={<CheckCircle2 size={18} />} />
      </div>

      <h2 className="mb-2 text-sm font-semibold text-zinc-500">Encaminhamentos · {abertos.length}</h2>
      {!abertos.length ? <Vazio icone={<Stethoscope size={28} />}>Nenhum aluno encaminhado no momento.</Vazio> : (
        <ul className="space-y-3">
          {abertos.map((e) => {
            const a = db.alunos.find((x) => x.id === e.alunoId)!;
            const de = db.profissionais.find((x) => x.id === e.deId);
            const anam = db.anamneses.find((x) => x.alunoId === e.alunoId);
            return (
              <li key={e.id} className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <Avatar nome={a.nome} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/personal/aluno/?id=${a.id}`} className="font-semibold hover:underline">{a.nome}</Link>
                      <Etiqueta cor={e.status === "aberto" ? "amarelo" : "azul"}>{ST[e.status]}</Etiqueta>
                    </div>
                    <p className="text-xs text-zinc-500">Encaminhado por {de?.nome ?? "equipe"} em {formatarData(e.data)}</p>
                    <p className="mt-2 text-sm text-zinc-700">{e.motivo}</p>
                    {anam?.lesoes && <p className="mt-1 text-sm text-amber-800">Na anamnese: {anam.lesoes}</p>}
                  </div>
                </div>
                {liberando === e.id ? (
                  <div className="mt-3 space-y-2">
                    <Campo rotulo="Orientação para o personal"><textarea className={estiloInput} rows={3} value={texto} onChange={(ev) => setTexto(ev.target.value)} placeholder="Ex.: evitar agachamento profundo por 4 semanas; leg press até 90 graus liberado." /></Campo>
                    <div className="flex gap-2"><Botao onClick={() => liberar(e)} disabled={!texto.trim()}>Liberar para treinar</Botao><Botao variante="secundario" onClick={() => setLiberando(null)}>Cancelar</Botao></div>
                  </div>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2 sm:pl-[52px]">
                    {e.status === "aberto" && <Botao variante="secundario" onClick={() => atender(e)}>Iniciar atendimento</Botao>}
                    <Botao onClick={() => { setLiberando(e.id); setTexto(""); }}>Liberar com orientação</Botao>
                    <a href={`https://wa.me/${a.telefone}?text=${encodeURIComponent(`Oi ${a.nome.split(" ")[0]}! Aqui é ${nomeEu}, fisioterapeuta da academia. Recebi seu encaminhamento. Qual horário fica bom para uma avaliação?`)}`} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-xl border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-50">Chamar no WhatsApp</a>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {liberados.length > 0 && (
        <>
          <h2 className="mb-2 mt-8 text-sm font-semibold text-zinc-500">Liberados recentemente</h2>
          <ul className="divide-y divide-zinc-100 rounded-2xl border border-zinc-200/80 bg-white">
            {liberados.slice(0, 10).map((e) => {
              const a = db.alunos.find((x) => x.id === e.alunoId)!;
              return (
                <li key={e.id} className="flex items-start gap-3 p-3 text-sm">
                  <Avatar nome={a.nome} tamanho="sm" />
                  <span className="min-w-0 flex-1"><span className="font-medium">{a.nome}</span><span className="block text-zinc-500">{e.liberacao}</span></span>
                  <span className="text-xs text-zinc-400">{e.liberadoEm ? formatarData(e.liberadoEm) : ""}</span>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </main>
  );
}
