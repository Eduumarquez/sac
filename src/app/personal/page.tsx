"use client";

import Link from "next/link";
import { AlertTriangle, ClipboardList, Frown, Users } from "lucide-react";
import { emojiSensacao } from "@/components/equipe";
import { useBanco } from "@/lib/db";
import { riscoDoAluno } from "@/lib/regras";
import { diasEntre, formatarData } from "@/lib/datas";
import { CabecalhoPagina, Carregando, Etiqueta, EtiquetaRisco, Indicador, Vazio } from "@/components/ui";
import { SeletorPessoa, usePessoaSelecionada } from "@/components/SeletorPessoa";
import { ListaCarteira } from "@/components/ListaCarteira";
import { AgendaEquipe } from "@/components/agenda";

export default function AreaPersonal() {
  const db = useBanco();
  const personais = db?.profissionais.filter((p) => p.papel === "personal") ?? [];
  const eu = usePessoaSelecionada(personais, "personal");
  if (!db) return <Carregando />;
  const hoje = new Date();
  const hojeISO = hoje.toISOString().slice(0, 10);
  const meus = db.alunos.filter((a) => a.status === "ativo" && a.personalId === eu).map((a) => {
    const treino = db.treinos.find((t) => t.alunoId === a.id && t.ativo);
    const aval = db.avaliacoes.filter((x) => x.alunoId === a.id).sort((x, y) => y.data.localeCompare(x.data))[0];
    const pend: string[] = [];
    if (!treino) pend.push("Montar treino");
    else if (diasEntre(new Date(treino.criadoEm), hoje) > 60) pend.push("Renovar treino");
    if (!aval) pend.push("1ª avaliação");
    else if (diasEntre(new Date(aval.data), hoje) > 30) pend.push("Reavaliação");
    const ultimo = db.checkins.filter((c) => c.alunoId === a.id).sort((x, y) => y.data.localeCompare(x.data))[0];
    const fb = db.feedbacks.filter((f) => f.alunoId === a.id).sort((x, y) => y.data.localeCompare(x.data))[0];
    const fbRuim = fb && fb.sensacao <= 2 && diasEntre(new Date(fb.data), hoje) <= 14 ? fb : undefined;
    if (fbRuim) pend.unshift("Conversar sobre o treino");
    return { a, risco: riscoDoAluno(db, a.id), pend, treinouHoje: ultimo?.data.slice(0, 10) === hojeISO, ultimo, fbRuim };
  }).sort((x, y) => y.pend.length - x.pend.length || y.risco.pontuacao - x.risco.pontuacao);
  const nomeEu = personais.find((p) => p.id === eu)?.nome.split(" ")[0];

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <CabecalhoPagina titulo={`Olá, ${nomeEu}`} subtitulo="Seus alunos e o que fazer por cada um" acao={<SeletorPessoa opcoes={personais} tipo="personal" rotulo="Entrar como" />} />

      <div className="mb-6 grid grid-cols-3 gap-3">
        <Indicador rotulo="Alunos" valor={meus.length} icone={<Users size={18} />} />
        <Indicador rotulo="Pendências" valor={meus.reduce((s, m) => s + m.pend.length, 0)} icone={<ClipboardList size={18} />} />
        <Indicador rotulo="Em risco" valor={meus.filter((m) => m.risco.nivel !== "baixo").length} icone={<AlertTriangle size={18} />} destaque={meus.some((m) => m.risco.nivel === "alto") ? "vermelho" : undefined} />
      </div>

      {meus.some((m) => m.fbRuim) && (
        <section className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <h2 className="flex items-center gap-2 font-semibold text-amber-900"><Frown size={18} /> Alunos que não gostaram do último treino</h2>
          <ul className="mt-2 space-y-2">
            {meus.filter((m) => m.fbRuim).map(({ a, fbRuim }) => (
              <li key={a.id}>
                <Link href={`/personal/aluno/?id=${a.id}`} className="flex items-start gap-3 rounded-xl bg-white p-3 hover:bg-amber-100/40">
                  <span className="text-2xl leading-none">{emojiSensacao(fbRuim!.sensacao)}</span>
                  <span className="min-w-0 text-sm">
                    <strong className="text-zinc-900">{a.nome}</strong> <span className="text-zinc-400">· {fbRuim!.divisao} · {formatarData(fbRuim!.data)}</span>
                    {fbRuim!.comentario && <span className="block text-zinc-600">“{fbRuim!.comentario}”</span>}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mb-6"><AgendaEquipe db={db} profissionalId={eu} dias={3} titulo="Sua agenda" /></div>

      <ListaCarteira
        vazio={<Vazio>Nenhum aluno atribuído a você ainda. Novos alunos de planos com personal aparecem aqui após a matrícula.</Vazio>}
        itens={meus.map(({ a, risco, pend, treinouHoje, ultimo }) => ({
          id: a.id, nome: a.nome, href: `/personal/aluno/?id=${a.id}`,
          urgente: pend.length > 0 || risco.nivel !== "baixo",
          linha: treinouHoje ? "Treinou hoje" : ultimo ? `Último treino em ${formatarData(ultimo.data)}` : "Ainda não treinou",
          etiquetas: (
            <>
              {risco.nivel !== "baixo" && <EtiquetaRisco nivel={risco.nivel} pontuacao={risco.pontuacao} />}
              {treinouHoje && <Etiqueta cor="azul">Na academia hoje</Etiqueta>}
              {pend.map((p) => <Etiqueta key={p} cor="amarelo">{p}</Etiqueta>)}
            </>
          ),
        }))}
      />
    </main>
  );
}
