import Link from "next/link";

export default function Inicio() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-3xl font-bold">SAC</h1>
      <p className="mt-2 text-zinc-600">O sistema que faz o aluno ficar.</p>
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <Link href="/painel" className="rounded-lg border bg-white p-4 hover:border-teal-600">
          <p className="font-semibold">Painel da academia</p>
          <p className="text-sm text-zinc-600">Lista do dia: quem procurar hoje</p>
        </Link>
        <Link href="/aluno" className="rounded-lg border bg-white p-4 hover:border-teal-600">
          <p className="font-semibold">App do aluno</p>
          <p className="text-sm text-zinc-600">Treino e evolução</p>
        </Link>
      </div>
    </main>
  );
}
