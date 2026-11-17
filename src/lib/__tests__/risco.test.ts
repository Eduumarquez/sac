import { describe, expect, it } from "vitest";
import { calcularRisco } from "../risco";

const hoje = new Date("2026-11-12T12:00:00Z");
const diasAtras = (n: number) => new Date(hoje.getTime() - n * 86_400_000);

describe("calcularRisco", () => {
  it("aluno assíduo, antigo e em dia tem risco baixo", () => {
    const r = calcularRisco(
      {
        matriculadoEm: diasAtras(300),
        checkins: [1, 3, 5, 8, 10, 12, 15, 17, 19, 22, 24, 26, 29, 31, 33, 36, 38, 40].map(diasAtras),
        diasAtrasoPagamento: 0,
        treinoAtualCriadoEm: diasAtras(20),
      },
      hoje,
    );
    expect(r.nivel).toBe("baixo");
    expect(r.motivos).toEqual([]);
  });

  it("aluno sumido há 2 semanas com frequência em queda tem risco alto", () => {
    const r = calcularRisco(
      {
        matriculadoEm: diasAtras(200),
        checkins: [16, 18, 20, 22, 25, 27, 30, 33].map(diasAtras),
        diasAtrasoPagamento: 0,
        treinoAtualCriadoEm: diasAtras(30),
      },
      hoje,
    );
    expect(r.nivel).toBe("alto");
    expect(r.motivos.join()).toContain("dias sem treinar");
    expect(r.motivos.join()).toContain("frequência caiu");
  });

  it("pontuação nunca passa de 100", () => {
    const r = calcularRisco(
      { matriculadoEm: diasAtras(30), checkins: [], diasAtrasoPagamento: 40, treinoAtualCriadoEm: null },
      hoje,
    );
    expect(r.pontuacao).toBeLessThanOrEqual(100);
  });

  it("dois treinos ruins seguidos viram motivo de risco", () => {
    const base = {
      matriculadoEm: diasAtras(300),
      checkins: [1, 3, 5, 8, 10, 12, 15, 17, 19, 22, 24, 26, 29, 31, 33, 36, 38, 40].map(diasAtras),
      diasAtrasoPagamento: 0,
      treinoAtualCriadoEm: diasAtras(20),
    };
    expect(calcularRisco({ ...base, sensacoesRecentes: [1, 2, 5] }, hoje).motivos).toContain("não está gostando dos treinos");
    expect(calcularRisco({ ...base, sensacoesRecentes: [2, 4] }, hoje).motivos).not.toContain("não está gostando dos treinos");
    expect(calcularRisco({ ...base, sensacoesRecentes: [1] }, hoje).motivos).toEqual([]);
  });
});
