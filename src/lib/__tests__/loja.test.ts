import { describe, expect, it } from "vitest";
import { criarBancoDemo } from "../seed";
import { comprar, foraDaReferencia, resumoLoja, saldoSessoes } from "../regras";

const hoje = new Date("2026-11-12T12:00:00");

describe("loja, pacotes e saúde", () => {
  it("compra baixa estoque, registra venda e cria crédito de sessões com o personal do aluno", () => {
    const db = criarBancoDemo(hoje);
    const depois = comprar(db, "a1", [{ produtoId: "pr-whey", qtd: 2 }, { produtoId: "pr-pac-pers4", qtd: 1 }], "app", hoje);
    expect(depois.produtos.find((p) => p.id === "pr-whey")!.estoque).toBe(10);
    const venda = depois.vendas.at(-1)!;
    expect(venda.totalCentavos).toBe(2 * 18990 + 39600);
    const cred = depois.creditos.filter((c) => c.alunoId === "a1");
    expect(cred).toHaveLength(1);
    expect(cred[0].profissionalId).toBe("p-pers1");
    expect(saldoSessoes(cred[0])).toBe(4);
  });

  it("recusa compra sem estoque", () => {
    const db = criarBancoDemo(hoje);
    expect(() => comprar(db, "a1", [{ produtoId: "pr-luva", qtd: 3 }], "app", hoje)).toThrow(/estoque/);
  });

  it("separa a comissão dos profissionais da receita da academia", () => {
    const db = { ...criarBancoDemo(hoje), vendas: [] };
    const r = resumoLoja(comprar(db, "a1", [{ produtoId: "pr-pac-pers10", qtd: 1 }, { produtoId: "pr-toalha", qtd: 1 }], "app", hoje), new Date("2026-11-01"));
    expect(r.total).toBe(90000 + 3990);
    expect(r.comissaoProfissionais).toBe(63000);
    expect(r.academia).toBe(27000 + 3990);
  });

  it("marca exames fora da referência", () => {
    expect(foraDaReferencia({ marcador: "Glicose", valor: 104, unidade: "mg/dL", refMin: 70, refMax: 99 })).toBe("alto");
    expect(foraDaReferencia({ marcador: "Vitamina D", valor: 22, unidade: "ng/mL", refMin: 30 })).toBe("baixo");
    expect(foraDaReferencia({ marcador: "HDL", valor: 52, unidade: "mg/dL", refMin: 40 })).toBeNull();
  });
});
