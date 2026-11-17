"use client";

import { useState } from "react";
import { FileText, FlaskConical, Stethoscope, Upload } from "lucide-react";
import { alterar } from "@/lib/db";
import type { BancoDados, ValorExame } from "@/lib/tipos";
import { foraDaReferencia } from "@/lib/regras";
import { dataISO, formatarData, isoAgora, novoId } from "@/lib/datas";
import { Botao, Campo, Cartao, Etiqueta, avisar, estiloInput } from "./ui";

/** Marcadores mais pedidos, com faixas de referência gerais para adultos (cada laboratório tem as suas). */
export const MARCADORES: Omit<ValorExame, "valor">[] = [
  { marcador: "Glicose em jejum", unidade: "mg/dL", refMin: 70, refMax: 99 },
  { marcador: "Colesterol total", unidade: "mg/dL", refMax: 190 },
  { marcador: "HDL", unidade: "mg/dL", refMin: 40 },
  { marcador: "LDL", unidade: "mg/dL", refMax: 130 },
  { marcador: "Triglicerídeos", unidade: "mg/dL", refMax: 150 },
  { marcador: "Hemoglobina", unidade: "g/dL", refMin: 12, refMax: 17.5 },
  { marcador: "Ferritina", unidade: "ng/mL", refMin: 15, refMax: 150 },
  { marcador: "Vitamina D", unidade: "ng/mL", refMin: 30 },
  { marcador: "Vitamina B12", unidade: "pg/mL", refMin: 200 },
  { marcador: "TSH", unidade: "µUI/mL", refMin: 0.4, refMax: 4.5 },
];

const um = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 2 });

