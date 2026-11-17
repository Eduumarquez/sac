"use client";

import { useState } from "react";
import { Minus, Package, Plus, ShoppingBag, Store, Ticket } from "lucide-react";
import { alterar } from "@/lib/db";
import type { BancoDados, CategoriaProduto } from "@/lib/tipos";
import { comprar, resumoLoja, saldoSessoes } from "@/lib/regras";
import { formatarData, formatarDinheiro, isoAgora } from "@/lib/datas";
import { Avatar, Botao, Cartao, Etiqueta, Indicador, Vazio, avisar } from "./ui";
import { Modal, QR } from "./cobranca";

const CATS: { id: CategoriaProduto | "tudo"; rotulo: string }[] = [
  { id: "tudo", rotulo: "Tudo" },
  { id: "suplemento", rotulo: "Suplementos" },
  { id: "acessorio", rotulo: "Acessórios" },
  { id: "pacote", rotulo: "Pacotes" },
  { id: "servico", rotulo: "Serviços" },
];
const fisico = (c: CategoriaProduto) => c === "suplemento" || c === "acessorio";

/** Pacotes e serviços comprados pelo aluno, com saldo de sessões. */
export function MeusPacotes({ db, alunoId }: { db: BancoDados; alunoId: string }) {
  const meus = db.creditos.filter((c) => c.alunoId === alunoId);
  if (!meus.length) return null;
  return (
    <Cartao titulo="Meus pacotes" icone={<Ticket size={18} />}>
      <ul className="space-y-3">
        {meus.map((c) => {
          const p = db.produtos.find((x) => x.id === c.produtoId);
          const prof = db.profissionais.find((x) => x.id === c.profissionalId);
          const saldo = saldoSessoes(c);
          return (
            <li key={c.id}>
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-medium">{p?.nome}</span>
                <span className={saldo ? "font-semibold text-marca-700" : "text-zinc-400"}>{saldo} de {c.sessoesTotal} {c.sessoesTotal === 1 ? "sessão" : "sessões"}</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-zinc-100"><div className="h-full rounded-full bg-marca-500" style={{ width: `${(saldo / c.sessoesTotal) * 100}%` }} /></div>
              <p className="mt-1 text-xs text-zinc-500">{prof ? `Com ${prof.nome}` : "A recepção indica o profissional"} · comprado em {formatarData(c.compradoEm)}</p>
            </li>
          );
        })}
      </ul>
    </Cartao>
  );
}

