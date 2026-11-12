"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useBanco } from "@/lib/db";
import { Abas, BotaoLink, Cartao, Carregando, GraficoLinha, Vazio } from "@/components/ui";
import { CabecalhoAluno, Frequencia, HistoricoConsultas, PlanoAlimentarVisual, TreinoVisual } from "@/components/aluno";
import { EditorPlanoAlimentar, FormConsulta } from "@/components/editores";

type Aba = "consulta" | "plano" | "evolucao" | "treino";

function Detalhe() {
  const db = useBanco();
  const id = useSearchParams().get("id") ?? "";
  const [aba, setAba] = useState<Aba>("consulta");
  const [editando, setEditando] = useState(false);
  const [registrando, setRegistrando] = useState(false);
  if (!db) return <Carregando />;
  const aluno = db.alunos.find((a) => a.id === id);
  if (!aluno) return <main className="mx-auto max-w-5xl px-4 py-8"><Vazio>Paciente não encontrado.</Vazio></main>;
  const nutriId = aluno.nutricionistaId ?? "p-nutri1";
  const plano = db.planosAlimentares.find((p) => p.alunoId === id && p.ativo);
  const pesos = [
    ...db.consultas.filter((c) => c.alunoId === id && c.pesoKg).map((c) => ({ x: new Date(c.data), y: c.pesoKg! })),
    ...db.avaliacoes.filter((a) => a.alunoId === id).map((a) => ({ x: new Date(a.data), y: a.pesoKg })),
  ];
  const adesao = db.consultas.filter((c) => c.alunoId === id && c.adesao).map((c) => ({ x: new Date(c.data), y: c.adesao! }));

  return (
    <main className="mx-auto max-w-5xl space-y-4 px-4 py-8">
      <BotaoLink href="/nutricionista/" variante="secundario">← Meus pacientes</BotaoLink>
      <CabecalhoAluno db={db} alunoId={id} />
      <Abas<Aba> atual={aba} aoTrocar={setAba} abas={[{ id: "consulta", rotulo: "Consultas" }, { id: "plano", rotulo: "Plano alimentar" }, { id: "evolucao", rotulo: "Evolução" }, { id: "treino", rotulo: "Treino" }]} />

      {aba === "consulta" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Cartao titulo="Nova consulta" acao={!registrando && <button className="text-sm text-teal-700 hover:underline" onClick={() => setRegistrando(true)}>Registrar</button>}>
            {registrando ? <FormConsulta alunoId={id} nutricionistaId={nutriId} aoSalvar={() => setRegistrando(false)} /> : <p className="text-sm text-zinc-500">Registre peso, adesão ao plano, anotações e o próximo retorno.</p>}
          </Cartao>
          <Cartao titulo="Histórico"><HistoricoConsultas db={db} alunoId={id} /></Cartao>
        </div>
      )}

      {aba === "plano" && (
        <Cartao titulo={editando ? "Montar plano alimentar" : "Plano atual"} acao={!editando && <button className="text-sm text-teal-700 hover:underline" onClick={() => setEditando(true)}>{plano ? "Editar" : "Criar plano"}</button>}>
          {editando ? <EditorPlanoAlimentar alunoId={id} nutricionistaId={nutriId} atual={plano} aoSalvar={() => setEditando(false)} /> : <PlanoAlimentarVisual plano={plano} />}
        </Cartao>
      )}

      {aba === "evolucao" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Cartao titulo="Peso"><GraficoLinha pontos={pesos} unidade="kg" /></Cartao>
          <Cartao titulo="Adesão ao plano (1 a 5)"><GraficoLinha pontos={adesao} unidade="pts" /></Cartao>
          <Frequencia db={db} alunoId={id} />
        </div>
      )}

      {aba === "treino" && (
        <Cartao titulo="Treino atual (somente leitura)"><TreinoVisual treino={db.treinos.find((t) => t.alunoId === id && t.ativo)} /></Cartao>
      )}
    </main>
  );
}

export default function Pagina() {
  return <Suspense fallback={<Carregando />}><Detalhe /></Suspense>;
}
