"use client";

import { useState } from "react";
import { alterar, definirPerfil, useBanco } from "@/lib/db";
import { PERGUNTAS_PARQ, gerarCobrancas, precisaAtestado, profissionalMenosOcupado } from "@/lib/regras";
import { formatarDinheiro, isoAgora, novoId } from "@/lib/datas";
import type { Aluno, Objetivo } from "@/lib/tipos";
import { Botao, BotaoLink, Campo, Cartao, Carregando, estiloInput } from "@/components/ui";

const OBJETIVOS: { id: Objetivo; rotulo: string }[] = [
  { id: "emagrecimento", rotulo: "Emagrecer" },
  { id: "hipertrofia", rotulo: "Ganhar massa muscular" },
  { id: "condicionamento", rotulo: "Melhorar o condicionamento" },
  { id: "saude", rotulo: "Saúde e qualidade de vida" },
  { id: "reabilitacao", rotulo: "Reabilitação / pós-lesão" },
];

const PASSOS = ["Seus dados", "Objetivo e plano", "Saúde", "Termos e pagamento"];

type Form = {
  nome: string; cpf: string; email: string; telefone: string; nascimento: string;
  objetivo: Objetivo; planoId: string;
  parq: Record<string, boolean>; lesoes: string; medicamentos: string;
  aceiteTermos: boolean; consentimentoSaude: boolean; metodo: "pix" | "cartao" | "boleto";
};

