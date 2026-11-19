import { describe, expect, it } from "vitest";
import { HORARIOS, OPCOES_KCAL, separarItens, separarOrientacoes, somaDoDia } from "../alimentos";
import { criarBancoDemo } from "../seed";

describe("plano alimentar por escolhas", () => {
  it("horários de meia em meia hora e metas de 100 em 100", () => {
    expect(HORARIOS[0]).toBe("05:00");
    expect(HORARIOS.at(-1)).toBe("23:30");
    expect(OPCOES_KCAL[0]).toBe(1200);
    expect(OPCOES_KCAL.at(-1)).toBe(4000);
  });
  it("separa itens e orientações", () => {
    expect(separarItens("2 ovos mexidos, 1 banana")).toEqual(["2 ovos mexidos", "1 banana"]);
    expect(separarOrientacoes("Beber água. Não pular refeições.")).toEqual(["Beber água.", "Não pular refeições."]);
  });
  it("todos os alimentos do plano de exemplo existem no catálogo", () => {
    const plano = criarBancoDemo().planosAlimentares[0];
    const soma = somaDoDia(plano.refeicoes);
    expect(soma.kcal).toBeGreaterThan(1000);
    expect(soma.proteinaG).toBeGreaterThan(60);
  });
});
