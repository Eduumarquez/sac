"use client";

import { CalendarClock, ClipboardList, Users } from "lucide-react";
import { useBanco } from "@/lib/db";
import { dataISO, formatarData } from "@/lib/datas";
import { CabecalhoPagina, Carregando, Etiqueta, Indicador, Vazio } from "@/components/ui";
import { SeletorPessoa, usePessoaSelecionada } from "@/components/SeletorPessoa";
import { ListaCarteira } from "@/components/ListaCarteira";

export default function AreaNutricionista() {
  const db = useBanco();
  const nutris = db?.profissionais.filter((p) => p.papel === "nutricionista") ?? [];
  const eu = usePessoaSelecionada(nutris, "nutricionista");
  if (!db) return <Carregando />;
  const hoje = dataISO(new Date());
  const em7 = dataISO(new Date(Date.now() + 7 * 86_400_000));
  const meus = db.alunos.filter((a) => a.status === "ativo" && a.nutricionistaId === eu).map((a) => {
    const consultas = db.consultas.filter((c) => c.alunoId === a.id).sort((x, y) => y.data.localeCompare(x.data));
    const plano = db.planosAlimentares.find((p) => p.alunoId === a.id && p.ativo);
    const retorno = consultas[0]?.proximoRetorno;
    const pend: string[] = [];
    if (!consultas.length) pend.push("1ª consulta");
    if (!plano) pend.push("Montar plano alimentar");
    const atrasado = !!retorno && retorno < hoje;
    return { a, ultima: consultas[0], plano, retorno, pend, atrasado, estaSemana: !!retorno && retorno >= hoje && retorno <= em7 };
  }).sort((x, y) => Number(y.atrasado) - Number(x.atrasado) || y.pend.length - x.pend.length || (x.retorno ?? "9").localeCompare(y.retorno ?? "9"));
  const nomeEu = nutris.find((p) => p.id === eu)?.nome.split(" ")[0];

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <CabecalhoPagina titulo={`Olá, ${nomeEu}`} subtitulo="Seus pacientes, retornos e planos alimentares" acao={<SeletorPessoa opcoes={nutris} tipo="nutricionista" rotulo="Entrar como" />} />

      <div className="mb-6 grid grid-cols-3 gap-3">
        <Indicador rotulo="Pacientes" valor={meus.length} icone={<Users size={18} />} />
        <Indicador rotulo="Retornos em 7 dias" valor={meus.filter((m) => m.estaSemana).length} icone={<CalendarClock size={18} />} />
        <Indicador rotulo="Pendências" valor={meus.filter((m) => m.pend.length || m.atrasado).length} icone={<ClipboardList size={18} />} destaque={meus.some((m) => m.atrasado) ? "vermelho" : undefined} />
      </div>

      <ListaCarteira
        vazio={<Vazio>Nenhum paciente ainda. Alunos dos planos com nutricionista aparecem aqui após a matrícula.</Vazio>}
        itens={meus.map(({ a, ultima, plano, retorno, pend, atrasado, estaSemana }) => ({
          id: a.id, nome: a.nome, href: `/nutricionista/aluno/?id=${a.id}`,
          urgente: atrasado || pend.length > 0 || estaSemana,
          linha: ultima ? `Última consulta em ${formatarData(ultima.data)}${ultima.pesoKg ? ` · ${ultima.pesoKg} kg` : ""}${plano ? ` · ${plano.metaKcal} kcal` : ""}` : "Ainda sem consulta",
          etiquetas: (
            <>
              {atrasado && <Etiqueta cor="vermelho">Retorno atrasado ({formatarData(retorno!)})</Etiqueta>}
              {estaSemana && <Etiqueta cor="azul">Retorno em {formatarData(retorno!)}</Etiqueta>}
              {pend.map((p) => <Etiqueta key={p} cor="amarelo">{p}</Etiqueta>)}
            </>
          ),
        }))}
      />
    </main>
  );
}
