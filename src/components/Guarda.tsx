"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { inicioDo, NOME_PAPEL, podeAbrir, PUBLICAS, useSessao } from "@/lib/sessao";
import { BotaoLink, Carregando } from "./ui";


/** Só mostra a página para quem tem acesso a ela. */
export function Guarda({ children }: { children: React.ReactNode }) {
  const caminho = usePathname() ?? "/";
  const sessao = useSessao();
  const router = useRouter();
  const c = caminho.endsWith("/") ? caminho : caminho + "/";
  const publica = PUBLICAS.includes(c);

  useEffect(() => {
    if (sessao === null && !publica) {
      const volta = c + (typeof window !== "undefined" ? window.location.search : "");
      router.replace(`/entrar/?volta=${encodeURIComponent(volta)}`);
    }
  }, [sessao, publica, c, router]);

  if (publica) return <>{children}</>;
  if (sessao === undefined || sessao === null) return <Carregando />;
  if (!podeAbrir(sessao, c)) {
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500"><Lock size={26} /></span>
        <h1 className="mt-4 text-xl font-bold">Esta área não é do seu acesso</h1>
        <p className="mt-2 text-zinc-600">Você entrou como {NOME_PAPEL[sessao.papel].toLowerCase()} ({sessao.nome}). Para ver esta área, entre com outra conta.</p>
        <div className="mt-6 flex justify-center gap-2">
          <BotaoLink href={inicioDo(sessao)}>Ir para a minha área</BotaoLink>
          <BotaoLink href="/entrar/" variante="secundario">Trocar de conta</BotaoLink>
        </div>
      </main>
    );
  }
  return <>{children}</>;
}

