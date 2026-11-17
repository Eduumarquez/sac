"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { alterar, useBanco } from "@/lib/db";
import { statusCobranca } from "@/lib/regras";
import { formatarData, formatarDinheiro } from "@/lib/datas";
import type { StatusAluno } from "@/lib/tipos";
import { Abas, Campo, Cartao, Carregando, Etiqueta, Vazio, estiloInput } from "@/components/ui";
import { LinhaDoTempo } from "@/components/equipe";
import { FluxoCancelamento } from "@/components/retencao";
import { MetaAluno } from "@/components/meta";
import { EncaminharFisio } from "@/components/saude";
import { Botao } from "@/components/ui";
import { CabecalhoAluno, EvolucaoCargas, EvolucaoCorporal, Frequencia, HistoricoConsultas, PlanoAlimentarVisual, TreinoVisual } from "@/components/aluno";

type Aba = "geral" | "treino" | "corpo" | "nutricao" | "financeiro";

function Ficha() {
  const db = useBanco();
  const id = useSearchParams().get("id") ?? "";
  const [aba, setAba] = useState<Aba>("geral");
  const [cancelando, setCancelando] = useState(false);
  if (!db) return <Carregando />;
  const aluno = db.alunos.find((a) => a.id === id);
  if (!aluno) return <main className="mx-auto max-w-5xl px-4 py-8"><Vazio>Aluno não encontrado.</Vazio></main>;
  const profs = (papel: string) => db.profissionais.filter((p) => p.papel === papel);
  const atualizar = (campo: "personalId" | "nutricionistaId" | "planoId" | "status", valor: string) =>
    alterar((d) => ({ ...d, alunos: d.alunos.map((a) => (a.id === id ? { ...a, [campo]: valor || undefined } : a)) }));

  return (
    <main className="mx-auto max-w-5xl space-y-5 px-4 py-6">
      <Link href="/painel/" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900">← Voltar ao painel</Link>
      <CabecalhoAluno db={db} alunoId={id} />
      <FluxoCancelamento db={db} alunoId={id} origem="recepcao" aberto={cancelando} aoFechar={() => setCancelando(false)} />
      <Abas<Aba> atual={aba} aoTrocar={setAba} abas={[
        { id: "geral", rotulo: "Visão geral" }, { id: "treino", rotulo: "Treino" }, { id: "corpo", rotulo: "Avaliações" },
        { id: "nutricao", rotulo: "Nutrição" }, { id: "financeiro", rotulo: "Financeiro" },
      ]} />

      {aba === "geral" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Cartao titulo="Cadastro e equipe">
            <div className="grid gap-3">
              <p className="text-sm text-zinc-600">{aluno.email} · WhatsApp {aluno.telefone}</p>
              <Campo rotulo="Plano">
                <select className={estiloInput} value={aluno.planoId} onChange={(e) => atualizar("planoId", e.target.value)}>
                  {db.planos.map((p) => <option key={p.id} value={p.id}>{p.nome} ({formatarDinheiro(p.valorCentavos)})</option>)}
                </select>
              </Campo>
              <Campo rotulo="Personal">
                <select className={estiloInput} value={aluno.personalId ?? ""} onChange={(e) => atualizar("personalId", e.target.value)}>
                  <option value="">Professor do salão</option>
                  {profs("personal").map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
              </Campo>
              <Campo rotulo="Nutricionista">
                <select className={estiloInput} value={aluno.nutricionistaId ?? ""} onChange={(e) => atualizar("nutricionistaId", e.target.value)}>
                  <option value="">Sem nutricionista</option>
                  {profs("nutricionista").map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
              </Campo>
              <Campo rotulo="Situação">
                <select className={estiloInput} value={aluno.status} onChange={(e) => (e.target.value === "cancelado" ? setCancelando(true) : atualizar("status", e.target.value as StatusAluno))}>
                  <option value="ativo">Ativo</option><option value="pausado">Pausado</option><option value="cancelado">Cancelado</option>
                </select>
              </Campo>
            </div>
          </Cartao>
          <div className="space-y-3">
            <Frequencia db={db} alunoId={id} />
            <MetaAluno db={db} alunoId={id} autorId={aluno.personalId ?? aluno.nutricionistaId ?? "p-dono"} />
            <EncaminharFisio db={db} alunoId={id} deId="p-rec" />
            {aluno.status !== "cancelado" && (
              <Cartao titulo="Aluno quer cancelar?">
                <p className="mb-3 text-sm text-zinc-500">Registre o motivo e ofereça uma alternativa antes de cancelar. O sistema sugere a melhor opção.</p>
                <Botao variante="secundario" onClick={() => setCancelando(true)}>Registrar pedido de cancelamento</Botao>
              </Cartao>
            )}
          </div>
          <div className="sm:col-span-2"><LinhaDoTempo db={db} alunoId={id} autorId="p-dono" /></div>
        </div>
      )}

      {aba === "treino" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Cartao titulo="Treino atual"><TreinoVisual treino={db.treinos.find((t) => t.alunoId === id && t.ativo)} /></Cartao>
          <EvolucaoCargas db={db} alunoId={id} />
        </div>
      )}

      {aba === "corpo" && <EvolucaoCorporal db={db} alunoId={id} />}

      {aba === "nutricao" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Cartao titulo="Plano alimentar"><PlanoAlimentarVisual plano={db.planosAlimentares.find((p) => p.alunoId === id && p.ativo)} /></Cartao>
          <Cartao titulo="Consultas"><HistoricoConsultas db={db} alunoId={id} /></Cartao>
        </div>
      )}

      {aba === "financeiro" && (
        <Cartao titulo="Cobranças">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-zinc-500"><tr><th className="py-2">Vencimento</th><th>Valor</th><th>Situação</th></tr></thead>
            <tbody>
              {db.cobrancas.filter((c) => c.alunoId === id).sort((a, b) => b.vencimento.localeCompare(a.vencimento)).map((c) => {
                const s = statusCobranca(c);
                return (
                  <tr key={c.id} className="border-t border-zinc-100">
                    <td className="py-2">{formatarData(c.vencimento)}</td><td>{formatarDinheiro(c.valorCentavos)}</td>
                    <td>{s === "pago" ? <Etiqueta cor="verde">pago{c.metodo ? ` (${c.metodo})` : ""}</Etiqueta> : s === "atrasado" ? <Etiqueta cor="vermelho">atrasado</Etiqueta> : <Etiqueta>a vencer</Etiqueta>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Cartao>
      )}
    </main>
  );
}

export default function Pagina() {
  return <Suspense fallback={<Carregando />}><Ficha /></Suspense>;
}
