import type { ClienteCarteira, ProdutoDisponivel } from "contracts/schemas";
import { describe, expect, it } from "vitest";
import type { ItemPedido } from "@/stores/pedido";
import { bloqueiosDoPedido } from "./bloqueios-pedido";

function item(produto: Partial<ProdutoDisponivel>, embalagens: number, desconto = 0): ItemPedido {
  return {
    produto: {
      id: "P1",
      sku: "SKU",
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
      ...produto,
    },
    embalagens,
    desconto_percentual: desconto,
  };
}

function cliente(limite: string, utilizado: string) {
  return { limite_credito: limite, credito_utilizado: utilizado } as ClienteCarteira;
}

const arroz = { id: "ARROZ", preco_unidade: "26.90" };
const acucar = {
  id: "ACUCAR",
  unidade_venda: "FD",
  fator_embalagem: 10,
  venda_somente_multiplo: true,
  preco_unidade: "4.79",
} as const;

describe("bloqueiosDoPedido", () => {
  it("não bloqueia um pedido dentro das regras", () => {
    expect(bloqueiosDoPedido([item(arroz, 12)], cliente("1000.00", "0.00"))).toEqual([]);
  });

  it("lista todos os bloqueios de uma vez", () => {
    const itens = [item(acucar, 1, 5), item(arroz, 1, 3)];

    expect(bloqueiosDoPedido(itens, cliente("10.00", "5.00"))).toEqual([
      "item_invalido",
      "desconto_em_mais_de_um_produto",
      "abaixo_do_pedido_minimo",
      "credito_insuficiente",
    ]);
  });

  it("calcula mínimo e crédito só com os itens válidos", () => {
    const itens = [item(arroz, 12), item(acucar, 1)];
    expect(bloqueiosDoPedido(itens, cliente("1000.00", "0.00"))).toEqual(["item_invalido"]);
  });

  it("bloqueia pelo crédito mesmo acima do mínimo", () => {
    expect(bloqueiosDoPedido([item(arroz, 12)], cliente("300.00", "0.00"))).toEqual([
      "credito_insuficiente",
    ]);
  });
});
