import Link from "next/link";

const AREAS = [
  { href: "/matricula/", titulo: "Matrícula online", texto: "O aluno escolhe o plano, preenche a anamnese, aceita os termos e paga. Personal e nutricionista são atribuídos na hora." },
  { href: "/painel/", titulo: "Academia (dono e recepção)", texto: "Lista do dia com quem está em risco de cancelar, alunos, ficha completa e financeiro." },
  { href: "/personal/", titulo: "Personal", texto: "Carteira de alunos, montagem de treino, avaliação física e evolução de cargas." },
  { href: "/nutricionista/", titulo: "Nutricionista", texto: "Plano alimentar, consultas, retornos e evolução de peso." },
  { href: "/aluno/", titulo: "App do aluno", texto: "Check-in, treino do dia, registro de carga, plano alimentar e evolução." },
];

export default function Inicio() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-bold">SAC</h1>
      <p className="mt-2 max-w-2xl text-zinc-600">
        O sistema que faz o aluno ficar: da matrícula ao acompanhamento com o personal e a nutricionista, com alertas para a equipe agir antes do cancelamento.
      </p>
      <p className="mt-3 inline-block rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
        Modo demonstração: os dados ficam salvos só neste navegador. Use “Reiniciar demonstração” no topo para voltar ao início.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {AREAS.map((a) => (
          <Link key={a.href} href={a.href} className="rounded-xl border border-zinc-200 bg-white p-5 hover:border-teal-600">
            <p className="font-semibold">{a.titulo}</p>
            <p className="mt-1 text-sm text-zinc-600">{a.texto}</p>
          </Link>
        ))}
      </div>

      <h2 className="mt-12 text-xl font-bold">A jornada do aluno</h2>
      <ol className="mt-4 grid gap-3 sm:grid-cols-5">
        {["Matrícula e pagamento", "Anamnese e avaliação física", "Treino com o personal", "Plano com a nutricionista", "Acompanhamento e retenção"].map((p, i) => (
          <li key={p} className="rounded-xl border border-zinc-200 bg-white p-4">
            <span className="text-xs font-bold text-teal-700">{i + 1}</span>
            <p className="mt-1 text-sm font-medium">{p}</p>
          </li>
        ))}
      </ol>
    </main>
  );
}
