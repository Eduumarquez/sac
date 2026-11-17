"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useBanco } from "@/lib/db";
import { Abas, Cartao, Carregando, Vazio } from "@/components/ui";
import { CabecalhoAluno, EvolucaoCargas, EvolucaoCorporal, Frequencia, PlanoAlimentarVisual, TreinoVisual } from "@/components/aluno";
import { EditorTreino, FormAvaliacao } from "@/components/editores";

type Aba = "treino" | "avaliacao" | "evolucao" | "nutricao";

function Detalhe() {
  const db = useBanco();
  const id = useSearchParams().get("id") ?? "";
  const [aba, setAba] = useState<Aba>("treino");
  const [editando, setEditando] = useState(false);
  const [avaliando, setAvaliando] = useState(false);
  if (!db) return <Carregando />;
  const aluno = db.alunos.find((a) => a.id === id);
  if (!aluno) return <main className="mx-auto max-w-5xl px-4 py-8"><Vazio>Aluno não encontrado.</Vazio></main>;
  const treino = db.treinos.find((t) => t.alunoId === id && t.ativo);
  const personalId = aluno.personalId ?? "p-pers1";
  const ultimaAltura = db.avaliacoes.filter((a) => a.alunoId === id).sort((a, b) => b.data.localeCompare(a.data))[0]?.alturaCm;

  return (
    <main className="mx-auto max-w-5xl space-y-5 px-4 py-6">
      <Link href="/personal/" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900">← Meus alunos</Link>
      <CabecalhoAluno db={db} alunoId={id} />
      <Abas<Aba> atual={aba} aoTrocar={setAba} abas={[{ id: "treino", rotulo: "Treino" }, { id: "avaliacao", rotulo: "Avaliação física" }, { id: "evolucao", rotulo: "Evolução" }, { id: "nutricao", rotulo: "Nutrição" }]} />

      {aba === "treino" && (
        <Cartao titulo={editando ? "Montar treino" : "Treino atual"} acao={!editando && <button className="rounded-lg px-2 py-1 text-sm font-medium text-marca-700 hover:bg-marca-50" onClick={() => setEditando(true)}>{treino ? "Editar / renovar" : "Montar treino"}</button>}>
          {editando ? <EditorTreino alunoId={id} personalId={personalId} atual={treino} aoSalvar={() => setEditando(false)} /> : <TreinoVisual treino={treino} />}
        </Cartao>
      )}

      {aba === "avaliacao" && (
        <>
          <Cartao titulo="Nova avaliação" acao={!avaliando && <button className="rounded-lg px-2 py-1 text-sm font-medium text-marca-700 hover:bg-marca-50" onClick={() => setAvaliando(true)}>Registrar</button>}>
            {avaliando ? <FormAvaliacao alunoId={id} personalId={personalId} alturaAnterior={ultimaAltura} aoSalvar={() => setAvaliando(false)} /> : <p className="text-sm text-zinc-500">Registre peso, medidas e percentual de gordura. O aluno vê a evolução no app.</p>}
          </Cartao>
          <EvolucaoCorporal db={db} alunoId={id} />
        </>
      )}

      {aba === "evolucao" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <EvolucaoCargas db={db} alunoId={id} />
          <Frequencia db={db} alunoId={id} />
        </div>
      )}

      {aba === "nutricao" && (
        <Cartao titulo="Plano alimentar (somente leitura)">
          <PlanoAlimentarVisual plano={db.planosAlimentares.find((p) => p.alunoId === id && p.ativo)} />
        </Cartao>
      )}
    </main>
  );
}

export default function Pagina() {
  return <Suspense fallback={<Carregando />}><Detalhe /></Suspense>;
}
