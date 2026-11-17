"use client";

import { useState } from "react";
import { Apple, Barcode, Check, CreditCard, Dumbbell, PartyPopper, QrCode, ShieldCheck, TriangleAlert } from "lucide-react";
import { alterar, definirPerfil, useBanco } from "@/lib/db";
import { entrar, useSessao } from "@/lib/sessao";
import { PERGUNTAS_PARQ, gerarCobrancas, precisaAtestado, profissionalMenosOcupado } from "@/lib/regras";
import { formatarDinheiro, isoAgora, novoId } from "@/lib/datas";
import { cpfValido, emailValido, mascaraCPF, mascaraTelefone, telefoneValido } from "@/lib/mascaras";
import type { Aluno, Objetivo } from "@/lib/tipos";
import { Avatar, Botao, BotaoLink, Campo, Cartao, Carregando, Etiqueta, estiloInput } from "@/components/ui";

const OBJETIVOS: { id: Objetivo; rotulo: string; emoji: string; plano: string }[] = [
  { id: "emagrecimento", rotulo: "Emagrecer", emoji: "🔥", plano: "pl-completo" },
  { id: "hipertrofia", rotulo: "Ganhar massa", emoji: "💪", plano: "pl-completo" },
  { id: "condicionamento", rotulo: "Condicionamento", emoji: "🏃", plano: "pl-acomp" },
  { id: "saude", rotulo: "Saúde e bem-estar", emoji: "❤️", plano: "pl-basico" },
  { id: "reabilitacao", rotulo: "Reabilitação", emoji: "🩹", plano: "pl-acomp" },
];

const PASSOS = ["Seus dados", "Objetivo e plano", "Saúde", "Pagamento"];

type Form = {
  nome: string; cpf: string; email: string; telefone: string; nascimento: string;
  objetivo: Objetivo; planoId: string;
  parq: Record<string, boolean>; lesoes: string; medicamentos: string;
  aceiteTermos: boolean; consentimentoSaude: boolean; metodo: "pix" | "cartao" | "boleto";
};

const VAZIO: Form = {
  nome: "", cpf: "", email: "", telefone: "", nascimento: "",
  objetivo: "emagrecimento", planoId: "pl-completo",
  parq: {}, lesoes: "", medicamentos: "",
  aceiteTermos: false, consentimentoSaude: false, metodo: "pix",
};

