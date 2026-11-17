"use client";

import { useState } from "react";
import { CheckCircle2, QrCode, ScanLine, ShieldX, UserPlus } from "lucide-react";
import { alterar, useBanco } from "@/lib/db";
import type { ViaCheckin } from "@/lib/tipos";
import { regraDeAcesso } from "@/lib/regras";
import { mascaraTelefone } from "@/lib/mascaras";
import { isoAgora, novoId } from "@/lib/datas";
import { Avatar, Botao, CabecalhoPagina, Campo, Cartao, Carregando, Etiqueta, avisar, estiloInput } from "@/components/ui";

type Resultado = { nome: string; liberado: boolean; motivo?: string; via: ViaCheckin; hora: string };
const VIA: Record<ViaCheckin, string> = { app: "App", qr: "QR code", wellhub: "Wellhub", totalpass: "Totalpass" };

export default function Recepcao() {
  const db = useBanco();
  const [codigo, setCodigo] = useState("");
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [app, setApp] = useState<"wellhub" | "totalpass">("wellhub");
  const [agregadoId, setAgregadoId] = useState("");
  const [novoNome, setNovoNome] = useState("");
  const [novoTel, setNovoTel] = useState("");
  if (!db) return <Carregando />;
  const hojeISO = isoAgora().slice(0, 10);

  function entrar(alunoId: string, via: ViaCheckin) {
    let r: Resultado | null = null;
    alterar((d) => {
      const aluno = d.alunos.find((a) => a.id === alunoId);
      if (!aluno) {
        r = { nome: "Código não reconhecido", liberado: false, motivo: "Peça para o aluno abrir o QR no app ou procure pelo nome.", via, hora: "" };
        return d;
      }
      const regra = regraDeAcesso(d, alunoId);
      const jaEntrou = d.checkins.some((c) => c.alunoId === alunoId && c.data.slice(0, 10) === hojeISO);
      r = { nome: aluno.nome, liberado: regra.liberado, motivo: regra.motivo, via, hora: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) };
      return {
        ...d,
        acessos: [...d.acessos, { id: novoId(), alunoId, data: isoAgora(), liberado: regra.liberado, motivo: regra.motivo, via }],
        checkins: regra.liberado && !jaEntrou ? [...d.checkins, { id: novoId(), alunoId, data: isoAgora(), via }] : d.checkins,
      };
    });
    setResultado(r);
  }

  function lerCodigo() {
    const id = codigo.trim().replace(/^SAC:/i, "");
    entrar(id, "qr");
    setCodigo("");
  }

  function checkinAgregador() {
    let id = agregadoId;
    if (!id) {
      if (!novoNome.trim()) return;
      id = novoId();
      const plano = db!.planos.find((p) => p.agregador === app);
      alterar((d) => ({
        ...d,
        alunos: [...d.alunos, { id, nome: novoNome.trim(), telefone: "55" + novoTel.replace(/\D/g, ""), email: "", nascimento: "2000-01-01", objetivo: "condicionamento", planoId: plano?.id ?? "pl-basico", matriculadoEm: isoAgora(), status: "ativo", origem: app }],
      }));
      avisar(`Cadastro feito: ${novoNome.split(" ")[0]} (${VIA[app]})`);
      setNovoNome(""); setNovoTel("");
    }
    entrar(id, app);
  }

  const agregados = db.alunos.filter((a) => a.origem === app && a.status === "ativo");
  const entradas = db.acessos.filter((a) => a.data.slice(0, 10) === hojeISO).sort((a, b) => b.data.localeCompare(a.data));

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <CabecalhoPagina titulo="Recepção" subtitulo="Entrada por QR code, regra da catraca e check-in de Wellhub e Totalpass" />

      {resultado && (
        <div role="status" className={`animar-entrada mb-5 flex items-center gap-4 rounded-3xl p-5 text-white shadow-lg ${resultado.liberado ? "bg-gradient-to-r from-emerald-600 to-marca-700" : "bg-gradient-to-r from-red-600 to-red-700"}`}>
          {resultado.liberado ? <CheckCircle2 size={44} /> : <ShieldX size={44} />}
          <div className="min-w-0">
            <p className="text-2xl font-bold">{resultado.liberado ? "Acesso liberado" : "Acesso bloqueado"}</p>
            <p className="text-white/90">{resultado.liberado ? `Bom treino, ${resultado.nome.split(" ")[0]}!` : resultado.nome}{resultado.motivo ? ` · ${resultado.motivo}` : ""}</p>
            {!resultado.liberado && resultado.hora && <p className="mt-1 text-sm text-white/80">Encaminhe para o balcão resolver antes de liberar a catraca.</p>}
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Cartao titulo="Leitor de QR code" icone={<ScanLine size={18} />}>
          <p className="mb-3 text-sm text-zinc-500">O aluno mostra o QR do app no leitor da catraca. Aqui você pode digitar o código ou simular a leitura.</p>
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); lerCodigo(); }}>
            <input className={estiloInput} placeholder="Ex.: SAC:a3" value={codigo} onChange={(e) => setCodigo(e.target.value)} aria-label="Código do QR" />
            <Botao type="submit" disabled={!codigo.trim()} icone={<QrCode size={16} />}>Ler</Botao>
          </form>
          <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-zinc-400">Simular leitura</p>
          <div className="flex flex-wrap gap-2">
            {db.alunos.filter((a) => a.origem === "direto" && a.status !== "cancelado").map((a) => (
              <button key={a.id} onClick={() => entrar(a.id, "qr")} className="inline-flex items-center gap-2 rounded-full bg-zinc-100 py-1 pl-1 pr-3 text-sm hover:bg-zinc-200">
                <Avatar nome={a.nome} tamanho="sm" /> {a.nome.split(" ")[0]}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-zinc-400">Regra: matrícula cancelada, plano pausado ou mensalidade atrasada há mais de 15 dias bloqueiam a entrada.</p>
        </Cartao>

        <Cartao titulo="Wellhub e Totalpass" icone={<UserPlus size={18} />}>
          <div className="mb-3 flex gap-1 rounded-xl bg-zinc-100 p-1">
            {(["wellhub", "totalpass"] as const).map((x) => (
              <button key={x} onClick={() => { setApp(x); setAgregadoId(""); }} className={`flex-1 rounded-lg py-1.5 text-sm ${app === x ? "bg-white font-medium shadow-sm" : "text-zinc-500"}`}>{VIA[x]}</button>
            ))}
          </div>
          <Campo rotulo="Aluno">
            <select className={estiloInput} value={agregadoId} onChange={(e) => setAgregadoId(e.target.value)}>
              <option value="">Primeira visita (cadastrar)</option>
              {agregados.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
            </select>
          </Campo>
          {!agregadoId && (
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Campo rotulo="Nome"><input className={estiloInput} value={novoNome} onChange={(e) => setNovoNome(e.target.value)} /></Campo>
              <Campo rotulo="WhatsApp"><input className={estiloInput} inputMode="tel" value={novoTel} onChange={(e) => setNovoTel(mascaraTelefone(e.target.value))} placeholder="(27) 99999-9999" /></Campo>
            </div>
          )}
          <Botao className="mt-3 w-full" onClick={checkinAgregador} disabled={!agregadoId && !novoNome.trim()}>Validar check-in {VIA[app]}</Botao>
          <p className="mt-2 text-xs text-zinc-400">Na demonstração o check-in é validado aqui. Com a integração oficial, o código do app {VIA[app]} é conferido automaticamente.</p>
        </Cartao>
      </div>

      <Cartao titulo={`Entradas de hoje · ${entradas.length}`} className="mt-4">
        {!entradas.length ? <p className="text-sm text-zinc-500">Nenhuma entrada registrada hoje.</p> : (
          <ul className="divide-y divide-zinc-100">
            {entradas.map((e) => {
              const a = db.alunos.find((x) => x.id === e.alunoId);
              return (
                <li key={e.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-sm">
                  <span className="w-12 tabular-nums text-zinc-500">{new Date(e.data).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                  <span className="min-w-0 flex-1 font-medium">{a?.nome ?? "Desconhecido"}</span>
                  <Etiqueta>{VIA[e.via]}</Etiqueta>
                  {e.liberado ? <Etiqueta cor="verde">liberado</Etiqueta> : <Etiqueta cor="vermelho">{e.motivo ?? "bloqueado"}</Etiqueta>}
                </li>
              );
            })}
          </ul>
        )}
      </Cartao>
    </main>
  );
}
