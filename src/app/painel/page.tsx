"use client";

import { useEffect, useState } from "react";
import { alunosDemo, type AlunoDemo } from "@/lib/demo";
import { calcularRisco, mensagemSugerida, type NivelRisco, type ResultadoRisco } from "@/lib/risco";

const corNivel: Record<NivelRisco, string> = {
  alto: "bg-red-100 text-red-800",
  medio: "bg-amber-100 text-amber-800",
  baixo: "bg-emerald-100 text-emerald-800",
};

type Item = { aluno: AlunoDemo; risco: ResultadoRisco };

export default function Painel() {
  // Calculado no navegador para usar a data de hoje (o site é estático).
  // TODO: trocar os dados de exemplo por uma consulta ao Supabase
  const [lista, setLista] = useState<Item[] | null>(null);

  useEffect(() => {
    setLista(
      alunosDemo
        .map((a) => ({ aluno: a, risco: calcularRisco(a) }))
        .sort((x, y) => y.risco.pontuacao - x.risco.pontuacao),
    );
  }, []);

  const emRisco = lista?.filter((l) => l.risco.nivel !== "baixo") ?? [];

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold">Lista do dia</h1>
      <p className="mt-1 text-zinc-600">
        {lista ? `${emRisco.length} alunos precisam de contato hoje. Dados de exemplo.` : "Calculando..."}
      </p>

      <ul className="mt-6 space-y-3">
        {lista?.map(({ aluno, risco }) => {
          const primeiroNome = aluno.nome.split(" ")[0];
          const texto = mensagemSugerida(primeiroNome, risco);
          const linkWhats = `https://wa.me/${aluno.telefone}?text=${encodeURIComponent(texto)}`;
          return (
            <li key={aluno.id} className="rounded-lg border bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold">{aluno.nome}</p>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${corNivel[risco.nivel]}`}>
                  risco {risco.nivel} · {risco.pontuacao}
                </span>
              </div>
              {risco.motivos.length > 0 && (
                <p className="mt-1 text-sm text-zinc-600">{risco.motivos.join(" · ")}</p>
              )}
              {risco.nivel !== "baixo" && (
                <a
                  href={linkWhats}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-block rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800"
                >
                  Chamar no WhatsApp
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
