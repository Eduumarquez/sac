"use client";

import Link from "next/link";
import { useBanco } from "@/lib/db";
import { riscoDoAluno } from "@/lib/regras";
import { diasEntre } from "@/lib/datas";
import { Cartao, Carregando, Etiqueta, EtiquetaRisco, Indicador, Vazio } from "@/components/ui";
import { SeletorPessoa, usePessoaSelecionada } from "@/components/SeletorPessoa";

export default function AreaPersonal() {
  const db = useBanco();
  const personais = db?.profissionais.filter((p) => p.papel === "personal") ?? [];
  const eu = usePessoaSelecionada(personais, "personal");
  if (!db) return <Carregando />;
  const hoje = new Date();
  const meus = db.alunos.filter((a) => a.status === "ativo" && a.personalId === eu).map((a) => {
    const treino = db.treinos.find((t) => t.alunoId === a.id && t.ativo);
    const aval = db.avaliacoes.filter((x) => x.alunoId === a.id).sort((x, y) => y.data.localeCompare(x.data))[0];
    const pend: string[] = [];
    if (!treino) pend.push("montar treino");
    else if (diasEntre(new Date(treino.criadoEm), hoje) > 60) pend.push("renovar treino");
    if (!aval) pend.push("primeira avaliação");
    else if (diasEntre(new Date(aval.data), hoje) > 30) pend.push("reavaliação");
    const treinouHoje = db.checkins.some((c) => c.alunoId === a.id && c.data.slice(0, 10) === hoje.toISOString().slice(0, 10));
    return { a, risco: riscoDoAluno(db, a.id), pend, treinouHoje };
  }).sort((x, y) => y.risco.pontuacao - x.risco.pontuacao);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Área do personal</h1>
        <SeletorPessoa opcoes={personais} tipo="personal" rotulo="Entrar como" />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <Indicador rotulo="Meus alunos" valor={meus.length} />
        <Indicador rotulo="Com pendência" valor={meus.filter((m) => m.pend.length).length} />
        <Indicador rotulo="Em risco" valor={meus.filter((m) => m.risco.nivel !== "baixo").length} />
      </div>

      <div className="mt-6 space-y-3">
        {!meus.length && <Vazio>Nenhum aluno atribuído a você ainda.</Vazio>}
        {meus.map(({ a, risco, pend, treinouHoje }) => (
          <Cartao key={a.id}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Link href={`/personal/aluno/?id=${a.id}`} className="font-semibold text-teal-800 hover:underline">{a.nome}</Link>
              <div className="flex gap-1">
                {treinouHoje && <Etiqueta cor="azul">treinou hoje</Etiqueta>}
                <EtiquetaRisco nivel={risco.nivel} pontuacao={risco.pontuacao} />
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {pend.map((p) => <Etiqueta key={p} cor="amarelo">{p}</Etiqueta>)}
              {!pend.length && <span className="text-sm text-zinc-500">Tudo em dia.</span>}
            </div>
          </Cartao>
        ))}
      </div>
    </main>
  );
}
