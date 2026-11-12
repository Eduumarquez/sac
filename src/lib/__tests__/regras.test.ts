import { describe, expect, it } from "vitest";
import { criarBancoDemo } from "../seed";
import { gerarCobrancas, imc, precisaAtestado, profissionalMenosOcupado, riscoDoAluno, sequenciaSemanas, statusCobranca } from "../regras";

const hoje = new Date("2026-11-12T12:00:00Z");

describe("regras de negócio", () => {
  it("atribui o personal com menos alunos ativos", () => {
    const db = criarBancoDemo(hoje);
    const p = profissionalMenosOcupado(db, "personal")!;
    const carga = (id: string) => db.alunos.filter((a) => a.personalId === id).length;
    const outros = db.profissionais.filter((x) => x.papel === "personal" && x.id !== p.id);
    outros.forEach((o) => expect(carga(p.id)).toBeLessThanOrEqual(carga(o.id)));
  });

  it("gera 12 mensalidades no plano mensal e 1 no anual", () => {
    const db = criarBancoDemo(hoje);
    const aluno = db.alunos[0];
    expect(gerarCobrancas(aluno, db.planos.find((p) => p.id === "pl-basico")!, hoje)).toHaveLength(12);
    expect(gerarCobrancas(aluno, db.planos.find((p) => p.id === "pl-anual")!, hoje)).toHaveLength(1);
  });

  it("marca como atrasada cobrança pendente vencida", () => {
    expect(statusCobranca({ id: "x", alunoId: "a", valorCentavos: 1, vencimento: "2026-11-01", status: "pendente" }, hoje)).toBe("atrasado");
    expect(statusCobranca({ id: "x", alunoId: "a", valorCentavos: 1, vencimento: "2026-12-01", status: "pendente" }, hoje)).toBe("pendente");
  });

  it("pede atestado quando alguma resposta do PAR-Q é sim", () => {
    expect(precisaAtestado({ cardiaco: false, osseo: true })).toBe(true);
    expect(precisaAtestado({ cardiaco: false })).toBe(false);
  });

  it("aluno sumido do banco demo aparece com risco alto", () => {
    const db = criarBancoDemo(hoje);
    expect(riscoDoAluno(db, "a1", hoje).nivel).toBe("alto"); // 16 dias sem treinar
    expect(riscoDoAluno(db, "a3", hoje).nivel).toBe("baixo"); // treina toda semana
  });

  it("conta semanas seguidas com 2+ treinos", () => {
    const d = (n: number) => new Date(hoje.getTime() - n * 86_400_000);
    expect(sequenciaSemanas([d(1), d(3), d(8), d(10), d(15), d(17)], hoje)).toBe(3);
    expect(sequenciaSemanas([d(30)], hoje)).toBe(0);
  });

  it("calcula IMC com uma casa decimal", () => {
    expect(imc(80, 180)).toBe(24.7);
  });
});
