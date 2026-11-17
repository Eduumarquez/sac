import { describe, expect, it } from "vitest";
import { criarBancoDemo } from "../seed";
import { dinheiroSalvo, etapaDaRegua, lembretesDeHoje, progressoMeta, regraDeAcesso, valorMensal } from "../regras";

const hoje = new Date("2026-11-12T12:00:00");

describe("integrações da pesquisa", () => {
  it("valor mensal divide plano anual e zera agregador", () => {
    const db = criarBancoDemo(hoje);
    expect(valorMensal(db, { planoId: "pl-anual" })).toBe(22492);
    expect(valorMensal(db, { planoId: "pl-wellhub" })).toBe(0);
  });

  it("dinheiro salvo conta contato com volta ao treino e cancelamento revertido, uma vez por aluno", () => {
    const db = criarBancoDemo(hoje);
    const r = dinheiroSalvo(db, hoje);
    expect(r.itens.map((i) => i.alunoId).sort()).toEqual(["a2", "a5"]);
    expect(r.itens.find((i) => i.alunoId === "a5")!.como).toBe("cancelamento");
    expect(r.totalMensalCentavos).toBe(17990 * 2);
  });

  it("catraca bloqueia atraso acima de 15 dias e plano pausado", () => {
    const db = criarBancoDemo(hoje);
    expect(regraDeAcesso(db, "a3", hoje).liberado).toBe(true);
    const r = regraDeAcesso(db, "a4", hoje);
    expect(r.liberado).toBe(false);
    expect(r.motivo).toMatch(/atrasada/);
    const pausado = { ...db, alunos: db.alunos.map((a) => (a.id === "a3" ? { ...a, pausadoAte: "2026-12-01" } : a)) };
    expect(regraDeAcesso(pausado, "a3", hoje).motivo).toMatch(/pausado/);
  });

  it("régua de cobrança escolhe a etapa e não repete lembrete enviado", () => {
    const c = { id: "c1", alunoId: "a1", valorCentavos: 100, vencimento: "2026-11-14", status: "pendente" as const };
    expect(etapaDaRegua(c, hoje)).toBe("antes");
    expect(etapaDaRegua({ ...c, vencimento: "2026-11-12" }, hoje)).toBe("no_dia");
    expect(etapaDaRegua({ ...c, vencimento: "2026-11-01" }, hoje)).toBe("7_dias");
    expect(etapaDaRegua({ ...c, vencimento: "2026-11-11" }, hoje)).toBeNull();
    const db = { ...criarBancoDemo(hoje), cobrancas: [c] };
    expect(lembretesDeHoje(db, hoje)).toHaveLength(1);
    expect(lembretesDeHoje({ ...db, lembretes: [{ id: "l", cobrancaId: "c1", etapa: "antes", data: "x" }] }, hoje)).toHaveLength(0);
  });

  it("progresso da meta usa a última medida", () => {
    const db = criarBancoDemo(hoje);
    const p = progressoMeta(db, db.metas.find((m) => m.alunoId === "a1")!);
    expect(p.atual).toBe(79.1);
    expect(p.progresso).toBeCloseTo((82.4 - 79.1) / (82.4 - 75), 2);
  });
});
