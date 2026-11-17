"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, LayoutGrid, LogIn } from "lucide-react";
import { useBanco } from "@/lib/db";
import { acharConta, contasDemo, entrar, inicioDo, podeAbrir, type Sessao } from "@/lib/sessao";
import { Avatar, Botao, Campo, Carregando, estiloInput } from "@/components/ui";

export default function Entrar() {
  const db = useBanco();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");

  function ir(s: Sessao) {
    entrar(s);
    const volta = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("volta") : null;
    router.push(volta && podeAbrir(s, volta) ? volta : inicioDo(s));
  }

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!db) return;
    const conta = acharConta(db, email);
    if (!conta) return setErro("Não encontramos esse e-mail. Use uma das contas de teste abaixo.");
    if (!senha) return setErro("Digite a senha.");
    ir(conta.sessao);
  }

  if (!db) return <Carregando />;
  const contas = contasDemo(db);
  const equipe = contas.filter((c) => c.sessao.papel !== "aluno");
  const alunos = contas.filter((c) => c.sessao.papel === "aluno").slice(0, 4);

  return (
    <main className="mx-auto grid max-w-5xl gap-8 px-4 py-8 sm:py-12 lg:grid-cols-[1fr_1.1fr]">
      <section>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Entrar</h1>
        <p className="mt-1 text-zinc-600">Cada pessoa vê só a sua área: o aluno vê o app dele, e a equipe vê o que é do seu trabalho.</p>
        <form onSubmit={enviar} className="mt-6 space-y-3 rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm">
          <Campo rotulo="E-mail"><input type="email" autoComplete="username" className={estiloInput} value={email} onChange={(e) => { setEmail(e.target.value); setErro(""); }} placeholder="voce@exemplo.com" /></Campo>
          <Campo rotulo="Senha"><input type="password" autoComplete="current-password" className={estiloInput} value={senha} onChange={(e) => { setSenha(e.target.value); setErro(""); }} /></Campo>
          {erro && <p role="alert" className="text-sm text-red-700">{erro}</p>}
          <Botao type="submit" className="w-full" icone={<LogIn size={18} />}>Entrar</Botao>
          <p className="text-xs text-zinc-500">Na demonstração qualquer senha funciona. No sistema de verdade, cada pessoa cria a própria senha.</p>
        </form>
        <button onClick={() => ir({ papel: "demo", nome: "Demonstração" })} className="mt-4 flex w-full items-center gap-3 rounded-2xl border border-dashed border-marca-300 bg-marca-50/50 p-4 text-left hover:bg-marca-50">
          <LayoutGrid size={22} className="shrink-0 text-marca-700" />
          <span className="flex-1"><span className="block font-medium text-zinc-900">Ver demonstração completa</span><span className="text-sm text-zinc-600">Todas as áreas abertas, para apresentar o sistema.</span></span>
          <ChevronRight size={18} className="text-zinc-400" />
        </button>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Contas de teste</h2>
        <p className="mb-3 text-sm text-zinc-500">Toque em uma para entrar direto.</p>
        <Lista titulo="Equipe" contas={equipe} aoEscolher={(s) => ir(s)} />
        <Lista titulo="Alunos" contas={alunos} aoEscolher={(s) => ir(s)} />
      </section>
    </main>
  );
}

function Lista({ titulo, contas, aoEscolher }: { titulo: string; contas: ReturnType<typeof contasDemo>; aoEscolher: (s: Sessao) => void }) {
  return (
    <div className="mb-4">
      <p className="mb-1.5 text-xs font-medium text-zinc-400">{titulo}</p>
      <ul className="divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
        {contas.map((c) => (
          <li key={c.email}>
            <button onClick={() => aoEscolher(c.sessao)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-zinc-50">
              <Avatar nome={c.sessao.nome} tamanho="sm" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-zinc-900">{c.sessao.nome} <span className="font-normal text-zinc-400">· {c.detalhe}</span></span>
                <span className="block truncate text-xs text-zinc-500">{c.email}</span>
              </span>
              <ChevronRight size={16} className="text-zinc-300" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
