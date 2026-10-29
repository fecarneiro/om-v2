import type { ProdutoBusca } from "contracts/schemas";
import { describe, expect, it } from "vitest";
import { filtrarProdutosOffline } from "./busca-offline";

function produto(dados: Partial<ProdutoBusca>): ProdutoBusca {
  return {
    id: "P1",
    sku: "SKU-1",
    ean: "789",
    descricao: "Produto",
    categoria: null,
    marca: null,
    unidade_venda: "UN",
    fator_embalagem: 1,
    venda_somente_multiplo: false,
    ativo: true,
    disponivel: true,
    preco_unidade: "1.00",
    ...dados,
  } as ProdutoBusca;
}

const catalogo = [
  produto({
    id: "P001",
    descricao: "Arroz Branco Tipo 1 5kg",
    marca: "Grão Fino",
    sku: "SKU-1000",
    ean: "7891958224128",
  }),
  produto({
    id: "P002",
    descricao: "Feijão Carioca Tipo 1 1kg",
    marca: "Grão Fino",
    sku: "SKU-1001",
    ean: "7891249426033",
  }),
  produto({
    id: "P003",
    descricao: "Açúcar Cristal 1kg",
    marca: "Doce Vale",
    sku: "SKU-1002",
    ean: "7891133568863",
  }),
  produto({
    id: "P009",
    descricao: "Achocolatado em Pó 400g",
    marca: "Chocomix",
    sku: "SKU-1008",
    ean: "7891831978575",
  }),
];

function ids(produtos: ProdutoBusca[]) {
  return produtos.map((produto) => produto.id);
}

describe("filtrarProdutosOffline", () => {
  it("ignora acentos e maiúsculas", () => {
    expect(ids(filtrarProdutosOffline(catalogo, "ACUCAR"))).toEqual(["P003"]);
  });

  it("encontra palavras em qualquer ordem", () => {
    expect(ids(filtrarProdutosOffline(catalogo, "tipo arroz"))).toEqual(["P001"]);
  });

  it("busca também na marca e no SKU", () => {
    expect(ids(filtrarProdutosOffline(catalogo, "grao fino"))).toEqual(["P001", "P002"]);
    expect(ids(filtrarProdutosOffline(catalogo, "sku-1008"))).toEqual(["P009"]);
  });

  it("busca pelo começo do EAN quando só há dígitos", () => {
    expect(ids(filtrarProdutosOffline(catalogo, "7891958"))).toEqual(["P001"]);
    expect(filtrarProdutosOffline(catalogo, "224128")).toEqual([]);
  });

  it("ordena pela descrição", () => {
    expect(ids(filtrarProdutosOffline(catalogo, "1kg"))).toEqual(["P003", "P002"]);
  });

  it("limita a quantidade de resultados", () => {
    const muitos = Array.from({ length: 30 }, (_, i) =>
      produto({ id: `P${i}`, descricao: `Arroz ${i}` }),
    );

    expect(filtrarProdutosOffline(muitos, "arroz")).toHaveLength(20);
  });

  it("trata % e _ como texto", () => {
    expect(filtrarProdutosOffline(catalogo, "%")).toEqual([]);
    expect(filtrarProdutosOffline(catalogo, "_")).toEqual([]);
  });
});
