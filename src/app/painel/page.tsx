"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AlertTriangle, Check, ChevronRight, MessageCircle, Search, TrendingUp, Users, Wallet } from "lucide-react";
import { alterar, useBanco } from "@/lib/db";
import { mensagemSugerida } from "@/lib/risco";
import { riscoDoAluno, statusCobranca } from "@/lib/regras";
import { dataISO, diasEntre, formatarData, formatarDinheiro, isoAgora, novoId } from "@/lib/datas";
import { saudacao } from "@/lib/mascaras";
import { Abas, Avatar, BarraProgresso, Botao, CabecalhoPagina, Cartao, Carregando, Etiqueta, EtiquetaRisco, Indicador, Vazio, avisar, estiloInput } from "@/components/ui";

type Aba = "dia" | "alunos" | "financeiro";
type Filtro = "todos" | "risco" | "novos";

const linkWhats = (tel: string, texto: string) => `https://wa.me/${tel}?text=${encodeURIComponent(texto)}`;

export default function Painel() {
  const db = useBanco();
  const [aba, setAba] = useState<Aba>("dia");
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");

  const dados = useMemo(() => {
    if (!db) return null;
    const hoje = new Date();
    const hojeISO = hoje.toISOString().slice(0, 10);
    const ativos = db.alunos.filter((a) => a.status === "ativo");
    const comRisco = ativos.map((a) => ({ aluno: a, risco: riscoDoAluno(db, a.id, hoje) })).sort((x, y) => y.risco.pontuacao - x.risco.pontuacao);
    const cobr = db.cobrancas.map((c) => ({ ...c, status: statusCobranca(c, hoje) }));
    const mes = dataISO(hoje).slice(0, 7);
    const recebidoMes = cobr.filter((c) => c.status === "pago" && c.pagoEm?.slice(0, 7) === mes).reduce((s, c) => s + c.valorCentavos, 0);
    const atrasado = cobr.filter((c) => c.status === "atrasado");
    const contatados = new Set(db.contatos.filter((c) => c.data.slice(0, 10) === hojeISO).map((c) => c.alunoId));
    const treinaramHoje = new Set(db.checkins.filter((c) => c.data.slice(0, 10) === hojeISO).map((c) => c.alunoId)).size;
    const novos30 = ativos.filter((a) => diasEntre(new Date(a.matriculadoEm), hoje) <= 30).length;
    return { hoje, ativos, comRisco, cobr, recebidoMes, atrasado, contatados, treinaramHoje, novos30 };
  }, [db]);

  if (!db || !dados) return <Carregando />;
  const nomeProf = (id?: string) => db.profissionais.find((p) => p.id === id)?.nome;
  const emRisco = dados.comRisco.filter((l) => l.risco.nivel !== "baixo");
  const pendentes = emRisco.filter((l) => !dados.contatados.has(l.aluno.id));
  const feitos = emRisco.filter((l) => dados.contatados.has(l.aluno.id));

  const registrarContato = (alunoId: string, nome: string) => {
    if (dados.contatados.has(alunoId)) return;
    alterar((d) => ({ ...d, contatos: [...d.contatos, { id: novoId(), alunoId, data: isoAgora(), responsavelId: "p-dono", resultado: "contatado" }] }));
    avisar(`Contato com ${nome.split(" ")[0]} registrado`);
  };
  const marcarPago = (id: string) => {
    alterar((d) => ({ ...d, cobrancas: d.cobrancas.map((c) => (c.id === id ? { ...c, status: "pago", pagoEm: isoAgora(), metodo: "pix" } : c)) }));
    avisar("Pagamento registrado");
  };

  const filtrados = dados.comRisco.filter(({ aluno, risco }) =>
    aluno.nome.toLowerCase().includes(busca.toLowerCase()) &&
    (filtro === "todos" || (filtro === "risco" ? risco.nivel !== "baixo" : diasEntre(new Date(aluno.matriculadoEm), dados.hoje) <= 30)));

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <CabecalhoPagina
        titulo={`${saudacao()}, Eduardo`}
        subtitulo={`${db.academia.nome} · ${dados.hoje.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}`}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Indicador rotulo="Alunos ativos" valor={dados.ativos.length} detalhe={`+${dados.novos30} nos últimos 30 dias`} icone={<Users size={18} />} />
        <Indicador rotulo="Precisam de contato" valor={pendentes.length} detalhe={`${feitos.length} já contatados hoje`} icone={<AlertTriangle size={18} />} destaque={pendentes.length ? "vermelho" : undefined} />
        <Indicador rotulo="Recebido no mês" valor={formatarDinheiro(dados.recebidoMes)} detalhe={`${dados.treinaramHoje} treinaram hoje`} icone={<TrendingUp size={18} />} />
        <Indicador rotulo="Em atraso" valor={formatarDinheiro(dados.atrasado.reduce((s, c) => s + c.valorCentavos, 0))} detalhe={`${dados.atrasado.length} cobrança(s)`} icone={<Wallet size={18} />} />
      </div>

      <div className="mt-8">
        <Abas<Aba> atual={aba} aoTrocar={setAba} abas={[
          { id: "dia", rotulo: "Lista do dia", contador: pendentes.length },
          { id: "alunos", rotulo: "Alunos" },
          { id: "financeiro", rotulo: "Financeiro", contador: dados.atrasado.length },
        ]} />

        {aba === "dia" && (
          <div className="space-y-4">
            {emRisco.length > 0 && (
              <Cartao>
                <p className="mb-3 text-sm text-zinc-600">
                  Estes alunos mostram sinais de que podem desistir. Uma mensagem hoje faz diferença.
                </p>
                <BarraProgresso valor={feitos.length} total={emRisco.length} rotulo="Contatos de hoje" />
              </Cartao>
            )}
            {!emRisco.length && <Vazio icone={<Check size={28} />}>Ninguém em risco hoje. Todos os alunos estão treinando bem.</Vazio>}
            {!pendentes.length && emRisco.length > 0 && <Vazio icone={<Check size={28} />}>Você falou com todos os alunos em risco hoje. Ótimo trabalho!</Vazio>}

            <ul className="space-y-3">
              {pendentes.map(({ aluno, risco }) => {
                const texto = mensagemSugerida(aluno.nome.split(" ")[0], risco);
                return (
                  <li key={aluno.id} className="animar-entrada rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <Avatar nome={aluno.nome} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link href={`/painel/aluno/?id=${aluno.id}`} className="font-semibold text-zinc-900 hover:underline">{aluno.nome}</Link>
                          <EtiquetaRisco nivel={risco.nivel} pontuacao={risco.pontuacao} />
                        </div>
                        <ul className="mt-2 flex flex-wrap gap-1.5">
                          {risco.motivos.map((m) => <li key={m}><Etiqueta>{m}</Etiqueta></li>)}
                        </ul>
                        <details className="mt-3 text-sm">
                          <summary className="cursor-pointer text-zinc-500">Mensagem sugerida</summary>
                          <p className="mt-2 rounded-xl bg-zinc-50 p-3 text-zinc-700">{texto}</p>
                        </details>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 sm:pl-[52px]">
                      <a href={linkWhats(aluno.telefone, texto)} target="_blank" rel="noreferrer" onClick={() => registrarContato(aluno.id, aluno.nome)}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#1ebe5b] sm:flex-none">
                        <MessageCircle size={18} /> Chamar no WhatsApp
                      </a>
                      <Botao variante="secundario" onClick={() => registrarContato(aluno.id, aluno.nome)} icone={<Check size={16} />}>Já falei</Botao>
                      {nomeProf(aluno.personalId) && <span className="self-center text-xs text-zinc-400">Personal: {nomeProf(aluno.personalId)}</span>}
                    </div>
                  </li>
                );
              })}
            </ul>

            {feitos.length > 0 && (
              <div>
                <p className="mb-2 mt-6 text-sm font-medium text-zinc-500">Já contatados hoje</p>
                <ul className="space-y-2">
                  {feitos.map(({ aluno }) => (
                    <li key={aluno.id} className="flex items-center gap-3 rounded-xl bg-white/60 p-3 text-sm text-zinc-500">
                      <Avatar nome={aluno.nome} tamanho="sm" /> {aluno.nome}
                      <Etiqueta cor="verde"><Check size={12} /> contatado</Etiqueta>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {aba === "alunos" && (
          <div className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input className={`${estiloInput} pl-10`} placeholder="Buscar aluno pelo nome" value={busca} onChange={(e) => setBusca(e.target.value)} />
              </div>
              <div className="flex gap-1 rounded-xl bg-zinc-100 p-1">
                {([["todos", "Todos"], ["risco", "Em risco"], ["novos", "Novatos"]] as const).map(([id, r]) => (
                  <button key={id} onClick={() => setFiltro(id)} className={`rounded-lg px-3 py-1.5 text-sm ${filtro === id ? "bg-white font-medium shadow-sm" : "text-zinc-500"}`}>{r}</button>
                ))}
              </div>
            </div>
            {!filtrados.length && <Vazio>Nenhum aluno encontrado.</Vazio>}
            <ul className="divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
              {filtrados.map(({ aluno, risco }) => (
                <li key={aluno.id}>
                  <Link href={`/painel/aluno/?id=${aluno.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50">
                    <Avatar nome={aluno.nome} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{aluno.nome}</p>
                      <p className="truncate text-sm text-zinc-500">
                        {db.planos.find((p) => p.id === aluno.planoId)?.nome}
                        {nomeProf(aluno.personalId) ? ` · ${nomeProf(aluno.personalId)}` : ""}
                        <span className="hidden sm:inline"> · desde {formatarData(aluno.matriculadoEm)}</span>
                      </p>
                    </div>
                    <EtiquetaRisco nivel={risco.nivel} pontuacao={risco.pontuacao} />
                    <ChevronRight size={18} className="text-zinc-300" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {aba === "financeiro" && (() => {
          const abertas = dados.cobr.filter((c) => c.status !== "pago").sort((a, b) => a.vencimento.localeCompare(b.vencimento));
          if (!abertas.length) return <Vazio icone={<Check size={28} />}>Nenhuma cobrança em aberto.</Vazio>;
          return (
            <ul className="divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
              {abertas.slice(0, 30).map((c) => {
                const aluno = db.alunos.find((a) => a.id === c.alunoId)!;
                return (
                  <li key={c.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <Avatar nome={aluno.nome} tamanho="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{aluno.nome}</p>
                      <p className="text-sm text-zinc-500">Vence {formatarData(c.vencimento)} · {formatarDinheiro(c.valorCentavos)}</p>
                    </div>
                    {c.status === "atrasado" ? <Etiqueta cor="vermelho">Atrasado</Etiqueta> : <Etiqueta>A vencer</Etiqueta>}
                    <div className="flex w-full gap-2 sm:w-auto">
                      {c.status === "atrasado" && (
                        <a href={linkWhats(aluno.telefone, `Oi ${aluno.nome.split(" ")[0]}! Sua mensalidade de ${formatarDinheiro(c.valorCentavos)} venceu em ${formatarData(c.vencimento)}. Posso te mandar o Pix?`)} target="_blank" rel="noreferrer"
                          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 sm:flex-none">
                          <MessageCircle size={16} /> Lembrar
                        </a>
                      )}
                      <Botao tamanho="sm" variante="secundario" className="flex-1 sm:flex-none" onClick={() => marcarPago(c.id)}>Marcar pago</Botao>
                    </div>
                  </li>
                );
              })}
            </ul>
          );
        })()}
      </div>
    </main>
  );
}
