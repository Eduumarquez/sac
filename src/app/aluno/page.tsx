"use client";

import { useState } from "react";
import { Apple, CalendarDays, Check, CircleUser, Dumbbell, Flame, LineChart, MapPin } from "lucide-react";
import { alterar, useBanco } from "@/lib/db";
import { sequenciaSemanas, statusCobranca } from "@/lib/regras";
import { formatarData, formatarDinheiro, isoAgora, novoId } from "@/lib/datas";
import { saudacao } from "@/lib/mascaras";
import { Abas, BarraProgresso, Cartao, Carregando, Etiqueta, GraficoLinha, Vazio, avisar } from "@/components/ui";
import { EvolucaoCargas } from "@/components/aluno";
import { SENSACOES, emojiSensacao } from "@/components/equipe";
import type { Sensacao } from "@/lib/tipos";
import { SeletorPessoa, usePessoaSelecionada } from "@/components/SeletorPessoa";

type Aba = "treino" | "dieta" | "evolucao" | "conta";
const ABAS: { id: Aba; rotulo: string; icone: typeof Dumbbell }[] = [
  { id: "treino", rotulo: "Treino", icone: Dumbbell },
  { id: "dieta", rotulo: "Dieta", icone: Apple },
  { id: "evolucao", rotulo: "Evolução", icone: LineChart },
  { id: "conta", rotulo: "Conta", icone: CircleUser },
];

