"use client";

import { useState } from "react";
import type { BancoDados, PlanoAlimentar, Treino } from "@/lib/tipos";
import { PERGUNTAS_PARQ, imc, riscoDoAluno, sequenciaSemanas } from "@/lib/regras";
import { diasEntre, formatarData, idade } from "@/lib/datas";
import { MessageCircle, TriangleAlert } from "lucide-react";
import { Avatar, Cartao, Etiqueta, EtiquetaRisco, GraficoLinha, Vazio, estiloInput } from "./ui";

const OBJ: Record<string, string> = {
  emagrecimento: "Emagrecer", hipertrofia: "Ganhar massa", condicionamento: "Condicionamento", saude: "Saúde", reabilitacao: "Reabilitação",
};

export function CabecalhoAluno({ db, alunoId }: { db: BancoDados; alunoId: string }) {
  const a = db.alunos.find((x) => x.id === alunoId)!;
  const risco = riscoDoAluno(db, alunoId);
  const anamnese = db.anamneses.find((x) => x.alunoId === alunoId);
  const alertas = anamnese ? PERGUNTAS_PARQ.filter((p) => anamnese.respostas[p.id]) : [];
  const plano = db.planos.find((p) => p.id === a.planoId);
  const personal = db.profissionais.find((p) => p.id === a.personalId);
  const nutri = db.profissionais.find((p) => p.id === a.nutricionistaId);
  return (
    <Cartao>
      <div className="flex flex-wrap items-start gap-4">
        <Avatar nome={a.nome} tamanho="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold sm:text-2xl">{a.nome}</h1>
            <EtiquetaRisco nivel={risco.nivel} pontuacao={risco.pontuacao} />
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Etiqueta>{idade(a.nascimento)} anos</Etiqueta>
            <Etiqueta>{OBJ[a.objetivo]}</Etiqueta>
            <Etiqueta>Plano {plano?.nome}</Etiqueta>
            <Etiqueta>{diasEntre(new Date(a.matriculadoEm), new Date())} dias de casa</Etiqueta>
          </div>
          <p className="mt-2 text-sm text-zinc-500">
            {personal ? `Personal: ${personal.nome}` : "Professor do salão"}{nutri ? ` · Nutri: ${nutri.nome}` : ""}
          </p>
        </div>
        <a href={`https://wa.me/${a.telefone}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-50">
          <MessageCircle size={16} className="text-[#25D366]" /> WhatsApp
        </a>
      </div>
      {risco.motivos.length > 0 && risco.nivel !== "baixo" && (
        <p className="mt-4 rounded-xl bg-zinc-50 p-3 text-sm text-zinc-600"><strong className="text-zinc-800">Por que está em risco:</strong> {risco.motivos.join(", ")}.</p>
      )}
      {(alertas.length > 0 || anamnese?.lesoes) && (
        <div className="mt-3 flex gap-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
          <TriangleAlert size={18} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Atenção na anamnese</p>
            <ul className="mt-1 list-disc pl-4">
              {alertas.map((p) => <li key={p.id}>{p.texto}</li>)}
              {anamnese?.lesoes && <li>Lesões: {anamnese.lesoes}</li>}
              {anamnese?.medicamentos && <li>Medicamentos: {anamnese.medicamentos}</li>}
            </ul>
          </div>
        </div>
      )}
    </Cartao>
  );
}

export function Frequencia({ db, alunoId }: { db: BancoDados; alunoId: string }) {
  const datas = db.checkins.filter((c) => c.alunoId === alunoId).map((c) => new Date(c.data));
  const hoje = new Date();
  const semanas = Array.from({ length: 8 }, (_, i) => {
    const fim = hoje.getTime() - i * 7 * 86_400_000;
    return datas.filter((d) => d.getTime() > fim - 7 * 86_400_000 && d.getTime() <= fim).length;
  }).reverse();
  const max = Math.max(4, ...semanas);
  return (
    <Cartao titulo="Frequência (8 semanas)" acao={<Etiqueta cor="azul">{sequenciaSemanas(datas)} semanas seguidas</Etiqueta>}>
      <div className="flex h-24 items-end gap-2">
        {semanas.map((n, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-xs text-zinc-500">{n}</span>
            <div className="w-full rounded-md bg-marca-500" style={{ height: `${(n / max) * 64}px`, minHeight: n ? 4 : 1 }} />
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-zinc-500">Treinos por semana, da mais antiga à atual. Total: {datas.length} check-ins.</p>
    </Cartao>
  );
}

export function EvolucaoCorporal({ db, alunoId }: { db: BancoDados; alunoId: string }) {
  const a = db.alunos.find((x) => x.id === alunoId)!;
  const aval = db.avaliacoes.filter((a) => a.alunoId === alunoId).sort((a, b) => b.data.localeCompare(a.data));
  const pesos = [
    ...aval.map((a) => ({ x: new Date(a.data), y: a.pesoKg })),
    ...db.consultas.filter((c) => c.alunoId === alunoId && c.pesoKg).map((c) => ({ x: new Date(c.data), y: c.pesoKg! })),
  ];
  const gordura = aval.filter((a) => a.gorduraPct != null).map((a) => ({ x: new Date(a.data), y: a.gorduraPct! }));
  const ultima = aval[0];
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Cartao titulo="Peso"><GraficoLinha pontos={pesos} unidade="kg" menorEhMelhor={a.objetivo === "emagrecimento"} /></Cartao>
      <Cartao titulo="Gordura corporal"><GraficoLinha pontos={gordura} unidade="%" menorEhMelhor /></Cartao>
      <Cartao titulo="Avaliações físicas" className="sm:col-span-2">
        {!aval.length ? <Vazio>Nenhuma avaliação física ainda.</Vazio> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-zinc-500"><tr><th className="py-2">Data</th><th>Peso</th><th>IMC</th><th>Gordura</th><th>Cintura</th><th>Quadril</th><th>Braço</th><th>Coxa</th></tr></thead>
              <tbody>
                {aval.map((a) => (
                  <tr key={a.id} className="border-t border-zinc-100">
                    <td className="py-2">{formatarData(a.data)}</td><td>{a.pesoKg} kg</td><td>{imc(a.pesoKg, a.alturaCm)}</td>
                    <td>{a.gorduraPct != null ? `${a.gorduraPct}%` : "—"}</td><td>{a.cinturaCm ?? "—"}</td><td>{a.quadrilCm ?? "—"}</td><td>{a.bracoCm ?? "—"}</td><td>{a.coxaCm ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {ultima?.observacoes && <p className="mt-2 text-sm text-zinc-600">Obs.: {ultima.observacoes}</p>}
          </div>
        )}
      </Cartao>
    </div>
  );
}

export function EvolucaoCargas({ db, alunoId }: { db: BancoDados; alunoId: string }) {
  const regs = db.registrosCarga.filter((r) => r.alunoId === alunoId);
  const exercicios = [...new Set(regs.map((r) => r.exercicio))];
  const [ex, setEx] = useState<string>("");
  const atual = ex || exercicios[0];
  return (
    <Cartao titulo="Evolução de carga" acao={exercicios.length > 1 && (
      <select className={`${estiloInput} w-auto`} value={atual} onChange={(e) => setEx(e.target.value)}>
        {exercicios.map((e) => <option key={e}>{e}</option>)}
      </select>
    )}>
      {!exercicios.length ? <Vazio>Nenhuma carga registrada ainda.</Vazio> : (
        <GraficoLinha pontos={regs.filter((r) => r.exercicio === atual).map((r) => ({ x: new Date(r.data), y: r.cargaKg }))} unidade="kg" />
      )}
    </Cartao>
  );
}

export function TreinoVisual({ treino }: { treino?: Treino }) {
  if (!treino) return <Vazio>Nenhum treino ativo.</Vazio>;
  return (
    <div className="space-y-3">
      <p className="text-xs text-zinc-500">Criado em {formatarData(treino.criadoEm)}</p>
      {treino.divisoes.map((d) => (
        <div key={d.nome}>
          <p className="font-medium">{d.nome}</p>
          <ul className="mt-1 divide-y divide-zinc-100 text-sm">
            {d.exercicios.map((e, i) => (
              <li key={i} className="flex justify-between py-1.5">
                <span>{e.exercicio}</span>
                <span className="text-zinc-500">{e.series}×{e.repeticoes}{e.cargaKg ? ` · ${e.cargaKg} kg` : ""}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function PlanoAlimentarVisual({ plano }: { plano?: PlanoAlimentar }) {
  if (!plano) return <Vazio>Nenhum plano alimentar ativo.</Vazio>;
  return (
    <div>
      <p className="text-sm text-zinc-600">Meta: <strong>{plano.metaKcal} kcal</strong>{plano.proteinaG ? ` · ${plano.proteinaG} g de proteína` : ""} · desde {formatarData(plano.criadoEm)}</p>
      <ul className="mt-3 space-y-2">
        {plano.refeicoes.map((r, i) => (
          <li key={i} className="rounded-xl bg-zinc-50 p-3 text-sm">
            <p className="font-medium">{r.horario} · {r.nome}</p>
            <p className="text-zinc-600">{r.itens}</p>
          </li>
        ))}
      </ul>
      {plano.orientacoes && <p className="mt-3 text-sm text-zinc-600"><strong>Orientações:</strong> {plano.orientacoes}</p>}
    </div>
  );
}

export function HistoricoConsultas({ db, alunoId }: { db: BancoDados; alunoId: string }) {
  const cs = db.consultas.filter((c) => c.alunoId === alunoId).sort((a, b) => b.data.localeCompare(a.data));
  if (!cs.length) return <Vazio>Nenhuma consulta registrada.</Vazio>;
  return (
    <ul className="space-y-2 text-sm">
      {cs.map((c) => (
        <li key={c.id} className="rounded-lg border border-zinc-100 p-3">
          <p className="font-medium">{formatarData(c.data)}{c.pesoKg ? ` · ${c.pesoKg} kg` : ""}{c.adesao ? ` · adesão ${c.adesao}/5` : ""}</p>
          <p className="text-zinc-600">{c.anotacoes}</p>
          {c.proximoRetorno && <p className="text-xs text-zinc-500">Retorno: {formatarData(c.proximoRetorno)}</p>}
        </li>
      ))}
    </ul>
  );
}
