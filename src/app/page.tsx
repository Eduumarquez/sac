import Link from "next/link";
import { Apple, ArrowRight, Building2, ClipboardSignature, Dumbbell, HeartHandshake, Smartphone } from "lucide-react";

const PERFIS = [
  { href: "/aluno/", titulo: "Sou aluno", texto: "Faça check-in, veja o treino do dia, registre cargas e acompanhe sua evolução.", icone: Smartphone, destaque: true },
  { href: "/painel/", titulo: "Sou dono ou recepção", texto: "Veja quem está perto de cancelar, fale com o aluno no WhatsApp e acompanhe o financeiro.", icone: Building2 },
  { href: "/personal/", titulo: "Sou personal", texto: "Monte treinos, faça avaliações físicas e veja quem precisa de atenção.", icone: Dumbbell },
  { href: "/nutricionista/", titulo: "Sou nutricionista", texto: "Crie planos alimentares, registre consultas e controle os retornos.", icone: Apple },
];

const JORNADA = [
  { t: "Matrícula online", d: "Plano, anamnese e pagamento em 4 passos" },
  { t: "Avaliação física", d: "Medidas e objetivo com o personal" },
  { t: "Treino no app", d: "Divisões, cargas e check-in" },
  { t: "Plano alimentar", d: "Refeições e retornos com a nutri" },
  { t: "Retenção", d: "Alerta antes do aluno desistir" },
];

export default function Inicio() {
  return (
    <main className="mx-auto max-w-6xl px-4 pb-16">
      <section className="py-10 sm:py-16">
        <p className="inline-flex items-center gap-2 rounded-full bg-marca-50 px-3 py-1 text-sm font-medium text-marca-800">
          <HeartHandshake size={16} /> O sistema que faz o aluno ficar
        </p>
        <h1 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
          Da matrícula ao resultado, com toda a equipe olhando para o mesmo aluno.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-zinc-600">
          Academia, personal e nutricionista conectados. O sistema avisa quem está sumindo para a equipe agir antes do cancelamento.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/matricula/" className="inline-flex items-center gap-2 rounded-xl bg-marca-700 px-5 py-3 font-medium text-white shadow-sm hover:bg-marca-800">
            <ClipboardSignature size={18} /> Fazer uma matrícula
          </Link>
          <Link href="/painel/" className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-5 py-3 font-medium text-zinc-800 hover:bg-zinc-50">
            Ver o painel da academia
          </Link>
        </div>
      </section>

      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Como você quer entrar?</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {PERFIS.map((p) => (
          <Link key={p.href} href={p.href} className={`group flex gap-4 rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${p.destaque ? "border-marca-200" : "border-zinc-200/80"}`}>
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-marca-50 text-marca-700">
              <p.icone size={24} />
            </span>
            <span className="flex-1">
              <span className="flex items-center justify-between font-semibold text-zinc-900">
                {p.titulo}
                <ArrowRight size={18} className="text-zinc-300 transition group-hover:translate-x-1 group-hover:text-marca-600" />
              </span>
              <span className="mt-1 block text-sm text-zinc-600">{p.texto}</span>
            </span>
          </Link>
        ))}
      </div>

      <h2 className="mt-12 text-sm font-semibold uppercase tracking-wide text-zinc-500">A jornada do aluno</h2>
      <ol className="mt-3 grid gap-3 sm:grid-cols-5">
        {JORNADA.map((p, i) => (
          <li key={p.t} className="relative rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-marca-700 text-xs font-bold text-white">{i + 1}</span>
            <p className="mt-3 font-medium text-zinc-900">{p.t}</p>
            <p className="mt-1 text-sm text-zinc-500">{p.d}</p>
          </li>
        ))}
      </ol>

      <p className="mt-10 text-center text-sm text-zinc-400">
        Modo demonstração: os dados ficam salvos só neste navegador.
      </p>
    </main>
  );
}