/** Exames de sangue do aluno: envio pelo app ou pela nutri, com destaque do que está fora da referência. */
export function ExamesAluno({ db, alunoId, quem }: { db: BancoDados; alunoId: string; quem: "aluno" | "nutricionista" }) {
  const exames = db.exames.filter((e) => e.alunoId === alunoId).sort((a, b) => b.data.localeCompare(a.data));
  const [novo, setNovo] = useState(false);
  const [data, setData] = useState(dataISO(new Date()));
  const [lab, setLab] = useState("");
  const [arquivo, setArquivo] = useState("");
  const [valores, setValores] = useState<Record<string, string>>({});

  function salvar() {
    const lista: ValorExame[] = MARCADORES.flatMap((m) => {
      const v = Number((valores[m.marcador] ?? "").replace(",", "."));
      return valores[m.marcador] && !Number.isNaN(v) ? [{ ...m, valor: v }] : [];
    });
    if (!lista.length && !arquivo) return avisar("Anexe o PDF ou preencha pelo menos um valor");
    alterar((d) => ({
      ...d,
      exames: [...d.exames, { id: novoId(), alunoId, data: new Date(data + "T12:00:00").toISOString(), laboratorio: lab || undefined, arquivoNome: arquivo || undefined, valores: lista, enviadoPor: quem }],
      notas: quem === "aluno" ? [...d.notas, { id: novoId(), alunoId, autorId: alunoId, data: isoAgora(), texto: `Enviou exames de sangue de ${formatarData(data)}${lista.some((x) => foraDaReferencia(x)) ? " com valores fora da referência" : ""}.` }] : d.notas,
    }));
    avisar(quem === "aluno" ? "Exames enviados para a nutricionista" : "Exames registrados");
    setNovo(false); setValores({}); setArquivo(""); setLab("");
  }

  return (
    <Cartao titulo={quem === "aluno" ? "Meus exames" : "Exames de sangue"} icone={<FlaskConical size={18} />}
      acao={!novo && <button className="rounded-lg px-2 py-1 text-sm font-medium text-marca-700 hover:bg-marca-50" onClick={() => setNovo(true)}>{quem === "aluno" ? "Enviar exame" : "Adicionar"}</button>}>
      {novo && (
        <div className="mb-4 space-y-3 rounded-xl border border-zinc-200 p-3">
          <div className="grid grid-cols-2 gap-2">
            <Campo rotulo="Data da coleta"><input type="date" className={estiloInput} value={data} onChange={(e) => setData(e.target.value)} /></Campo>
            <Campo rotulo="Laboratório"><input className={estiloInput} value={lab} onChange={(e) => setLab(e.target.value)} placeholder="Opcional" /></Campo>
          </div>
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-zinc-300 p-3 text-sm text-zinc-600 hover:bg-zinc-50">
            <Upload size={18} /> {arquivo || "Anexar o PDF do laboratório"}
            <input type="file" accept="application/pdf,image/*" className="sr-only" onChange={(e) => setArquivo(e.target.files?.[0]?.name ?? "")} />
          </label>
          <p className="text-xs text-zinc-500">Na demonstração o arquivo não é enviado, só o nome. Preencha os valores que tiver:</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {MARCADORES.map((m) => (
              <Campo key={m.marcador} rotulo={`${m.marcador} (${m.unidade})`}>
                <input className={estiloInput} inputMode="decimal" value={valores[m.marcador] ?? ""} onChange={(e) => setValores({ ...valores, [m.marcador]: e.target.value })} />
              </Campo>
            ))}
          </div>
          <div className="flex gap-2"><Botao onClick={salvar}>{quem === "aluno" ? "Enviar" : "Salvar"}</Botao><Botao variante="secundario" onClick={() => setNovo(false)}>Cancelar</Botao></div>
        </div>
      )}
      {!exames.length && !novo && <p className="text-sm text-zinc-500">{quem === "aluno" ? "Envie seus exames de sangue para a nutricionista ajustar sua dieta." : "Nenhum exame enviado ainda."}</p>}
      <div className="space-y-4">
        {exames.map((e) => (
          <section key={e.id}>
            <p className="mb-1.5 flex flex-wrap items-center gap-2 text-sm">
              <strong>{formatarData(e.data)}</strong>
              {e.laboratorio && <span className="text-zinc-500">{e.laboratorio}</span>}
              {e.arquivoNome && <Etiqueta><FileText size={12} /> {e.arquivoNome}</Etiqueta>}
              <span className="text-xs text-zinc-400">enviado {e.enviadoPor === "aluno" ? "pelo aluno" : "pela nutricionista"}</span>
            </p>
            {e.valores.length > 0 && (
              <ul className="divide-y divide-zinc-100 rounded-xl bg-zinc-50 px-3 text-sm">
                {e.valores.map((v) => {
                  const fora = foraDaReferencia(v);
                  const ref = v.refMin != null && v.refMax != null ? `${um(v.refMin)} a ${um(v.refMax)}` : v.refMin != null ? `acima de ${um(v.refMin)}` : v.refMax != null ? `até ${um(v.refMax)}` : "";
                  return (
                    <li key={v.marcador} className="flex items-center gap-2 py-2">
                      <span className="flex-1">{v.marcador}<span className="block text-xs text-zinc-400">referência {ref} {v.unidade}</span></span>
                      <span className={`font-semibold ${fora ? "text-red-700" : "text-zinc-800"}`}>{um(v.valor)}</span>
                      {fora ? <Etiqueta cor="vermelho">{fora}</Etiqueta> : <Etiqueta cor="verde">ok</Etiqueta>}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        ))}
      </div>
      {exames.length > 0 && <p className="mt-3 text-xs text-zinc-400">Faixas de referência gerais para adultos. Quem interpreta os exames é o médico ou a nutricionista.</p>}
    </Cartao>
  );
}

/** Encaminha o aluno para o fisioterapeuta da academia e mostra a situação. */
export function EncaminharFisio({ db, alunoId, deId }: { db: BancoDados; alunoId: string; deId: string }) {
  const fisio = db.profissionais.find((p) => p.papel === "fisioterapeuta");
  const atual = db.encaminhamentos.filter((e) => e.alunoId === alunoId).sort((a, b) => b.data.localeCompare(a.data))[0];
  const [abrindo, setAbrindo] = useState(false);
  const [motivo, setMotivo] = useState("");
  if (!fisio) return null;
  function enviar() {
    if (!motivo.trim()) return;
    alterar((d) => ({
      ...d,
      encaminhamentos: [...d.encaminhamentos, { id: novoId(), alunoId, deId, paraId: fisio!.id, data: isoAgora(), motivo: motivo.trim(), status: "aberto" }],
    }));
    avisar(`Encaminhado para ${fisio!.nome}`);
    setAbrindo(false); setMotivo("");
  }
  const ST: Record<string, string> = { aberto: "Aguardando o fisioterapeuta", em_atendimento: "Em atendimento", liberado: "Liberado para treinar" };
  return (
    <Cartao titulo="Fisioterapia" icone={<Stethoscope size={18} />}
      acao={!abrindo && (!atual || atual.status === "liberado") && <button className="rounded-lg px-2 py-1 text-sm font-medium text-marca-700 hover:bg-marca-50" onClick={() => setAbrindo(true)}>Encaminhar</button>}>
      {atual && !abrindo && (
        <div className="text-sm">
          <p className="flex items-center gap-2"><Etiqueta cor={atual.status === "liberado" ? "verde" : "amarelo"}>{ST[atual.status]}</Etiqueta><span className="text-zinc-500">desde {formatarData(atual.data)}</span></p>
          <p className="mt-2 text-zinc-600"><strong>Motivo:</strong> {atual.motivo}</p>
          {atual.liberacao && <p className="mt-2 rounded-xl bg-sky-50 p-3 text-sky-900"><strong>Orientação de {fisio.nome}:</strong> {atual.liberacao}</p>}
        </div>
      )}
      {!atual && !abrindo && <p className="text-sm text-zinc-500">Dor, lesão ou limitação? Encaminhe para {fisio.nome} ({fisio.registro}). A orientação volta para o personal.</p>}
      {abrindo && (
        <div className="space-y-2">
          <Campo rotulo="O que está acontecendo?"><textarea className={estiloInput} rows={3} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ex.: dor no ombro direito no supino há 2 semanas" /></Campo>
          <div className="flex gap-2"><Botao onClick={enviar} disabled={!motivo.trim()}>Encaminhar para {fisio.nome.split(" ")[0]}</Botao><Botao variante="secundario" onClick={() => setAbrindo(false)}>Cancelar</Botao></div>
        </div>
      )}
    </Cartao>
  );
}
