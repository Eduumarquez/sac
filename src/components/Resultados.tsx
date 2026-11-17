"use client";

import { BarChart3, HeartHandshake, Repeat, Smile, Wallet } from "lucide-react";
import type { BancoDados } from "@/lib/tipos";
import { riscoDoAluno, statusCobranca } from "@/lib/regras";
import { DIA_MS, formatarDinheiro } from "@/lib/datas";
import { BarraHorizontal, Cartao, GraficoBarras, Indicador } from "./ui";
import { emojiSensacao } from "./equipe";

const pct = (n: number) => `${Math.round(n * 100)}%`;
const um = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 1 });

/** Números do negócio: receita recorrente, frequência, risco e o efeito dos contatos de retenção. */
export function Resultados({ db }: { db: BancoDados }) {
  const hoje = new Date();
  const ativos = db.alunos.filter((a) => a.status === "ativo");
  const plano = (id: string) => db.planos.find((p) => p.id === id);
  const mrr = ativos.reduce((s, a) => { const p = plano(a.planoId); return s + (p ? p.valorCentavos / p.periodicidadeMeses : 0); }, 0);
  const atraso = db.cobrancas.filter((c) => statusCobranca(c, hoje) === "atrasado").reduce((s, c) => s + c.valorCentavos, 0);

  // check-ins por semana (8 semanas, a última é a atual)
  const semanas = Array.from({ length: 8 }, (_, i) => {
    const fim = hoje.getTime() - (7 - i) * 7 * DIA_MS;
    const ini = fim - 7 * DIA_MS;
    const valor = db.checkins.filter((c) => { const t = new Date(c.data).getTime(); return t > ini && t <= fim; }).length;
    return { rotulo: i === 7 ? "Esta" : new Date(ini + DIA_MS).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }), valor };
  });
  const ultimas4 = semanas.slice(4).reduce((s, x) => s + x.valor, 0);
  const freqMedia = ativos.length ? ultimas4 / 4 / ativos.length : 0;

  const riscos = ativos.map((a) => riscoDoAluno(db, a.id, hoje).nivel);
  const nivel = (n: string) => riscos.filter((r) => r === n).length;

  // contatos de retenção nos últimos 30 dias e quantos voltaram a treinar depois
  const contatos30 = db.contatos.filter((c) => hoje.getTime() - new Date(c.data).getTime() <= 30 * DIA_MS);
  const voltaram = new Set(contatos30.filter((c) => db.checkins.some((k) => k.alunoId === c.alunoId && k.data > c.data)).map((c) => c.alunoId));
  const contatados = new Set(contatos30.map((c) => c.alunoId));

  const fb30 = db.feedbacks.filter((f) => hoje.getTime() - new Date(f.data).getTime() <= 30 * DIA_MS);
  const mediaFb = fb30.length ? fb30.reduce((s, f) => s + f.sensacao, 0) / fb30.length : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Indicador rotulo="Receita recorrente" valor={formatarDinheiro(mrr)} detalhe="por mês, alunos ativos" icone={<Wallet size={18} />} />
        <Indicador rotulo="Ticket médio" valor={formatarDinheiro(ativos.length ? mrr / ativos.length : 0)} detalhe={`${ativos.length} alunos ativos`} icone={<BarChart3 size={18} />} />
        <Indicador rotulo="Frequência média" valor={`${um(freqMedia)}x`} detalhe="treinos por aluno na semana" icone={<Repeat size={18} />} />
        <Indicador rotulo="Inadimplência" valor={pct(mrr ? atraso / mrr : 0)} detalhe={`${formatarDinheiro(atraso)} em atraso`} icone={<Wallet size={18} />} destaque={atraso ? "vermelho" : undefined} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Cartao titulo="Treinos por semana" className="lg:col-span-2">
          <GraficoBarras dados={semanas} />
          <p className="mt-2 text-xs text-zinc-400">Check-ins de todos os alunos. A última barra é a semana atual, ainda em andamento.</p>
        </Cartao>
        <Cartao titulo="Saúde da base">
          <div className="space-y-3">
            <BarraHorizontal rotulo="Engajados" valor={nivel("baixo")} total={ativos.length} cor="bg-emerald-500" />
            <BarraHorizontal rotulo="Atenção" valor={nivel("medio")} total={ativos.length} cor="bg-amber-400" />
            <BarraHorizontal rotulo="Risco alto" valor={nivel("alto")} total={ativos.length} cor="bg-red-500" />
          </div>
        </Cartao>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Cartao titulo="Retenção em ação" icone={<HeartHandshake size={18} />}>
          <p className="text-3xl font-bold">{voltaram.size}<span className="text-base font-normal text-zinc-500"> de {contatados.size}</span></p>
          <p className="mt-1 text-sm text-zinc-500">alunos contatados nos últimos 30 dias voltaram a treinar depois do contato.</p>
          {!contatados.size && <p className="mt-2 text-sm text-zinc-500">Use a Lista do dia para começar a medir.</p>}
        </Cartao>
        <Cartao titulo="Como os alunos avaliam os treinos" icone={<Smile size={18} />}>
          {fb30.length ? (
            <>
              <p className="text-3xl font-bold">{emojiSensacao(Math.round(mediaFb))} {um(mediaFb)}<span className="text-base font-normal text-zinc-500"> / 5</span></p>
              <p className="mt-1 text-sm text-zinc-500">{fb30.length} avaliações nos últimos 30 dias, {fb30.filter((f) => f.sensacao <= 2).length} negativas.</p>
            </>
          ) : <p className="text-sm text-zinc-500">Ainda sem avaliações. Os alunos avaliam pelo app ao terminar o treino.</p>}
        </Cartao>
        <Cartao titulo="Alunos por plano">
          <div className="space-y-3">
            {db.planos.map((p) => {
              const n = ativos.filter((a) => a.planoId === p.id).length;
              return <BarraHorizontal key={p.id} rotulo={p.nome} valor={n} total={ativos.length} />;
            })}
          </div>
        </Cartao>
      </div>
    </div>
  );
}
