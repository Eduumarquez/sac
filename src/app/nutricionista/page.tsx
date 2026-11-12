"use client";

import Link from "next/link";
import { useBanco } from "@/lib/db";
import { dataISO, formatarData } from "@/lib/datas";
import { Cartao, Carregando, Etiqueta, Indicador, Vazio } from "@/components/ui";
import { SeletorPessoa, usePessoaSelecionada } from "@/components/SeletorPessoa";

export default function AreaNutricionista() {
  const db = useBanco();
  const nutris = db?.profissionais.filter((p) => p.papel === "nutricionista") ?? [];
  const eu = usePessoaSelecionada(nutris, "nutricionista");
  if (!db) return <Carregando />;
  const hoje = dataISO(new Date());
  const meus = db.alunos.filter((a) => a.status === "ativo" && a.nutricionistaId === eu).map((a) => {
    const consultas = db.consultas.filter((c) => c.alunoId === a.id).sort((x, y) => y.data.localeCompare(x.data));
    const plano = db.planosAlimentares.find((p) => p.alunoId === a.id && p.ativo);
    const retorno = consultas[0]?.proximoRetorno;
    const pend: string[] = [];
    if (!consultas.length) pend.push("primeira consulta");
    if (!plano) pend.push("montar plano alimentar");
    if (retorno && retorno < hoje) pend.push("retorno atrasado");
    return { a, ultima: consultas[0], plano, retorno, pend };
  }).sort((x, y) => (x.retorno ?? "0").localeCompare(y.retorno ?? "0"));

  const proximos = meus.filter((m) => m.retorno && m.retorno >= hoje);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Área da nutricionista</h1>
        <SeletorPessoa opcoes={nutris} tipo="nutricionista" rotulo="Entrar como" />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <Indicador rotulo="Pacientes" valor={meus.length} />
        <Indicador rotulo="Retornos marcados" valor={proximos.length} />
        <Indicador rotulo="Com pendência" valor={meus.filter((m) => m.pend.length).length} />
      </div>

      <div className="mt-6 space-y-3">
        {!meus.length && <Vazio>Nenhum paciente atribuído. Alunos dos planos com nutricionista aparecem aqui após a matrícula.</Vazio>}
        {meus.map(({ a, ultima, plano, retorno, pend }) => (
          <Cartao key={a.id}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Link href={`/nutricionista/aluno/?id=${a.id}`} className="font-semibold text-teal-800 hover:underline">{a.nome}</Link>
              {retorno && <span className="text-sm text-zinc-500">Retorno: {formatarData(retorno)}</span>}
            </div>
            <p className="mt-1 text-sm text-zinc-600">
              {ultima ? `Última consulta em ${formatarData(ultima.data)}${ultima.pesoKg ? ` · ${ultima.pesoKg} kg` : ""}` : "Ainda sem consulta"}
              {plano ? ` · plano de ${plano.metaKcal} kcal` : ""}
            </p>
            {pend.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{pend.map((p) => <Etiqueta key={p} cor={p === "retorno atrasado" ? "vermelho" : "amarelo"}>{p}</Etiqueta>)}</div>}
          </Cartao>
        ))}
      </div>
    </main>
  );
}
