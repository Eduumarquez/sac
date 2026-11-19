"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { BellRing, Copy, MessageCircle, Send, X } from "lucide-react";
import { linkWhats } from "@/lib/mascaras";
import { alterar } from "@/lib/db";
import type { BancoDados, Cobranca } from "@/lib/tipos";
import { ETAPAS_REGUA, lembretesDeHoje, mensagemCobranca } from "@/lib/regras";
import { formatarData, formatarDinheiro, isoAgora, novoId } from "@/lib/datas";
import { Avatar, Botao, Cartao, Etiqueta, avisar } from "./ui";

/** Desenha um QR code a partir de um texto. */
export function QR({ texto, tamanho = 200, rotulo }: { texto: string; tamanho?: number; rotulo: string }) {
  const [svg, setSvg] = useState("");
  useEffect(() => {
    let vivo = true;
    QRCode.toString(texto, { type: "svg", margin: 1, color: { dark: "#18181b", light: "#ffffff" } }).then((s) => vivo && setSvg(s));
    return () => { vivo = false; };
  }, [texto]);
  return <div role="img" aria-label={rotulo} style={{ width: tamanho, height: tamanho }} className="mx-auto rounded-xl bg-white p-2" dangerouslySetInnerHTML={{ __html: svg }} />;
}

export function Modal({ titulo, aoFechar, children }: { titulo: string; aoFechar: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-900/40 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={titulo} onClick={aoFechar}>
      <div className="animar-entrada max-h-[92vh] w-full max-w-sm overflow-y-auto rounded-t-3xl bg-white p-5 shadow-xl sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{titulo}</h2>
          <button onClick={aoFechar} aria-label="Fechar" className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100"><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

/**
 * Pagamento por Pix no app do aluno. Na demonstração o código é fictício; com o Asaas
 * ligado, o QR vem da cobrança real e a baixa chega sozinha pelo webhook.
 */
export function PagarPix({ cobranca, aoFechar }: { cobranca: Cobranca; aoFechar: () => void }) {
  const codigo = `SAC-DEMONSTRACAO-PIX-${cobranca.id.slice(0, 8).toUpperCase()}-${cobranca.valorCentavos}`;
  const copiar = async () => {
    try { await navigator.clipboard.writeText(codigo); avisar("Código copiado"); } catch { avisar("Não foi possível copiar"); }
  };
  const pagar = () => {
    alterar((d) => ({ ...d, cobrancas: d.cobrancas.map((c) => (c.id === cobranca.id ? { ...c, status: "pago", pagoEm: isoAgora(), metodo: "pix" } : c)) }));
    avisar("Pagamento confirmado. Obrigado!");
    aoFechar();
  };
  return (
    <Modal titulo="Pagar com Pix" aoFechar={aoFechar}>
      <p className="text-center text-3xl font-bold">{formatarDinheiro(cobranca.valorCentavos)}</p>
      <p className="mb-3 text-center text-sm text-zinc-500">Mensalidade com vencimento em {formatarData(cobranca.vencimento)}</p>
      <QR texto={codigo} rotulo="QR code do Pix" />
      <button onClick={copiar} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-300 py-2.5 text-sm font-medium hover:bg-zinc-50"><Copy size={16} /> Copiar código Pix</button>
      <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">Demonstração: este código não é um Pix real. Com o Asaas ligado, o pagamento é confirmado sozinho em segundos.</p>
      <Botao className="mt-3 w-full" onClick={pagar}>Simular pagamento</Botao>
    </Modal>
  );
}

/** Régua de cobrança: lembretes automáticos antes e depois do vencimento. */
export function ReguaCobranca({ db }: { db: BancoDados }) {
  const hoje = lembretesDeHoje(db);
  const enviados = db.lembretes.filter((l) => l.data.slice(0, 10) === isoAgora().slice(0, 10)).length;
  const registrar = (itens: typeof hoje) => {
    alterar((d) => ({ ...d, lembretes: [...d.lembretes, ...itens.map((i) => ({ id: novoId(), cobrancaId: i.cobranca.id, etapa: i.etapa, data: isoAgora() }))] }));
  };
  return (
    <Cartao titulo="Régua de cobrança automática" icone={<BellRing size={18} />}
      acao={hoje.length > 1 && <Botao tamanho="sm" icone={<Send size={14} />} onClick={() => { registrar(hoje); avisar(`${hoje.length} lembretes enviados`); }}>Enviar todos</Botao>}>
      <ol className="mb-4 flex flex-wrap gap-1.5 text-xs">
        {ETAPAS_REGUA.map((e, i) => <li key={e.id}><Etiqueta cor="azul">{i + 1}. {e.rotulo}</Etiqueta></li>)}
      </ol>
      {!hoje.length ? (
        <p className="text-sm text-zinc-500">Nenhum lembrete para hoje{enviados ? ` (${enviados} já enviados)` : ""}.</p>
      ) : (
        <ul className="divide-y divide-zinc-100">
          {hoje.map(({ cobranca, etapa }) => {
            const aluno = db.alunos.find((a) => a.id === cobranca.alunoId)!;
            const texto = mensagemCobranca(aluno.nome, cobranca, etapa);
            return (
              <li key={cobranca.id + etapa} className="flex flex-wrap items-center gap-3 py-3">
                <Avatar nome={aluno.nome} tamanho="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{aluno.nome} <span className="font-normal text-zinc-400">· {ETAPAS_REGUA.find((e) => e.id === etapa)?.rotulo}</span></p>
                  <p className="truncate text-sm text-zinc-500">{texto}</p>
                </div>
                <a href={linkWhats(aluno.telefone, texto)} target="_blank" rel="noreferrer" onClick={() => registrar([{ cobranca, etapa }])}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50">
                  <MessageCircle size={16} className="text-[#25D366]" /> Enviar
                </a>
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-3 text-xs text-zinc-400">Com a API oficial do WhatsApp ligada, estes lembretes saem sozinhos todo dia às 9h. Na demonstração, você envia com um toque.</p>
    </Cartao>
  );
}
