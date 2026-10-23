import type { PedidoHistorico, ProdutoDisponivel } from "contracts/schemas";
import { describe, expect, it } from "vitest";
import type { ItemPedido } from "@/stores/pedido";
import {
  incrementarEmbalagens,
  itemEmUnidades,
  itemValido,
  itensParaRepetir,
  validarEmbalagens,
} from "./item-pedido";

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

describe("itemEmUnidades", () => {
  it("converte embalagens em unidades pelo fator", () => {
    expect(itemEmUnidades(item(acucar, 4, 10))).toEqual({
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

describe("incrementarEmbalagens", () => {
  it("soma uma embalagem quando a quantidade é válida", () => {
    expect(incrementarEmbalagens(item(acucar, 2))).toBe(3);
  });

  it("vai para o mínimo quando a quantidade é inválida", () => {
    expect(incrementarEmbalagens(item(acucar, 1))).toBe(2);
    expect(incrementarEmbalagens(item(acucar, Number.NaN))).toBe(2);
  });
});

describe("itensParaRepetir", () => {
  function historico(itens: PedidoHistorico["itens"]): PedidoHistorico {
    return {
      id: "PH001",
      cliente_id: "C001",
      vendedor_id: "V01",
      data: "2026-09-15",
      status: "faturado",
      itens,
    };
  }

  const fardoDeAcucar = item(acucar, 1).produto;

  it("converte as unidades do histórico em embalagens", () => {
    expect(itensParaRepetir(historico([{ quantidade: 30, produto: fardoDeAcucar }]))).toMatchObject(
      [{ embalagens: 3 }],
    );
  });

  it("deixa de fora o produto indisponível hoje", () => {
    const inativo = { ...fardoDeAcucar, disponivel: false, motivo: "produto_inativo" } as const;
    expect(itensParaRepetir(historico([{ quantidade: 30, produto: inativo }]))).toEqual([]);
  });

  it("não copia o desconto do pedido antigo", () => {
    expect(itensParaRepetir(historico([{ quantidade: 30, produto: fardoDeAcucar }]))).toMatchObject(
      [{ desconto_percentual: 0 }],
    );
  });
});