export default function Matricula() {
  const db = useBanco();
  const sessaoAtual = useSessao();
  const [passo, setPasso] = useState(0);
  const [tentou, setTentou] = useState(false);
  const [concluido, setConcluido] = useState<Aluno | null>(null);
  const [f, setF] = useState<Form>(VAZIO);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((x) => ({ ...x, [k]: v }));

  if (!db) return <Carregando />;
  const plano = db.planos.find((p) => p.id === f.planoId)!;
  const recomendado = OBJETIVOS.find((o) => o.id === f.objetivo)!.plano;

  const erros = {
    nome: f.nome.trim().split(/\s+/).length < 2 && "Informe nome e sobrenome",
    cpf: f.cpf && !cpfValido(f.cpf) && "CPF inválido",
    email: !emailValido(f.email) && "Informe um e-mail válido",
    telefone: !telefoneValido(f.telefone) && "Informe o WhatsApp com DDD",
    nascimento: !f.nascimento && "Informe a data de nascimento",
  };
  const faltamParq = PERGUNTAS_PARQ.filter((p) => f.parq[p.id] === undefined).length;
  const passoValido = [
    !Object.values(erros).some(Boolean),
    !!f.planoId,
    faltamParq === 0,
    f.aceiteTermos && f.consentimentoSaude,
  ][passo];
  const mostrarErro = (k: keyof typeof erros) => tentou && erros[k];

  function avancar() {
    if (!passoValido) { setTentou(true); return; }
    setTentou(false);
    if (passo < PASSOS.length - 1) { setPasso(passo + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }
    else finalizar();
  }

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
    cobrancas[0] = { ...cobrancas[0], status: "pago", pagoEm: agora.toISOString(), metodo: f.metodo };
    alterar((d) => ({
      ...d,
      alunos: [...d.alunos, aluno],
      anamneses: [...d.anamneses, { alunoId: aluno.id, data: isoAgora(), respostas: f.parq, lesoes: f.lesoes, medicamentos: f.medicamentos, observacoes: "" }],
      cobrancas: [...d.cobrancas, ...cobrancas],
    }));
    definirPerfil({ tipo: "aluno", id: aluno.id });
    if (!sessaoAtual) entrar({ papel: "aluno", id: aluno.id, nome: aluno.nome });
    setConcluido(aluno);
    window.scrollTo({ top: 0 });
  }

  if (concluido) {
    const personal = db.profissionais.find((p) => p.id === concluido.personalId);
    const nutri = db.profissionais.find((p) => p.id === concluido.nutricionistaId);
    const atestado = precisaAtestado(f.parq);
    return (
      <main className="mx-auto max-w-xl px-4 py-10">
        <Cartao className="animar-entrada text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-marca-50 text-marca-600"><PartyPopper size={32} /></span>
          <h1 className="mt-4 text-2xl font-bold">Bem-vindo(a), {concluido.nome.split(" ")[0]}!</h1>
          <p className="mt-1 text-zinc-600">Matrícula no plano <strong>{plano.nome}</strong> confirmada.</p>

          <div className="mt-6 space-y-3 text-left">
            <p className="text-sm font-semibold text-zinc-500">Próximos passos</p>
            {personal ? (
              <div className="flex items-center gap-3 rounded-xl bg-zinc-50 p-3"><Avatar nome={personal.nome} /><div className="text-sm"><p className="font-medium">{personal.nome}</p><p className="text-zinc-500">Seu personal vai marcar a avaliação física</p></div></div>
            ) : (
              <div className="flex items-center gap-3 rounded-xl bg-zinc-50 p-3"><Dumbbell className="text-marca-600" /><p className="text-sm">O professor do salão monta seu primeiro treino</p></div>
            )}
            {nutri && <div className="flex items-center gap-3 rounded-xl bg-zinc-50 p-3"><Avatar nome={nutri.nome} /><div className="text-sm"><p className="font-medium">{nutri.nome}</p><p className="text-zinc-500">Sua nutricionista vai agendar a 1ª consulta</p></div></div>}
            {atestado && <div className="flex items-start gap-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900"><TriangleAlert size={18} className="mt-0.5 shrink-0" /> Traga um atestado médico antes do primeiro treino.</div>}
          </div>

          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            {sessaoAtual && sessaoAtual.papel !== "demo" && sessaoAtual.papel !== "aluno"
              ? <BotaoLink href={`/painel/aluno/?id=${concluido.id}`}>Abrir a ficha do aluno</BotaoLink>
              : <BotaoLink href="/aluno/">Abrir meu app</BotaoLink>}
            <Botao variante="secundario" onClick={() => { setConcluido(null); setPasso(0); setF(VAZIO); }}>Nova matrícula</Botao>
          </div>
        </Cartao>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 pb-32 pt-8 sm:pb-12">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Matrícula</h1>
      <p className="mt-1 text-zinc-500">{db.academia.nome} · leva cerca de 3 minutos</p>

      <ol className="mt-6 flex items-center gap-2" aria-label="Etapas">
        {PASSOS.map((p, i) => (
          <li key={p} className="flex flex-1 items-center gap-2">
            <button
              disabled={i > passo}
              onClick={() => setPasso(i)}
              aria-current={i === passo ? "step" : undefined}
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${i < passo ? "bg-marca-600 text-white" : i === passo ? "bg-marca-700 text-white ring-4 ring-marca-100" : "bg-zinc-200 text-zinc-500"}`}
            >
              {i < passo ? <Check size={16} /> : i + 1}
            </button>
            <span className={`hidden text-sm sm:inline ${i === passo ? "font-medium text-zinc-900" : "text-zinc-500"}`}>{p}</span>
            {i < PASSOS.length - 1 && <span className={`h-0.5 flex-1 rounded ${i < passo ? "bg-marca-500" : "bg-zinc-200"}`} />}
          </li>
        ))}
      </ol>
      <p className="mt-3 text-sm font-medium text-zinc-700 sm:hidden">Etapa {passo + 1} de {PASSOS.length}: {PASSOS[passo]}</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
        <div key={passo} className="animar-entrada space-y-4">
          {passo === 0 && (
            <Cartao titulo="Seus dados">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2"><Campo rotulo="Nome completo" erro={mostrarErro("nome")}><input autoComplete="name" className={estiloInput} value={f.nome} onChange={(e) => set("nome", e.target.value)} placeholder="Como está no documento" /></Campo></div>
                <Campo rotulo="WhatsApp" erro={mostrarErro("telefone")} dica="Usamos para lembretes e para falar com você"><input type="tel" autoComplete="tel-national" inputMode="tel" className={estiloInput} value={f.telefone} onChange={(e) => set("telefone", mascaraTelefone(e.target.value))} placeholder="(27) 99999-0000" /></Campo>
                <Campo rotulo="E-mail" erro={mostrarErro("email")}><input type="email" autoComplete="email" className={estiloInput} value={f.email} onChange={(e) => set("email", e.target.value)} placeholder="voce@email.com" /></Campo>
                <Campo rotulo="Data de nascimento" erro={mostrarErro("nascimento")}><input type="date" autoComplete="bday" className={estiloInput} value={f.nascimento} onChange={(e) => set("nascimento", e.target.value)} /></Campo>
                <Campo rotulo="CPF (opcional)" erro={mostrarErro("cpf")}><input inputMode="numeric" className={estiloInput} value={f.cpf} onChange={(e) => set("cpf", mascaraCPF(e.target.value))} placeholder="000.000.000-00" /></Campo>
              </div>
            </Cartao>
          )}

          {passo === 1 && (
            <>
              <Cartao titulo="Qual é o seu objetivo?">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                  {OBJETIVOS.map((o) => (
                    <button key={o.id} onClick={() => { set("objetivo", o.id); set("planoId", o.plano); }} aria-pressed={f.objetivo === o.id}
                      className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-sm transition ${f.objetivo === o.id ? "border-marca-600 bg-marca-50 font-medium text-marca-800 ring-2 ring-marca-100" : "border-zinc-200 hover:border-zinc-300"}`}>
                      <span className="text-2xl" aria-hidden>{o.emoji}</span>{o.rotulo}
                    </button>
                  ))}
                </div>
              </Cartao>
              <div className="grid gap-3 sm:grid-cols-2">
                {db.planos.filter((p) => !p.agregador).map((p) => {
                  const sel = f.planoId === p.id;
                  return (
                    <button key={p.id} onClick={() => set("planoId", p.id)} aria-pressed={sel}
                      className={`relative rounded-2xl border bg-white p-5 text-left shadow-sm transition ${sel ? "border-marca-600 ring-4 ring-marca-100" : "border-zinc-200 hover:border-zinc-300"}`}>
                      {p.id === recomendado && <span className="absolute -top-2.5 right-4"><Etiqueta cor="verde">Recomendado para você</Etiqueta></span>}
                      <div className="flex items-start justify-between">
                        <p className="font-semibold">{p.nome}</p>
                        <span className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${sel ? "border-marca-600 bg-marca-600 text-white" : "border-zinc-300"}`}>{sel && <Check size={12} />}</span>
                      </div>
                      <p className="mt-2 text-2xl font-bold">{formatarDinheiro(p.valorCentavos)}<span className="text-sm font-normal text-zinc-500">{p.periodicidadeMeses === 1 ? "/mês" : `/${p.periodicidadeMeses} meses`}</span></p>
                      <p className="mt-2 text-sm text-zinc-600">{p.descricao}</p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <Etiqueta><Dumbbell size={12} /> {p.incluiPersonal ? "Personal" : "Professor do salão"}</Etiqueta>
                        {p.incluiNutricionista && <Etiqueta><Apple size={12} /> Nutricionista</Etiqueta>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {passo === 2 && (
            <Cartao titulo="Questionário de saúde" acao={<span className="text-xs text-zinc-500">{PERGUNTAS_PARQ.length - faltamParq}/{PERGUNTAS_PARQ.length}</span>}>
              <p className="mb-4 text-sm text-zinc-500">Responda com sinceridade. Isso ajuda o personal a montar um treino seguro.</p>
              <ul className="divide-y divide-zinc-100">
                {PERGUNTAS_PARQ.map((p) => (
                  <li key={p.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className={`text-sm ${tentou && f.parq[p.id] === undefined ? "text-red-600" : "text-zinc-800"}`}>{p.texto}</p>
                    <div className="flex shrink-0 gap-1 rounded-xl bg-zinc-100 p-1">
                      {[false, true].map((v) => (
                        <button key={String(v)} onClick={() => set("parq", { ...f.parq, [p.id]: v })} aria-pressed={f.parq[p.id] === v}
                          className={`w-16 rounded-lg py-1.5 text-sm font-medium ${f.parq[p.id] === v ? (v ? "bg-amber-500 text-white" : "bg-white text-zinc-900 shadow-sm") : "text-zinc-500"}`}>
                          {v ? "Sim" : "Não"}
                        </button>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Campo rotulo="Lesões ou cirurgias (opcional)"><input className={estiloInput} value={f.lesoes} onChange={(e) => set("lesoes", e.target.value)} placeholder="Ex.: dor no joelho direito" /></Campo>
                <Campo rotulo="Remédios de uso contínuo (opcional)"><input className={estiloInput} value={f.medicamentos} onChange={(e) => set("medicamentos", e.target.value)} /></Campo>
              </div>
              {precisaAtestado(f.parq) && <p className="mt-4 flex gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900"><TriangleAlert size={18} className="shrink-0" /> Como você respondeu “sim” a alguma pergunta, vamos pedir um atestado médico antes do primeiro treino.</p>}
            </Cartao>
          )}

          {passo === 3 && (
            <>
              <Cartao titulo="Forma de pagamento">
                <div className="grid gap-2 sm:grid-cols-3">
                  {([["pix", "Pix", QrCode, "Aprovação na hora"], ["cartao", "Cartão", CreditCard, "Cobrança automática"], ["boleto", "Boleto", Barcode, "Até 2 dias úteis"]] as const).map(([id, nome, Icone, info]) => (
                    <button key={id} onClick={() => set("metodo", id)} aria-pressed={f.metodo === id}
                      className={`flex items-center gap-3 rounded-xl border p-3 text-left ${f.metodo === id ? "border-marca-600 bg-marca-50 ring-2 ring-marca-100" : "border-zinc-200"}`}>
                      <Icone size={22} className="text-marca-700" />
                      <span><span className="block text-sm font-medium">{nome}</span><span className="block text-xs text-zinc-500">{info}</span></span>
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-xs text-zinc-400">Demonstração: o pagamento é simulado.</p>
              </Cartao>
              <Cartao titulo="Termos e privacidade" icone={<ShieldCheck size={18} />}>
                <label className={`flex gap-3 rounded-xl p-2 text-sm ${tentou && !f.aceiteTermos ? "bg-red-50" : ""}`}>
                  <input type="checkbox" className="mt-0.5 h-5 w-5 accent-marca-700" checked={f.aceiteTermos} onChange={(e) => set("aceiteTermos", e.target.checked)} />
                  Li e aceito o contrato de prestação de serviços e a política de privacidade.
                </label>
                <label className={`mt-1 flex gap-3 rounded-xl p-2 text-sm ${tentou && !f.consentimentoSaude ? "bg-red-50" : ""}`}>
                  <input type="checkbox" className="mt-0.5 h-5 w-5 accent-marca-700" checked={f.consentimentoSaude} onChange={(e) => set("consentimentoSaude", e.target.checked)} />
                  Autorizo a equipe da academia a usar meus dados de saúde (anamnese, medidas e evolução) para meu acompanhamento, conforme a LGPD.
                </label>
              </Cartao>
            </>
          )}
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-20">
            <Cartao titulo="Resumo">
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-zinc-500">Plano</dt><dd className="font-medium">{plano.nome}</dd></div>
                <div className="flex justify-between"><dt className="text-zinc-500">Objetivo</dt><dd>{OBJETIVOS.find((o) => o.id === f.objetivo)?.rotulo}</dd></div>
                {f.nome && <div className="flex justify-between"><dt className="text-zinc-500">Aluno</dt><dd className="truncate pl-4">{f.nome}</dd></div>}
              </dl>
              <div className="mt-4 flex items-baseline justify-between border-t border-zinc-100 pt-4">
                <span className="text-sm text-zinc-500">Hoje</span>
                <span className="text-xl font-bold">{formatarDinheiro(plano.valorCentavos)}</span>
              </div>
              <Botao className="mt-4 w-full" onClick={avancar}>{passo < PASSOS.length - 1 ? "Continuar" : "Pagar e concluir"}</Botao>
              {passo > 0 && <Botao variante="fantasma" className="mt-1 w-full" onClick={() => setPasso(passo - 1)}>Voltar</Botao>}
              {tentou && !passoValido && <p className="mt-2 text-center text-xs text-red-600">Confira os campos destacados.</p>}
            </Cartao>
          </div>
        </aside>
      </div>

      {/* barra de ações fixa no celular e tablet */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200 bg-white/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          {passo > 0 && <Botao variante="secundario" onClick={() => setPasso(passo - 1)}>Voltar</Botao>}
          <div className="ml-auto text-right">
            <p className="text-xs text-zinc-500">{plano.nome}</p>
            <p className="font-bold">{formatarDinheiro(plano.valorCentavos)}</p>
          </div>
          <Botao onClick={avancar}>{passo < PASSOS.length - 1 ? "Continuar" : "Pagar e concluir"}</Botao>
        </div>
        {tentou && !passoValido && <p className="mt-1 text-center text-xs text-red-600">Confira os campos destacados.</p>}
      </div>
    </main>
  );
}