export default function AppAluno() {
  const db = useBanco();
  const alunos = db?.alunos.filter((a) => a.status === "ativo") ?? [];
  const id = usePessoaSelecionada(alunos, "aluno");
  const [aba, setAba] = useState<Aba>("treino");
  const [divisaoEscolhida, setDivisao] = useState<number | null>(null);
  const [feitos, setFeitos] = useState<Record<string, boolean>>({});
  const [cargas, setCargas] = useState<Record<string, string>>({});
  const [sensacao, setSensacao] = useState<Sensacao | null>(null);
  const [comentario, setComentario] = useState("");

  if (!db) return <Carregando />;
  const aluno = db.alunos.find((a) => a.id === id);
  if (!aluno) return <main className="mx-auto max-w-md px-4 py-8"><Vazio>Nenhum aluno ativo.</Vazio></main>;

  const agora = new Date();
  const hojeStr = agora.toISOString().slice(0, 10);
  const meusCheckins = db.checkins.filter((c) => c.alunoId === aluno.id);
  const fezCheckin = meusCheckins.some((c) => c.data.slice(0, 10) === hojeStr);
  const seq = sequenciaSemanas(meusCheckins.map((c) => new Date(c.data)));
  const noMes = meusCheckins.filter((c) => c.data.slice(0, 7) === hojeStr.slice(0, 7)).length;
  const treino = db.treinos.find((t) => t.alunoId === aluno.id && t.ativo);
  // sugere a próxima divisão do rodízio (A, B, C...) com base no número de treinos
  const sugerida = treino ? (meusCheckins.length - (fezCheckin ? 1 : 0)) % treino.divisoes.length : 0;
  const divisao = divisaoEscolhida ?? sugerida;
  const div = treino?.divisoes[Math.min(divisao, (treino?.divisoes.length ?? 1) - 1)];
  const chave = (ex: string) => `${hojeStr}|${div?.nome}|${ex}`;
  const qtdFeitos = div?.exercicios.filter((e) => feitos[chave(e.exercicio)]).length ?? 0;
  const personal = db.profissionais.find((p) => p.id === aluno.personalId);
  const nutri = db.profissionais.find((p) => p.id === aluno.nutricionistaId);
  const plano = db.planosAlimentares.find((p) => p.alunoId === aluno.id && p.ativo);
  const retorno = db.consultas.filter((c) => c.alunoId === aluno.id).sort((a, b) => b.data.localeCompare(a.data))[0]?.proximoRetorno;
  const pesos = [
    ...db.avaliacoes.filter((a) => a.alunoId === aluno.id).map((a) => ({ x: new Date(a.data), y: a.pesoKg })),
    ...db.consultas.filter((c) => c.alunoId === aluno.id && c.pesoKg).map((c) => ({ x: new Date(c.data), y: c.pesoKg! })),
  ];
  const feedbackHoje = db.feedbacks.find((f) => f.alunoId === aluno.id && f.data.slice(0, 10) === hojeStr);
  const treinoConcluido = !!div && qtdFeitos === div.exercicios.length && div.exercicios.length > 0;
  const checkinHoje = meusCheckins.find((c) => c.data.slice(0, 10) === hojeStr);
  const treinandoHaTempo = !!checkinHoje && agora.getTime() - new Date(checkinHoje.data).getTime() > 45 * 60_000;
  const pedirFeedback = !!treino && !feedbackHoje && (treinoConcluido || treinandoHaTempo);
  const horaAgora = `${String(agora.getHours()).padStart(2, "0")}:${String(agora.getMinutes()).padStart(2, "0")}`;
  const proximaRefeicao = plano?.refeicoes.findIndex((r) => r.horario >= horaAgora) ?? -1;

  function checkin(silencioso = false) {
    if (fezCheckin) return;
    alterar((d) => ({ ...d, checkins: [...d.checkins, { id: novoId(), alunoId: aluno!.id, data: isoAgora() }] }));
    if (!silencioso) avisar("Check-in feito. Bom treino!");
  }
  function alternarFeito(ex: string) {
    const novo = { ...feitos, [chave(ex)]: !feitos[chave(ex)] };
    setFeitos(novo);
    const total = div?.exercicios.length ?? 0;
    const agoraFeitos = div?.exercicios.filter((e) => novo[chave(e.exercicio)]).length ?? 0;
    if (agoraFeitos === total && total > 0) {
      checkin(true);
      avisar("Treino concluído! 💪");
    }
  }
  function enviarFeedback() {
    if (!sensacao || !div) return;
    alterar((d) => ({ ...d, feedbacks: [...d.feedbacks, { id: novoId(), alunoId: aluno!.id, data: isoAgora(), divisao: div.nome, sensacao, comentario: comentario.trim() || undefined }] }));
    setSensacao(null);
    setComentario("");
    avisar(personal ? `Obrigado! ${personal.nome.split(" ")[0]} vai ver como foi.` : "Obrigado pelo retorno!");
  }
  function registrar(exercicio: string) {
    const valor = Number((cargas[exercicio] ?? "").replace(",", "."));
    if (!valor) return;
    alterar((d) => ({ ...d, registrosCarga: [...d.registrosCarga, { id: novoId(), alunoId: aluno!.id, exercicio, cargaKg: valor, repeticoes: 0, data: isoAgora() }] }));
    setCargas({ ...cargas, [exercicio]: "" });
    avisar(`${valor} kg registrado em ${exercicio}`);
  }

  return (
    <main className="pb-barra mx-auto max-w-lg px-4 pt-5 sm:pb-12">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <p className="text-sm text-zinc-500">{saudacao()},</p>
          <h1 className="text-2xl font-bold tracking-tight">{aluno.nome.split(" ")[0]} 👋</h1>
        </div>
        <SeletorPessoa opcoes={alunos} tipo="aluno" rotulo="Aluno" />
      </div>

      {/* destaque: sequência e check-in */}
      <section className="rounded-3xl bg-gradient-to-br from-marca-700 to-marca-900 p-5 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15"><Flame size={26} className="text-amber-300" /></span>
            <div>
              <p className="text-3xl font-bold leading-none">{seq} <span className="text-base font-medium">{seq === 1 ? "semana" : "semanas"}</span></p>
              <p className="mt-1 text-sm text-white/70">seguidas treinando 2x ou mais</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold leading-none">{noMes}</p>
            <p className="mt-1 text-xs text-white/70">treinos no mês</p>
          </div>
        </div>
        <button onClick={() => checkin()} disabled={fezCheckin}
          className={`mt-5 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-base font-semibold transition ${fezCheckin ? "bg-white/15 text-white/80" : "bg-white text-marca-800 hover:bg-marca-50"}`}>
          {fezCheckin ? <><Check size={20} /> Check-in feito hoje</> : <><MapPin size={20} /> Cheguei na academia</>}
        </button>
      </section>

      <div className="mt-5 hidden sm:block">
        <Abas<Aba> atual={aba} aoTrocar={setAba} abas={ABAS} />
      </div>

      <div className="mt-5 sm:mt-0" key={aba}>
        {aba === "treino" && (
          !treino ? (
            <Vazio icone={<Dumbbell size={28} />}>{personal ? `${personal.nome} está montando seu treino. Você recebe um aviso quando estiver pronto.` : "O professor do salão vai montar seu treino na sua primeira visita."}</Vazio>
          ) : (
            <div className="animar-entrada space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Treino de hoje</h2>
                {personal && <span className="text-xs text-zinc-500">por {personal.nome}</span>}
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {treino.divisoes.map((d, i) => (
                  <button key={d.nome} onClick={() => setDivisao(i)} aria-pressed={i === divisao}
                    className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${i === divisao ? "bg-marca-700 text-white shadow-sm" : "bg-white text-zinc-600 ring-1 ring-zinc-200"}`}>
                    {d.nome}{i === sugerida && divisaoEscolhida === null ? " · sugerido" : ""}
                  </button>
                ))}
              </div>
              {pedirFeedback && (
                <section className="animar-entrada rounded-2xl border border-marca-200 bg-marca-50 p-4" aria-label="Avaliar treino">
                  <p className="font-semibold text-marca-900">Como foi o treino de hoje?</p>
                  <p className="text-sm text-marca-800/80">{personal ? `${personal.nome.split(" ")[0]} usa sua resposta para ajustar o treino.` : "Sua resposta ajuda a equipe a ajustar o treino."}</p>
                  <div className="mt-3 grid grid-cols-5 gap-1.5">
                    {SENSACOES.map((s) => (
                      <button key={s.valor} onClick={() => setSensacao(s.valor)} aria-pressed={sensacao === s.valor}
                        className={`flex flex-col items-center gap-1 rounded-xl py-2 text-xs transition ${sensacao === s.valor ? "bg-white font-semibold text-marca-900 shadow-sm ring-2 ring-marca-500" : "text-marca-900/70 hover:bg-white/60"}`}>
                        <span className="text-2xl leading-none">{s.emoji}</span>{s.rotulo}
                      </button>
                    ))}
                  </div>
                  {sensacao && (
                    <div className="mt-3 space-y-2">
                      <input value={comentario} onChange={(e) => setComentario(e.target.value)} placeholder={sensacao <= 2 ? "O que não foi legal? (opcional)" : "Quer comentar algo? (opcional)"}
                        aria-label="Comentário sobre o treino" className="w-full rounded-xl border border-marca-200 bg-white px-3 py-2.5 text-base focus:border-marca-500 focus:outline-none sm:text-sm" />
                      <button onClick={enviarFeedback} className="w-full rounded-xl bg-marca-700 py-2.5 text-sm font-semibold text-white hover:bg-marca-800">Enviar</button>
                    </div>
                  )}
                </section>
              )}
              {feedbackHoje && (
                <p className="rounded-2xl bg-white p-3 text-sm text-zinc-600 ring-1 ring-zinc-200">
                  <span className="mr-1 text-lg">{emojiSensacao(feedbackHoje.sensacao)}</span> Você avaliou o treino de hoje. Obrigado!
                </p>
              )}
              <Cartao>
                <BarraProgresso valor={qtdFeitos} total={div?.exercicios.length ?? 0} rotulo="Exercícios feitos" />
                <ul className="mt-3 divide-y divide-zinc-100">
                  {div?.exercicios.map((e) => {
                    const feito = !!feitos[chave(e.exercicio)];
                    const ultima = db.registrosCarga.filter((r) => r.alunoId === aluno.id && r.exercicio === e.exercicio).sort((a, b) => b.data.localeCompare(a.data))[0];
                    return (
                      <li key={e.exercicio} className="py-3">
                        <div className="flex items-start gap-3">
                          <button onClick={() => alternarFeito(e.exercicio)} aria-pressed={feito} aria-label={`Marcar ${e.exercicio} como feito`}
                            className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition ${feito ? "border-marca-600 bg-marca-600 text-white" : "border-zinc-300 hover:border-marca-500"}`}>
                            {feito && <Check size={16} />}
                          </button>
                          <div className="min-w-0 flex-1">
                            <p className={`font-medium ${feito ? "text-zinc-400 line-through" : "text-zinc-900"}`}>{e.exercicio}</p>
                            <p className="text-sm text-zinc-500">
                              {e.series} séries × {e.repeticoes}
                              {(ultima?.cargaKg ?? e.cargaKg) != null && <> · <strong className="text-zinc-700">{ultima?.cargaKg ?? e.cargaKg} kg</strong></>}
                            </p>
                            {e.cargaKg != null && !feito && (
                              <div className="mt-2 flex items-center gap-2">
                                <input inputMode="decimal" aria-label={`Nova carga em ${e.exercicio}`} placeholder="Nova carga" value={cargas[e.exercicio] ?? ""}
                                  onChange={(ev) => setCargas({ ...cargas, [e.exercicio]: ev.target.value })}
                                  className="w-28 rounded-lg border border-zinc-300 px-2.5 py-1.5 text-base focus:border-marca-500 focus:outline-none sm:text-sm" />
                                <span className="text-sm text-zinc-400">kg</span>
                                {cargas[e.exercicio] && <button onClick={() => registrar(e.exercicio)} className="rounded-lg bg-marca-50 px-3 py-1.5 text-sm font-medium text-marca-800">Salvar</button>}
                              </div>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </Cartao>
            </div>
          )
        )}

        {aba === "dieta" && (
          <div className="animar-entrada space-y-3">
            {!nutri ? (
              <Vazio icone={<Apple size={28} />}>Seu plano não inclui nutricionista. Fale com a recepção para conhecer o plano Completo.</Vazio>
            ) : !plano ? (
              <Vazio icone={<Apple size={28} />}>{nutri.nome} vai montar seu plano alimentar depois da primeira consulta.</Vazio>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Meu plano alimentar</h2>
                  <Etiqueta cor="verde">{plano.metaKcal} kcal/dia</Etiqueta>
                </div>
                <ol className="relative space-y-3 border-l-2 border-zinc-200 pl-5">
                  {plano.refeicoes.map((r, i) => {
                    const proxima = i === proximaRefeicao;
                    return (
                      <li key={i} className="relative">
                        <span className={`absolute -left-[27px] top-4 h-3 w-3 rounded-full ring-4 ring-zinc-50 ${proxima ? "bg-marca-500" : "bg-zinc-300"}`} />
                        <div className={`rounded-2xl border bg-white p-4 shadow-sm ${proxima ? "border-marca-300 ring-2 ring-marca-100" : "border-zinc-200/80"}`}>
                          <div className="flex items-center justify-between">
                            <p className="font-medium">{r.nome}</p>
                            <span className="text-sm text-zinc-500">{r.horario}{proxima && <span className="ml-2 font-medium text-marca-700">· próxima</span>}</span>
                          </div>
                          <p className="mt-1 text-sm text-zinc-600">{r.itens}</p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
                {plano.orientacoes && <Cartao><p className="text-sm text-zinc-600"><strong className="text-zinc-800">Dica da {nutri.nome.split(" ")[0]}:</strong> {plano.orientacoes}</p></Cartao>}
              </>
            )}
            {retorno && nutri && (
              <div className="flex items-center gap-3 rounded-2xl bg-sky-50 p-4 text-sm text-sky-900">
                <CalendarDays size={20} /> Próxima consulta com {nutri.nome.split(" ")[0]}: <strong>{formatarData(retorno)}</strong>
              </div>
            )}
          </div>
        )}

        {aba === "evolucao" && (
          <div className="animar-entrada space-y-3">
            <Cartao titulo="Meu peso"><GraficoLinha pontos={pesos} unidade="kg" menorEhMelhor={aluno.objetivo === "emagrecimento"} /></Cartao>
            <EvolucaoCargas db={db} alunoId={aluno.id} />
          </div>
        )}

        {aba === "conta" && (
          <div className="animar-entrada space-y-3">
            <Cartao titulo="Mensalidades">
              <ul className="divide-y divide-zinc-100 text-sm">
                {db.cobrancas.filter((c) => c.alunoId === aluno.id).sort((a, b) => b.vencimento.localeCompare(a.vencimento)).slice(0, 6).map((c) => {
                  const s = statusCobranca(c);
                  return (
                    <li key={c.id} className="flex items-center justify-between py-3">
                      <span><span className="font-medium">{formatarDinheiro(c.valorCentavos)}</span><span className="block text-xs text-zinc-500">vence {formatarData(c.vencimento)}</span></span>
                      {s === "pago" ? <Etiqueta cor="verde">Pago</Etiqueta> : s === "atrasado" ? <Etiqueta cor="vermelho">Atrasado</Etiqueta> : <Etiqueta>A vencer</Etiqueta>}
                    </li>
                  );
                })}
              </ul>
            </Cartao>
            <Cartao titulo="Minha equipe">
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between"><span className="text-zinc-500">Personal</span><span>{personal?.nome ?? "Professor do salão"}</span></li>
                <li className="flex justify-between"><span className="text-zinc-500">Nutricionista</span><span>{nutri?.nome ?? "—"}</span></li>
              </ul>
            </Cartao>
          </div>
        )}
      </div>

      {/* barra de navegação inferior (celular) */}
      <nav aria-label="Seções do app" className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden">
        <ul className="mx-auto grid max-w-lg grid-cols-4">
          {ABAS.map((a) => (
            <li key={a.id}>
              <button onClick={() => { setAba(a.id); window.scrollTo({ top: 0, behavior: "smooth" }); }} aria-current={aba === a.id ? "page" : undefined}
                className={`flex w-full flex-col items-center gap-0.5 py-2.5 text-xs font-medium ${aba === a.id ? "text-marca-700" : "text-zinc-400"}`}>
                <a.icone size={22} strokeWidth={aba === a.id ? 2.4 : 1.8} />
                {a.rotulo}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </main>
  );
}
