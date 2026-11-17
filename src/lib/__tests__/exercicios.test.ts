import { describe, expect, it } from "vitest";
import { criarBancoDemo } from "../seed";
import { EXERCICIOS, TREINOS_FORA } from "../exercicios";

describe("biblioteca de exercícios", () => {
  it("cobre todos os exercícios dos treinos de exemplo e dos treinos fora da academia", () => {
    const nomes = [
      ...criarBancoDemo().treinos.flatMap((t) => t.divisoes.flatMap((d) => d.exercicios.map((e) => e.exercicio))),
      ...TREINOS_FORA.flatMap((t) => t.divisao.exercicios.map((e) => e.exercicio)),
    ];
    for (const n of nomes) expect(EXERCICIOS[n], n).toBeDefined();
  });
  it("toda alternativa existe na biblioteca e não aponta para si mesma", () => {
    for (const [nome, info] of Object.entries(EXERCICIOS)) {
      for (const alt of info.alternativas) {
        expect(EXERCICIOS[alt], `${nome} -> ${alt}`).toBeDefined();
        expect(alt).not.toBe(nome);
      }
    }
  });
});
