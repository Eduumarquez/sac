"use client";

import { useState } from "react";
import { alterar, useBanco } from "@/lib/db";
import { sequenciaSemanas, statusCobranca } from "@/lib/regras";
import { formatarData, formatarDinheiro, isoAgora, novoId } from "@/lib/datas";
import { Abas, Botao, Cartao, Carregando, Etiqueta, GraficoLinha, Indicador, Vazio, estiloInput } from "@/components/ui";
import { EvolucaoCargas, PlanoAlimentarVisual } from "@/components/aluno";
import { SeletorPessoa, usePessoaSelecionada } from "@/components/SeletorPessoa";

type Aba = "treino" | "dieta" | "evolucao" | "conta";

export default function AppAluno() {
  const db = useBanco();
  const alunos = db?.alunos.filter((a) => a.status === "ativo") ?? [];
  const id = usePessoaSelecionada(alunos, "aluno");
  const [aba, setAba] = useState<Aba>("treino");
  const [divisao, setDivisao] = useState(0);
  const [cargas, setCargas] = useState<Record<string, string>>({});
  const [salvo, setSalvo] = useState<string | null>(null);

  if (!db) return <Carregando />;
  const aluno = db.alunos.find((a) => a.id === id);
  if (!aluno) return <main className="mx-auto max-w-md px-4 py-8"><Vazio>Nenhum aluno ativo.</Vazio></main>;

  const hojeStr = new Date().toISOString().slice(0, 10);
  const meusCheckins = db.checkins.filter((c) => c.alunoId === aluno.id);
  const fezCheckin = meusCheckins.some((c) => c.data.slice(0, 10) === hojeStr);
  const seq = sequenciaSemanas(meusCheckins.map((c) => new Date(c.data)));
  const treino = db.treinos.find((t) => t.alunoId === aluno.id && t.ativo);
  const div = treino?.divisoes[Math.min(divisao, (treino?.divisoes.length ?? 1) - 1)];
  const personal = db.profissionais.find((p) => p.id === aluno.personalId);
  const nutri = db.profissionais.find((p) => p.id === aluno.nutricionistaId);
  const retorno = db.consultas.filter((c) => c.alunoId === aluno.id).sort((a, b) => b.data.localeCompare(a.data))[0]?.proximoRetorno;
  const pesos = [
    ...db.avaliacoes.filter((a) => a.alunoId === aluno.id).map((a) => ({ x: new Date(a.data), y: a.pesoKg })),
    ...db.consultas.filter((c) => c.alunoId === aluno.id && c.pesoKg).map((c) => ({ x: new Date(c.data), y: c.pesoKg! })),
  ];

  function checkin() {
    alterar((d) => ({ ...d, checkins: [...d.checkins, { id: novoId(), alunoId: aluno!.id, data: isoAgora() }] }));
  }
  function registrar(exercicio: string) {
    const valor = Number((cargas[exercicio] ?? "").replace(",", "."));
    if (!valor) return;
    alterar((d) => ({ ...d, registrosCarga: [...d.registrosCarga, { id: novoId(), alunoId: aluno!.id, exercicio, cargaKg: valor, repeticoes: 0, data: isoAgora() }] }));
    setSalvo(exercicio);
    setTimeout(() => setSalvo(null), 1500);
  }

  return (
    <main className="mx-auto max-w-md space-y-4 px-4 py-6">
      <SeletorPessoa opcoes={alunos} tipo="aluno" rotulo="Entrar como" />
      <div>
        <h1 className="text-2xl font-bold">Olá, {aluno.nome.split(" ")[0]}!</h1>
        <p className="text-sm text-zinc-600">{personal ? `Personal: ${personal.nome}` : "Treino com o professor do salão"}{nutri ? ` · Nutri: ${nutri.nome}` : ""}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Indicador rotulo="Sequência" valor={`${seq} sem.`} detalhe="semanas com 2+ treinos" />
        <Indicador rotulo="Treinos no total" valor={meusCheckins.length} />
      </div>

      <Botao className="w-full py-3 text-base" disabled={fezCheckin} onClick={checkin}>
        {fezCheckin ? "✓ Check-in feito hoje" : "Fazer check-in"}
      </Botao>

      <Abas<Aba> atual={aba} aoTrocar={setAba} abas={[{ id: "treino", rotulo: "Treino" }, { id: "dieta", rotulo: "Dieta" }, { id: "evolucao", rotulo: "Evolução" }, { id: "conta", rotulo: "Conta" }]} />

      {aba === "treino" && (
        !treino ? <Vazio>Seu treino ainda está sendo montado pelo seu personal.</Vazio> : (
          <Cartao>
            <div className="mb-3 flex gap-1 overflow-x-auto">
              {treino.divisoes.map((d, i) => (
                <button key={d.nome} onClick={() => setDivisao(i)} className={`whitespace-nowrap rounded-full border px-3 py-1 text-sm ${i === divisao ? "border-teal-700 bg-teal-50 text-teal-800" : "border-zinc-300"}`}>{d.nome}</button>
              ))}
            </div>
            <ul className="divide-y divide-zinc-100">
              {div?.exercicios.map((e) => {
                const ultima = db.registrosCarga.filter((r) => r.alunoId === aluno.id && r.exercicio === e.exercicio).sort((a, b) => b.data.localeCompare(a.data))[0];
                return (
                  <li key={e.exercicio} className="py-3">
                    <div className="flex justify-between gap-2">
                      <p className="font-medium">{e.exercicio}</p>
                      <p className="text-sm text-zinc-500">{e.series}×{e.repeticoes}</p>
                    </div>
                    {e.cargaKg != null && (
                      <div className="mt-2 flex items-center gap-2">
                        <input className={`${estiloInput} w-24`} inputMode="decimal" placeholder={String(ultima?.cargaKg ?? e.cargaKg)} value={cargas[e.exercicio] ?? ""} onChange={(ev) => setCargas({ ...cargas, [e.exercicio]: ev.target.value })} />
                        <span className="text-sm text-zinc-500">kg</span>
                        <Botao variante="secundario" onClick={() => registrar(e.exercicio)}>{salvo === e.exercicio ? "✓ Salvo" : "Registrar"}</Botao>
                      </div>
                    )}
                    {ultima && <p className="mt-1 text-xs text-zinc-500">Última: {ultima.cargaKg} kg em {formatarData(ultima.data)}</p>}
                  </li>
                );
              })}
            </ul>
          </Cartao>
        )
      )}

      {aba === "dieta" && (
        <Cartao titulo="Meu plano alimentar">
          {nutri ? <PlanoAlimentarVisual plano={db.planosAlimentares.find((p) => p.alunoId === aluno.id && p.ativo)} /> : <Vazio>Seu plano não inclui nutricionista. Fale com a recepção para fazer upgrade.</Vazio>}
          {retorno && <p className="mt-3 text-sm">📅 Próxima consulta: <strong>{formatarData(retorno)}</strong></p>}
        </Cartao>
      )}

      {aba === "evolucao" && (
        <>
          <Cartao titulo="Meu peso"><GraficoLinha pontos={pesos} unidade="kg" /></Cartao>
          <EvolucaoCargas db={db} alunoId={aluno.id} />
        </>
      )}

      {aba === "conta" && (
        <Cartao titulo="Mensalidades">
          <ul className="divide-y divide-zinc-100 text-sm">
            {db.cobrancas.filter((c) => c.alunoId === aluno.id).sort((a, b) => b.vencimento.localeCompare(a.vencimento)).slice(0, 6).map((c) => {
              const s = statusCobranca(c);
              return (
                <li key={c.id} className="flex items-center justify-between py-2">
                  <span>{formatarData(c.vencimento)} · {formatarDinheiro(c.valorCentavos)}</span>
                  {s === "pago" ? <Etiqueta cor="verde">pago</Etiqueta> : s === "atrasado" ? <Etiqueta cor="vermelho">atrasado</Etiqueta> : <Etiqueta>a vencer</Etiqueta>}
                </li>
              );
            })}
          </ul>
        </Cartao>
      )}
    </main>
  );
}
