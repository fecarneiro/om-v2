import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "../db/client.js";
import { seed } from "../db/seed.js";
import { buscarProdutos } from "./produtos.service.js";

beforeAll(async () => {
  await seed(db);
});

afterAll(async () => {
  await db.$client.end();
});

describe("buscarProdutos", () => {
  it("ignora acentos", async () => {
    const produtos = await buscarProdutos(db, "C001", "acucar");

    expect(produtos.map((produto) => produto.descricao)).toEqual(["Açúcar Cristal 1kg"]);
  });

  it("encontra palavras em qualquer ordem", async () => {
    const produtos = await buscarProdutos(db, "C001", "tipo arroz");

    expect(produtos.map((produto) => produto.id)).toEqual(["P001"]);
  });

  it("busca pelo começo do EAN quando só há dígitos", async () => {
    const produtos = await buscarProdutos(db, "C001", "7891958");

    expect(produtos.map((produto) => produto.id)).toEqual(["P001"]);
  });

  it("usa o preço da tabela do cliente e a tabela padrão quando ele não tem uma", async () => {
    const [tabelaPadrao] = await buscarProdutos(db, "C001", "arroz");
    const [tabelaPropria] = await buscarProdutos(db, "C002", "arroz");
    const [semTabela] = await buscarProdutos(db, "C004", "arroz");

    expect(tabelaPadrao).toMatchObject({ disponivel: true, preco_unidade: "26.90" });
    expect(tabelaPropria).toMatchObject({ disponivel: true, preco_unidade: "25.29" });
    expect(semTabela).toMatchObject({ disponivel: true, preco_unidade: "26.90" });
  });

  it("mostra produto inativo como indisponível", async () => {
    const produtos = await buscarProdutos(db, "C002", "refri");

    expect(produtos.find((produto) => produto.id === "P021")).toMatchObject({
      disponivel: false,
      motivo: "produto_inativo",
    });
  });

  it("trata % e _ como texto, não como curingas do ILIKE", async () => {
    expect(await buscarProdutos(db, "C001", "%")).toEqual([]);
    expect(await buscarProdutos(db, "C001", "_")).toEqual([]);
  });
});
