import { describe, expect, it } from "vitest";
import { criarBancoDemo } from "../seed";
import { acharConta, podeAbrir, type Sessao } from "../sessao";

const aluno: Sessao = { papel: "aluno", id: "a1", nome: "Mariana" };
const personal: Sessao = { papel: "personal", id: "p-pers1", nome: "Lucas" };

describe("acesso por perfil", () => {
  it("aluno só abre o app dele", () => {
    expect(podeAbrir(aluno, "/aluno/")).toBe(true);
    expect(podeAbrir(aluno, "/painel/")).toBe(false);
    expect(podeAbrir(aluno, "/personal/aluno")).toBe(false);
  });
  it("personal não vê o painel nem o app do aluno", () => {
    expect(podeAbrir(personal, "/personal/aluno/")).toBe(true);
    expect(podeAbrir(personal, "/painel/")).toBe(false);
    expect(podeAbrir(personal, "/aluno/")).toBe(false);
  });
  it("sem login só as páginas públicas", () => {
    expect(podeAbrir(null, "/")).toBe(true);
    expect(podeAbrir(null, "/matricula")).toBe(true);
    expect(podeAbrir(null, "/recepcao/")).toBe(false);
  });
  it("demonstração abre tudo e as contas de teste existem", () => {
    expect(podeAbrir({ papel: "demo", nome: "Demo" }, "/fisioterapia/")).toBe(true);
    const db = criarBancoDemo();
    expect(acharConta(db, "Eduardo@novaera.com")?.sessao.papel).toBe("dono");
    expect(acharConta(db, "lucas@novaera.com")?.sessao.id).toBe("p-pers1");
    expect(acharConta(db, "ninguem@x.com")).toBeUndefined();
  });
});