export default function Matricula() {
  const db = useBanco();
  const [passo, setPasso] = useState(0);
  const [concluido, setConcluido] = useState<Aluno | null>(null);
  const [f, setF] = useState<Form>({
    nome: "", cpf: "", email: "", telefone: "", nascimento: "",
    objetivo: "emagrecimento", planoId: "pl-completo",
    parq: {}, lesoes: "", medicamentos: "",
    aceiteTermos: false, consentimentoSaude: false, metodo: "pix",
  });
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((x) => ({ ...x, [k]: v }));

  if (!db) return <Carregando />;
  const plano = db.planos.find((p) => p.id === f.planoId)!;

  const passoValido = [
    f.nome.trim().length > 3 && /\S+@\S+/.test(f.email) && f.telefone.replace(/\D/g, "").length >= 10 && !!f.nascimento,
    !!f.planoId,
    PERGUNTAS_PARQ.every((p) => f.parq[p.id] !== undefined),
    f.aceiteTermos && f.consentimentoSaude,
  ][passo];

  function finalizar() {
    if (!db) return;
    const agora = new Date();
    const personal = plano.incluiPersonal ? profissionalMenosOcupado(db, "personal") : undefined;
    const nutri = plano.incluiNutricionista ? profissionalMenosOcupado(db, "nutricionista") : undefined;
    const aluno: Aluno = {
      id: novoId(), nome: f.nome.trim(), cpf: f.cpf, email: f.email.trim(), telefone: "55" + f.telefone.replace(/\D/g, ""),
      nascimento: f.nascimento, objetivo: f.objetivo, planoId: plano.id, personalId: personal?.id, nutricionistaId: nutri?.id,
      matriculadoEm: agora.toISOString(), status: "ativo", origem: "direto", consentimentoSaudeEm: agora.toISOString(),
    };
    const cobrancas = gerarCobrancas(aluno, plano, agora);
    // primeira cobrança paga na matrícula (pagamento simulado)
    cobrancas[0] = { ...cobrancas[0], status: "pago", pagoEm: agora.toISOString(), metodo: f.metodo };
    alterar((d) => ({
      ...d,
      alunos: [...d.alunos, aluno],
      anamneses: [...d.anamneses, { alunoId: aluno.id, data: isoAgora(), respostas: f.parq, lesoes: f.lesoes, medicamentos: f.medicamentos, observacoes: "" }],
      cobrancas: [...d.cobrancas, ...cobrancas],
    }));
    definirPerfil({ tipo: "aluno", id: aluno.id });
    setConcluido(aluno);
  }

  if (concluido) {
    const personal = db.profissionais.find((p) => p.id === concluido.personalId);
    const nutri = db.profissionais.find((p) => p.id === concluido.nutricionistaId);
    const atestado = precisaAtestado(f.parq);
    return (
      <main className="mx-auto max-w-xl px-4 py-10">
        <Cartao>
          <p className="text-3xl">🎉</p>
          <h1 className="mt-2 text-2xl font-bold">Bem-vindo(a), {concluido.nome.split(" ")[0]}!</h1>
          <p className="mt-2 text-zinc-600">Sua matrícula no plano {plano.nome} está confirmada.</p>
          <ul className="mt-4 space-y-2 text-sm">
            {personal && <li>🏋️ Seu personal: <strong>{personal.nome}</strong>. Ele vai marcar sua avaliação física.</li>}
            {nutri && <li>🥗 Sua nutricionista: <strong>{nutri.nome}</strong>. Ela vai agendar a primeira consulta.</li>}
            {!personal && <li>🏋️ O professor do salão vai montar seu primeiro treino.</li>}
            {atestado && <li className="rounded-lg bg-amber-50 p-2 text-amber-800">⚠️ Pela sua anamnese, precisamos de um atestado médico antes do primeiro treino.</li>}
          </ul>
          <div className="mt-6 flex gap-2">
            <BotaoLink href="/aluno/">Abrir meu app</BotaoLink>
            <Botao variante="secundario" onClick={() => { setConcluido(null); setPasso(0); setF({ ...f, nome: "", cpf: "", email: "", telefone: "", nascimento: "", parq: {}, aceiteTermos: false, consentimentoSaude: false }); }}>
              Nova matrícula
            </Botao>
          </div>
        </Cartao>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold">Matrícula</h1>
      <p className="mt-1 text-zinc-600">{db.academia.nome}</p>

      <ol className="mt-6 flex gap-2 text-xs">
        {PASSOS.map((p, i) => (
          <li key={p} className={`flex-1 border-t-4 pt-2 ${i <= passo ? "border-teal-700 text-teal-800" : "border-zinc-200 text-zinc-400"}`}>
            {i + 1}. {p}
          </li>
        ))}
      </ol>

      <div className="mt-6 space-y-4">
        {passo === 0 && (
          <Cartao titulo="Seus dados">
            <div className="grid gap-3 sm:grid-cols-2">
              <Campo rotulo="Nome completo"><input className={estiloInput} value={f.nome} onChange={(e) => set("nome", e.target.value)} /></Campo>
              <Campo rotulo="CPF"><input className={estiloInput} value={f.cpf} onChange={(e) => set("cpf", e.target.value)} placeholder="000.000.000-00" /></Campo>
              <Campo rotulo="E-mail"><input type="email" className={estiloInput} value={f.email} onChange={(e) => set("email", e.target.value)} /></Campo>
              <Campo rotulo="WhatsApp"><input className={estiloInput} value={f.telefone} onChange={(e) => set("telefone", e.target.value)} placeholder="(27) 99999-0000" /></Campo>
              <Campo rotulo="Data de nascimento"><input type="date" className={estiloInput} value={f.nascimento} onChange={(e) => set("nascimento", e.target.value)} /></Campo>
            </div>
          </Cartao>
        )}

        {passo === 1 && (
          <>
            <Cartao titulo="Qual é o seu objetivo?">
              <div className="flex flex-wrap gap-2">
                {OBJETIVOS.map((o) => (
                  <button key={o.id} onClick={() => set("objetivo", o.id)} className={`rounded-full border px-3 py-1.5 text-sm ${f.objetivo === o.id ? "border-teal-700 bg-teal-50 text-teal-800" : "border-zinc-300"}`}>
                    {o.rotulo}
                  </button>
                ))}
              </div>
            </Cartao>
            <div className="grid gap-3 sm:grid-cols-2">
              {db.planos.map((p) => (
                <button key={p.id} onClick={() => set("planoId", p.id)} className={`rounded-xl border bg-white p-4 text-left ${f.planoId === p.id ? "border-teal-700 ring-2 ring-teal-700/20" : "border-zinc-200"}`}>
                  <p className="font-semibold">{p.nome}</p>
                  <p className="text-xl font-bold">{formatarDinheiro(p.valorCentavos)}<span className="text-sm font-normal text-zinc-500">{p.periodicidadeMeses === 1 ? "/mês" : `/${p.periodicidadeMeses} meses`}</span></p>
                  <p className="mt-1 text-sm text-zinc-600">{p.descricao}</p>
                  <p className="mt-2 text-xs text-zinc-500">{[p.incluiPersonal && "Personal", p.incluiNutricionista && "Nutricionista"].filter(Boolean).join(" + ") || "Professor do salão"}</p>
                </button>
              ))}
            </div>
          </>
        )}

        {passo === 2 && (
          <Cartao titulo="Questionário de saúde (PAR-Q)">
            <ul className="space-y-3">
              {PERGUNTAS_PARQ.map((p) => (
                <li key={p.id} className="text-sm">
                  <p>{p.texto}</p>
                  <div className="mt-1 flex gap-2">
                    {[false, true].map((v) => (
                      <button key={String(v)} onClick={() => set("parq", { ...f.parq, [p.id]: v })} className={`rounded-lg border px-3 py-1 ${f.parq[p.id] === v ? "border-teal-700 bg-teal-50 text-teal-800" : "border-zinc-300"}`}>
                        {v ? "Sim" : "Não"}
                      </button>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4 grid gap-3">
              <Campo rotulo="Lesões ou cirurgias (opcional)"><input className={estiloInput} value={f.lesoes} onChange={(e) => set("lesoes", e.target.value)} /></Campo>
              <Campo rotulo="Medicamentos de uso contínuo (opcional)"><input className={estiloInput} value={f.medicamentos} onChange={(e) => set("medicamentos", e.target.value)} /></Campo>
            </div>
            {precisaAtestado(f.parq) && <p className="mt-3 rounded-lg bg-amber-50 p-2 text-sm text-amber-800">Você respondeu “sim” a alguma pergunta. Vamos pedir um atestado médico antes do primeiro treino.</p>}
          </Cartao>
        )}

        {passo === 3 && (
          <>
            <Cartao titulo="Resumo">
              <p className="text-sm">{f.nome} · plano <strong>{plano.nome}</strong> · {formatarDinheiro(plano.valorCentavos)}{plano.periodicidadeMeses === 1 ? " por mês" : ` a cada ${plano.periodicidadeMeses} meses`}</p>
            </Cartao>
            <Cartao titulo="Termos e privacidade">
              <label className="flex gap-2 text-sm"><input type="checkbox" checked={f.aceiteTermos} onChange={(e) => set("aceiteTermos", e.target.checked)} /> Li e aceito o contrato de prestação de serviços e a política de privacidade.</label>
              <label className="mt-2 flex gap-2 text-sm"><input type="checkbox" checked={f.consentimentoSaude} onChange={(e) => set("consentimentoSaude", e.target.checked)} /> Autorizo o uso dos meus dados de saúde (anamnese, medidas e evolução) pela equipe da academia para meu acompanhamento, conforme a LGPD.</label>
            </Cartao>
            <Cartao titulo="Pagamento">
              <div className="flex gap-2">
                {(["pix", "cartao", "boleto"] as const).map((m) => (
                  <button key={m} onClick={() => set("metodo", m)} className={`rounded-lg border px-3 py-1.5 text-sm ${f.metodo === m ? "border-teal-700 bg-teal-50 text-teal-800" : "border-zinc-300"}`}>
                    {m === "pix" ? "Pix" : m === "cartao" ? "Cartão (recorrente)" : "Boleto"}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs text-zinc-500">Demonstração: o pagamento é simulado. Na versão real, a cobrança é feita pelo gateway (ex.: Asaas).</p>
            </Cartao>
          </>
        )}
      </div>

      <div className="mt-6 flex justify-between">
        <Botao variante="secundario" disabled={passo === 0} onClick={() => setPasso(passo - 1)} className={passo === 0 ? "invisible" : ""}>Voltar</Botao>
        {passo < PASSOS.length - 1 ? (
          <Botao disabled={!passoValido} onClick={() => setPasso(passo + 1)}>Continuar</Botao>
        ) : (
          <Botao disabled={!passoValido} onClick={finalizar}>Pagar {formatarDinheiro(plano.valorCentavos)} e concluir</Botao>
        )}
      </div>
    </main>
  );
}