/** Loja dentro do app do aluno: suplementos, acessórios, pacotes e serviços avulsos. */
export function LojaAluno({ db, alunoId }: { db: BancoDados; alunoId: string }) {
  const [cat, setCat] = useState<CategoriaProduto | "tudo">("tudo");
  const [carrinho, setCarrinho] = useState<Record<string, number>>({});
  const [checkout, setCheckout] = useState(false);
  const aluno = db.alunos.find((a) => a.id === alunoId)!;
  const personal = db.profissionais.find((p) => p.id === aluno.personalId);
  const produtos = db.produtos.filter((p) => p.ativo && (cat === "tudo" || p.categoria === cat));
  const itens = Object.entries(carrinho).filter(([, q]) => q > 0);
  const total = itens.reduce((s, [id, q]) => s + q * (db.produtos.find((p) => p.id === id)?.precoCentavos ?? 0), 0);
  const qtd = itens.reduce((s, [, q]) => s + q, 0);
  const mudar = (id: string, d: number) => {
    const p = db.produtos.find((x) => x.id === id)!;
    const novo = Math.max(0, (carrinho[id] ?? 0) + d);
    if (p.estoque != null && novo > p.estoque) return avisar(`Só temos ${p.estoque} em estoque`);
    setCarrinho({ ...carrinho, [id]: novo });
  };
  function pagar() {
    try {
      alterar((d) => comprar(d, alunoId, itens.map(([produtoId, q]) => ({ produtoId, qtd: q })), "app"));
      const temFisico = itens.some(([id]) => fisico(db.produtos.find((p) => p.id === id)!.categoria));
      const temPacote = itens.some(([id]) => !fisico(db.produtos.find((p) => p.id === id)!.categoria));
      avisar(temFisico ? "Pedido pago! Retire na recepção." : temPacote ? "Pacote liberado! A equipe vai te chamar para agendar." : "Pedido pago!");
      setCarrinho({});
      setCheckout(false);
    } catch (e) {
      avisar((e as Error).message);
    }
  }

  return (
    <div className="space-y-3">
      <MeusPacotes db={db} alunoId={alunoId} />
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {CATS.map((c) => (
          <button key={c.id} onClick={() => setCat(c.id)} aria-pressed={cat === c.id}
            className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium ${cat === c.id ? "bg-zinc-900 text-white" : "bg-white text-zinc-600 ring-1 ring-zinc-200"}`}>{c.rotulo}</button>
        ))}
      </div>
      <ul className="grid grid-cols-2 gap-2.5">
        {produtos.map((p) => {
          const n = carrinho[p.id] ?? 0;
          const esgotado = p.estoque === 0;
          return (
            <li key={p.id} className={`flex flex-col rounded-2xl bg-white p-3 shadow-sm ring-1 ${n ? "ring-marca-300" : "ring-zinc-200/80"}`}>
              <span className="text-3xl" aria-hidden>{p.emoji}</span>
              <p className="mt-1.5 text-sm font-semibold leading-tight">{p.nome}</p>
              <p className="mt-1 line-clamp-2 text-xs text-zinc-500">{p.papel === "personal" && personal ? `Com ${personal.nome.split(" ")[0]}. ` : ""}{p.descricao}</p>
              <div className="mt-auto pt-2">
                <p className="font-bold">{formatarDinheiro(p.precoCentavos)}</p>
                {p.estoque != null && p.estoque <= 3 && !esgotado && <p className="text-xs text-amber-700">Últimas {p.estoque} unidades</p>}
                {esgotado ? <p className="mt-1.5 text-xs text-zinc-400">Esgotado</p> : n === 0 ? (
                  <button onClick={() => mudar(p.id, 1)} className="mt-1.5 w-full rounded-xl bg-marca-700 py-2 text-sm font-semibold text-white">Adicionar</button>
                ) : (
                  <div className="mt-1.5 flex items-center justify-between rounded-xl bg-marca-50">
                    <button onClick={() => mudar(p.id, -1)} aria-label={`Tirar ${p.nome}`} className="p-2 text-marca-800"><Minus size={16} /></button>
                    <span className="text-sm font-semibold text-marca-900">{n}</span>
                    <button onClick={() => mudar(p.id, 1)} aria-label={`Mais ${p.nome}`} className="p-2 text-marca-800"><Plus size={16} /></button>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {qtd > 0 && (
        <button onClick={() => setCheckout(true)} className="fixed inset-x-3 bottom-20 z-30 mx-auto flex max-w-md items-center justify-between rounded-2xl bg-zinc-900 px-4 py-3.5 text-white shadow-2xl sm:bottom-6">
          <span className="flex items-center gap-2 font-medium"><ShoppingBag size={18} /> Ver carrinho ({qtd})</span>
          <span className="font-bold">{formatarDinheiro(total)}</span>
        </button>
      )}

      {checkout && (
        <Modal titulo="Seu pedido" aoFechar={() => setCheckout(false)}>
          <ul className="mb-3 divide-y divide-zinc-100 text-sm">
            {itens.map(([id, q]) => {
              const p = db.produtos.find((x) => x.id === id)!;
              return <li key={id} className="flex justify-between py-2"><span>{q}× {p.nome}</span><span className="font-medium">{formatarDinheiro(q * p.precoCentavos)}</span></li>;
            })}
            <li className="flex justify-between py-2 text-base font-bold"><span>Total</span><span>{formatarDinheiro(total)}</span></li>
          </ul>
          <QR texto={`SAC-DEMONSTRACAO-PIX-LOJA-${total}`} tamanho={160} rotulo="QR code do Pix" />
          <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">Demonstração: este Pix não é real. Com o Asaas ligado, o pagamento confirma sozinho.</p>
          <Botao className="mt-3 w-full" onClick={pagar}>Simular pagamento</Botao>
        </Modal>
      )}
    </div>
  );
}

/** Painel da academia: vendas, comissões, pedidos para entregar e estoque. */
export function PainelLoja({ db }: { db: BancoDados }) {
  const desde = new Date(Date.now() - 30 * 86_400_000);
  const r = resumoLoja(db, desde);
  const aEntregar = db.vendas.filter((v) => v.status === "pago" && v.itens.some((l) => fisico(db.produtos.find((p) => p.id === l.produtoId)?.categoria ?? "servico")));
  const pacotesAtivos = db.creditos.filter((c) => saldoSessoes(c) > 0);
  const entregar = (id: string) => { alterar((d) => ({ ...d, vendas: d.vendas.map((v) => (v.id === id ? { ...v, status: "retirado" } : v)) })); avisar("Pedido entregue"); };
  const repor = (id: string) => { alterar((d) => ({ ...d, produtos: d.produtos.map((p) => (p.id === id && p.estoque != null ? { ...p, estoque: p.estoque + 10 } : p)) })); avisar("Estoque reposto: +10"); };
  const usarSessao = (id: string) => { alterar((d) => ({ ...d, creditos: d.creditos.map((c) => (c.id === id ? { ...c, usos: [...c.usos, isoAgora()] } : c)) })); avisar("Sessão registrada"); };
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Indicador rotulo="Vendas em 30 dias" valor={formatarDinheiro(r.total)} detalhe={`${r.vendas} pedidos`} icone={<Store size={18} />} />
        <Indicador rotulo="Fica com a academia" valor={formatarDinheiro(r.academia)} detalhe="produtos + parte dos pacotes" icone={<Store size={18} />} />
        <Indicador rotulo="Repasse a profissionais" valor={formatarDinheiro(r.comissaoProfissionais)} detalhe="pacotes e serviços" icone={<Ticket size={18} />} />
        <Indicador rotulo="Pacotes com saldo" valor={pacotesAtivos.length} detalhe={`${pacotesAtivos.reduce((s, c) => s + saldoSessoes(c), 0)} sessões a usar`} icone={<Package size={18} />} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Cartao titulo={`Pedidos para entregar · ${aEntregar.length}`} icone={<ShoppingBag size={18} />}>
          {!aEntregar.length ? <p className="text-sm text-zinc-500">Nenhum pedido esperando retirada.</p> : (
            <ul className="divide-y divide-zinc-100">
              {aEntregar.map((v) => {
                const a = db.alunos.find((x) => x.id === v.alunoId);
                return (
                  <li key={v.id} className="flex items-center gap-3 py-2.5">
                    <Avatar nome={a?.nome ?? "?"} tamanho="sm" />
                    <span className="min-w-0 flex-1 text-sm"><span className="font-medium">{a?.nome}</span>
                      <span className="block truncate text-zinc-500">{v.itens.map((l) => `${l.qtd}× ${db.produtos.find((p) => p.id === l.produtoId)?.nome}`).join(", ")}</span></span>
                    <Botao tamanho="sm" variante="secundario" onClick={() => entregar(v.id)}>Entregue</Botao>
                  </li>
                );
              })}
            </ul>
          )}
        </Cartao>

        <Cartao titulo="Pacotes e sessões" icone={<Ticket size={18} />}>
          {!pacotesAtivos.length ? <p className="text-sm text-zinc-500">Nenhum pacote com saldo.</p> : (
            <ul className="divide-y divide-zinc-100">
              {pacotesAtivos.map((c) => {
                const a = db.alunos.find((x) => x.id === c.alunoId);
                const p = db.produtos.find((x) => x.id === c.produtoId);
                const prof = db.profissionais.find((x) => x.id === c.profissionalId);
                return (
                  <li key={c.id} className="flex items-center gap-3 py-2.5 text-sm">
                    <span className="min-w-0 flex-1"><span className="font-medium">{a?.nome}</span>
                      <span className="block text-zinc-500">{p?.nome}{prof ? ` · ${prof.nome}` : ""} · {saldoSessoes(c)} de {c.sessoesTotal}</span></span>
                    <Botao tamanho="sm" variante="secundario" onClick={() => usarSessao(c.id)}>Usar sessão</Botao>
                  </li>
                );
              })}
            </ul>
          )}
        </Cartao>
      </div>

      <Cartao titulo="Estoque" icone={<Package size={18} />}>
        <ul className="divide-y divide-zinc-100">
          {db.produtos.filter((p) => p.estoque != null).sort((a, b) => (a.estoque ?? 0) - (b.estoque ?? 0)).map((p) => (
            <li key={p.id} className="flex items-center gap-3 py-2.5 text-sm">
              <span className="text-xl" aria-hidden>{p.emoji}</span>
              <span className="min-w-0 flex-1"><span className="font-medium">{p.nome}</span><span className="block text-zinc-500">{formatarDinheiro(p.precoCentavos)}</span></span>
              {(p.estoque ?? 0) <= 3 ? <Etiqueta cor="vermelho">{p.estoque} em estoque</Etiqueta> : <Etiqueta>{p.estoque} em estoque</Etiqueta>}
              <button onClick={() => repor(p.id)} className="rounded-lg px-2 py-1 text-xs font-medium text-marca-700 hover:bg-marca-50">Repor</button>
            </li>
          ))}
        </ul>
      </Cartao>
      {!db.produtos.length && <Vazio>Cadastre produtos para começar a vender.</Vazio>}
    </div>
  );
}

/** Para o profissional: saldo de sessões do aluno e registro de uso. */
export function SessoesDoAluno({ db, alunoId, papel }: { db: BancoDados; alunoId: string; papel: "personal" | "nutricionista" | "fisioterapeuta" }) {
  const lista = db.creditos.filter((c) => c.alunoId === alunoId && db.produtos.find((p) => p.id === c.produtoId)?.papel === papel);
  if (!lista.length) return null;
  const usar = (id: string) => { alterar((d) => ({ ...d, creditos: d.creditos.map((c) => (c.id === id ? { ...c, usos: [...c.usos, isoAgora()] } : c)) })); avisar("Sessão registrada"); };
  return (
    <Cartao titulo="Pacotes comprados" icone={<Ticket size={18} />}>
      <ul className="space-y-2">
        {lista.map((c) => {
          const p = db.produtos.find((x) => x.id === c.produtoId);
          const saldo = saldoSessoes(c);
          return (
            <li key={c.id} className="flex items-center gap-3 text-sm">
              <span className="min-w-0 flex-1"><span className="font-medium">{p?.nome}</span><span className="block text-zinc-500">{saldo} de {c.sessoesTotal} sessões restantes{c.usos.length ? ` · última em ${formatarData(c.usos.at(-1)!)}` : ""}</span></span>
              <Botao tamanho="sm" variante="secundario" disabled={!saldo} onClick={() => usar(c.id)}>Registrar sessão</Botao>
            </li>
          );
        })}
      </ul>
    </Cartao>
  );
}
