"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { alterar, useBanco } from "@/lib/db";
import { mensagemSugerida } from "@/lib/risco";
import { riscoDoAluno, statusCobranca } from "@/lib/regras";
import { dataISO, diasEntre, formatarData, formatarDinheiro, isoAgora, novoId } from "@/lib/datas";
import { Abas, Botao, Cartao, Carregando, Etiqueta, EtiquetaRisco, Indicador, Vazio, estiloInput } from "@/components/ui";

type Aba = "dia" | "alunos" | "financeiro";

export default function Painel() {
  const db = useBanco();
  const [aba, setAba] = useState<Aba>("dia");
  const [busca, setBusca] = useState("");

  const dados = useMemo(() => {
    if (!db) return null;
    const hoje = new Date();
    const ativos = db.alunos.filter((a) => a.status === "ativo");
    const comRisco = ativos
      .map((a) => ({ aluno: a, risco: riscoDoAluno(db, a.id, hoje) }))
      .sort((x, y) => y.risco.pontuacao - x.risco.pontuacao);
    const cobr = db.cobrancas.map((c) => ({ ...c, status: statusCobranca(c, hoje) }));
    const mesAtual = dataISO(hoje).slice(0, 7);
    const recebidoMes = cobr.filter((c) => c.status === "pago" && c.pagoEm?.slice(0, 7) === mesAtual).reduce((s, c) => s + c.valorCentavos, 0);
    const atrasado = cobr.filter((c) => c.status === "atrasado");
    const checkinsHoje = db.checkins.filter((c) => c.data.slice(0, 10) === hoje.toISOString().slice(0, 10)).length;
    const novos30 = ativos.filter((a) => diasEntre(new Date(a.matriculadoEm), hoje) <= 30).length;
    const contatadosHoje = new Set(db.contatos.filter((c) => c.data.slice(0, 10) === hoje.toISOString().slice(0, 10)).map((c) => c.alunoId));
    return { hoje, ativos, comRisco, cobr, recebidoMes, atrasado, checkinsHoje, novos30, contatadosHoje };
  }, [db]);

  if (!db || !dados) return <Carregando />;
  const nome = (id?: string) => db.profissionais.find((p) => p.id === id)?.nome ?? "—";
  const plano = (id: string) => db.planos.find((p) => p.id === id)?.nome ?? "—";
  const emRisco = dados.comRisco.filter((l) => l.risco.nivel !== "baixo");

  function registrarContato(alunoId: string) {
    alterar((d) => ({ ...d, contatos: [...d.contatos, { id: novoId(), alunoId, data: isoAgora(), responsavelId: "p-dono", resultado: "contatado" }] }));
  }
  function marcarPago(id: string) {
    alterar((d) => ({ ...d, cobrancas: d.cobrancas.map((c) => (c.id === id ? { ...c, status: "pago", pagoEm: isoAgora(), metodo: "pix" } : c)) }));
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold">{db.academia.nome}</h1>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Indicador rotulo="Alunos ativos" valor={dados.ativos.length} detalhe={`${dados.novos30} novos nos últimos 30 dias`} />
        <Indicador rotulo="Em risco de cancelar" valor={emRisco.length} detalhe={`${emRisco.filter((e) => e.risco.nivel === "alto").length} com risco alto`} />
        <Indicador rotulo="Recebido no mês" valor={formatarDinheiro(dados.recebidoMes)} />
        <Indicador rotulo="Em atraso" valor={formatarDinheiro(dados.atrasado.reduce((s, c) => s + c.valorCentavos, 0))} detalhe={`${dados.atrasado.length} cobranças`} />
      </div>

      <div className="mt-6">
        <Abas<Aba> atual={aba} aoTrocar={setAba} abas={[{ id: "dia", rotulo: "Lista do dia" }, { id: "alunos", rotulo: "Alunos" }, { id: "financeiro", rotulo: "Financeiro" }]} />

        {aba === "dia" && (
          <div className="space-y-3">
            <p className="text-sm text-zinc-600">{emRisco.length ? `${emRisco.length} alunos precisam de contato hoje, do maior para o menor risco.` : "Ninguém em risco hoje. 🎉"}</p>
            {emRisco.map(({ aluno, risco }) => {
              const texto = mensagemSugerida(aluno.nome.split(" ")[0], risco);
              const contatado = dados.contatadosHoje.has(aluno.id);
              return (
                <Cartao key={aluno.id}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link href={`/painel/aluno/?id=${aluno.id}`} className="font-semibold hover:underline">{aluno.nome}</Link>
                    <EtiquetaRisco nivel={risco.nivel} pontuacao={risco.pontuacao} />
                  </div>
                  <p className="mt-1 text-sm text-zinc-600">{risco.motivos.join(" · ")}</p>
                  <p className="mt-1 text-xs text-zinc-500">Personal: {nome(aluno.personalId)} · Plano {plano(aluno.planoId)}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <a href={`https://wa.me/${aluno.telefone}?text=${encodeURIComponent(texto)}`} target="_blank" rel="noreferrer" onClick={() => !contatado && registrarContato(aluno.id)} className="rounded-lg bg-teal-700 px-3 py-2 text-sm font-medium text-white hover:bg-teal-800">
                      Chamar no WhatsApp
                    </a>
                    {contatado ? <Etiqueta cor="verde">Contatado hoje</Etiqueta> : <Botao variante="secundario" onClick={() => registrarContato(aluno.id)}>Marcar como contatado</Botao>}
                  </div>
                </Cartao>
              );
            })}
          </div>
        )}

        {aba === "alunos" && (
          <Cartao>
            <input className={`${estiloInput} mb-3`} placeholder="Buscar aluno" value={busca} onChange={(e) => setBusca(e.target.value)} />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-zinc-500">
                  <tr><th className="py-2">Aluno</th><th>Plano</th><th>Personal</th><th>Nutricionista</th><th>Desde</th><th>Risco</th></tr>
                </thead>
                <tbody>
                  {dados.comRisco
                    .filter(({ aluno }) => aluno.nome.toLowerCase().includes(busca.toLowerCase()))
                    .map(({ aluno, risco }) => (
                      <tr key={aluno.id} className="border-t border-zinc-100">
                        <td className="py-2"><Link href={`/painel/aluno/?id=${aluno.id}`} className="font-medium text-teal-800 hover:underline">{aluno.nome}</Link></td>
                        <td>{plano(aluno.planoId)}</td>
                        <td>{nome(aluno.personalId)}</td>
                        <td>{nome(aluno.nutricionistaId)}</td>
                        <td>{formatarData(aluno.matriculadoEm)}</td>
                        <td><EtiquetaRisco nivel={risco.nivel} pontuacao={risco.pontuacao} /></td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </Cartao>
        )}

        {aba === "financeiro" && (
          <Cartao titulo="Cobranças em aberto">
            {(() => {
              const abertas = dados.cobr.filter((c) => c.status !== "pago").sort((a, b) => a.vencimento.localeCompare(b.vencimento));
              if (!abertas.length) return <Vazio>Nenhuma cobrança em aberto.</Vazio>;
              return (
                <table className="w-full text-sm">
                  <thead className="text-left text-xs text-zinc-500"><tr><th className="py-2">Aluno</th><th>Vencimento</th><th>Valor</th><th>Situação</th><th></th></tr></thead>
                  <tbody>
                    {abertas.slice(0, 30).map((c) => (
                      <tr key={c.id} className="border-t border-zinc-100">
                        <td className="py-2">{db.alunos.find((a) => a.id === c.alunoId)?.nome}</td>
                        <td>{formatarData(c.vencimento)}</td>
                        <td>{formatarDinheiro(c.valorCentavos)}</td>
                        <td>{c.status === "atrasado" ? <Etiqueta cor="vermelho">atrasado</Etiqueta> : <Etiqueta>a vencer</Etiqueta>}</td>
                        <td className="text-right"><Botao variante="secundario" onClick={() => marcarPago(c.id)}>Marcar pago</Botao></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              );
            })()}
          </Cartao>
        )}
      </div>
    </main>
  );
}
