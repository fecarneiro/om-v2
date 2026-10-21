import type { ProdutoDisponivel } from "contracts/schemas";
import { describe, expect, it } from "vitest";
import type { ItemPedido } from "@/stores/pedido";
import { emUnidades, itemValido, validarEmbalagens } from "./item";

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

const acucar = { unidade_venda: "FD", fator_embalagem: 10, venda_somente_multiplo: true } as const;

describe("emUnidades", () => {
  it("converte embalagens em unidades pelo fator", () => {
    expect(emUnidades(item(acucar, 4, 10))).toEqual({
      quantidade: 40,
      preco_unidade: "1.00",
      desconto_percentual: 10,
    });
  });
});

describe("validarEmbalagens", () => {
  it("aceita o mínimo de embalagens", () => {
    expect(validarEmbalagens(item(acucar, 2))).toBeNull();
  });

  it("rejeita abaixo do mínimo de embalagens", () => {
    expect(validarEmbalagens(item(acucar, 1))).toBe("abaixo_do_minimo_de_embalagens");
  });

  it("rejeita embalagem quebrada ou vazia", () => {
    expect(validarEmbalagens(item(acucar, 2.5))).not.toBeNull();
    expect(validarEmbalagens(item({}, Number.NaN))).toBe("quantidade_invalida");
  });
});

describe("itemValido", () => {
  it("exige quantidade e desconto válidos", () => {
    expect(itemValido(item(acucar, 2, 5))).toBe(true);
    expect(itemValido(item(acucar, 1, 5))).toBe(false);
    expect(itemValido(item(acucar, 2, 150))).toBe(false);
  });
});
