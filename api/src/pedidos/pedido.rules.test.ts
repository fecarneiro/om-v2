import { describe, expect, it } from "vitest";
import {
  creditoDisponivel,
  definirStatusEnvio,
  disponibilidadeDoProduto,
  pertenceACarteira,
  tabelaDoCliente,
  totalBrutoDoItem,
  totalBrutoDoPedido,
  totalLiquidoDoItem,
  totalLiquidoDoPedido,
  validarCredito,
  validarDescontos,
  validarPedidoMinimo,
  validarQuantidade,
} from "./pedido.rules.js";

const mercadinhoSaoJose = { vendedor_id: "V01" };

describe("pertenceACarteira", () => {
  it("aceita cliente da carteira do vendedor", () => {
    expect(pertenceACarteira(mercadinhoSaoJose, "V01")).toBe(true);
  });

  it("rejeita cliente de outra carteira", () => {
    expect(pertenceACarteira(mercadinhoSaoJose, "V02")).toBe(false);
  });
});

describe("tabelaDoCliente", () => {
  it("usa a tabela vinculada ao cliente", () => {
    expect(tabelaDoCliente({ tabela_preco_id: "TP02" })).toEqual({
      tabela_preco_id: "TP02",
      usa_tabela_padrao: false,
    });
  });

  it("usa a tabela padrão quando o cliente não tem tabela", () => {
    expect(tabelaDoCliente({ tabela_preco_id: null })).toEqual({
      tabela_preco_id: "TP01",
      usa_tabela_padrao: true,
    });
  });
});

describe("disponibilidadeDoProduto", () => {
  it("disponibiliza produto ativo com preço na tabela", () => {
    expect(disponibilidadeDoProduto({ ativo: true }, "26.90")).toEqual({
      disponivel: true,
      preco_unidade: "26.90",
    });
  });

  it("indisponibiliza produto inativo, mesmo com preço", () => {
    expect(disponibilidadeDoProduto({ ativo: false }, "2.69")).toEqual({
      disponivel: false,
      motivo: "produto_inativo",
    });
  });

  it("indisponibiliza produto ativo sem preço na tabela", () => {
    expect(disponibilidadeDoProduto({ ativo: true }, null)).toEqual({
      disponivel: false,
      motivo: "produto_sem_preco",
    });
  });

  it("prioriza inatividade quando o produto também está sem preço", () => {
    expect(disponibilidadeDoProduto({ ativo: false }, null)).toEqual({
      disponivel: false,
      motivo: "produto_inativo",
    });
  });
});

const leite = { fator_embalagem: 12, venda_somente_multiplo: true };
const oleo = { fator_embalagem: 20, venda_somente_multiplo: false };
const arroz = { fator_embalagem: 1, venda_somente_multiplo: false };

describe("validarQuantidade", () => {
  describe("produto vendido somente em múltiplos", () => {
    it("aceita 2 embalagens", () => {
      expect(validarQuantidade(leite, 24)).toBeNull();
    });

    it("aceita mais de 2 embalagens", () => {
      expect(validarQuantidade(leite, 48)).toBeNull();
    });

    it("rejeita 1 embalagem", () => {
      expect(validarQuantidade(leite, 12)).toBe("abaixo_do_minimo_de_embalagens");
    });

    it("rejeita quantidade que não é múltipla do fator", () => {
      expect(validarQuantidade(leite, 30)).toBe("fora_do_multiplo");
    });

    it("rejeita quantidade menor que uma embalagem", () => {
      expect(validarQuantidade(leite, 5)).toBe("fora_do_multiplo");
    });
  });

  describe("produto em embalagem sem mínimo de 2", () => {
    it("aceita 1 embalagem", () => {
      expect(validarQuantidade(oleo, 20)).toBeNull();
    });

    it("rejeita unidade avulsa de produto em caixa", () => {
      expect(validarQuantidade(oleo, 1)).toBe("fora_do_multiplo");
    });

    it("rejeita quantidade que não fecha caixa", () => {
      expect(validarQuantidade(oleo, 27)).toBe("fora_do_multiplo");
    });

    it("aceita produto unitário", () => {
      expect(validarQuantidade(arroz, 3)).toBeNull();
    });
  });

  describe("quantidade inválida", () => {
    it.each([0, -1, 1.5])("rejeita %s", (quantidade) => {
      expect(validarQuantidade(arroz, quantidade)).toBe("quantidade_invalida");
    });
  });
});

const alcadaCarlos = 5;
const item = (desconto_percentual: number) => ({ desconto_percentual });

describe("validarDescontos", () => {
  it("aceita pedido sem desconto", () => {
    expect(validarDescontos([item(0), item(0)])).toBeNull();
  });

  it("aceita desconto em 1 produto", () => {
    expect(validarDescontos([item(5), item(0)])).toBeNull();
  });

  it("rejeita desconto em mais de 1 produto", () => {
    expect(validarDescontos([item(1), item(3)])).toBe("desconto_em_mais_de_um_produto");
  });
});

describe("definirStatusEnvio", () => {
  it("envia pedido sem desconto", () => {
    expect(definirStatusEnvio([item(0), item(0)], alcadaCarlos)).toBe("enviado");
  });

  it("envia pedido com desconto igual à alçada", () => {
    expect(definirStatusEnvio([item(5), item(0)], alcadaCarlos)).toBe("enviado");
  });

  it("pede aprovação quando o desconto passa da alçada", () => {
    expect(definirStatusEnvio([item(6), item(0)], alcadaCarlos)).toBe("aguardando_aprovacao");
  });
});

const ph001 = [
  { quantidade: 10, preco_unidade: "25.90" },
  { quantidade: 40, preco_unidade: "3.29" },
  { quantidade: 24, preco_unidade: "4.89" },
  { quantidade: 30, preco_unidade: "2.59" },
];

const ph002 = [
  { quantidade: 15, preco_unidade: "7.49" },
  { quantidade: 12, preco_unidade: "8.79" },
  { quantidade: 24, preco_unidade: "2.39" },
];

describe("totalBrutoDoItem", () => {
  it("multiplica preço por quantidade sem erro de ponto flutuante", () => {
    expect(totalBrutoDoItem({ quantidade: 3, preco_unidade: "26.90" }).toString()).toBe("80.7");
  });
});

describe("totalBrutoDoPedido", () => {
  it("soma o bruto dos itens", () => {
    expect(totalBrutoDoPedido(ph002).toFixed(2)).toBe("275.19");
  });

  it("dá zero para pedido vazio", () => {
    expect(totalBrutoDoPedido([]).toFixed(2)).toBe("0.00");
  });
});

describe("validarPedidoMinimo", () => {
  it("aceita pedido acima do mínimo", () => {
    expect(validarPedidoMinimo(ph001)).toBeNull();
  });

  it("aceita pedido igual ao mínimo, sem erro de ponto flutuante na soma", () => {
    const itens = [
      { quantidade: 7, preco_unidade: "33.80" },
      { quantidade: 1, preco_unidade: "63.40" },
    ];
    expect(validarPedidoMinimo(itens)).toBeNull();
  });

  it("rejeita pedido abaixo do mínimo", () => {
    expect(validarPedidoMinimo(ph002)).toBe("abaixo_do_pedido_minimo");
  });

  it("ignora o desconto, considerando o valor bruto", () => {
    const itemComDesconto = { quantidade: 10, preco_unidade: "31.00", desconto_percentual: 7 };
    expect(validarPedidoMinimo([itemComDesconto])).toBeNull();
  });

  it("rejeita pedido vazio", () => {
    expect(validarPedidoMinimo([])).toBe("abaixo_do_pedido_minimo");
  });
});

describe("totalLiquidoDoItem", () => {
  it("mantém o bruto quando não há desconto", () => {
    expect(
      totalLiquidoDoItem({ quantidade: 6, preco_unidade: "10.00", desconto_percentual: 0 }).toFixed(
        2,
      ),
    ).toBe("60.00");
  });

  it("aplica o desconto percentual sobre o bruto", () => {
    expect(
      totalLiquidoDoItem({
        quantidade: 12,
        preco_unidade: "26.90",
        desconto_percentual: 5,
      }).toFixed(2),
    ).toBe("306.66");
  });

  it("arredonda para centavos com meio para cima", () => {
    expect(
      totalLiquidoDoItem({ quantidade: 1, preco_unidade: "0.50", desconto_percentual: 1 }).toFixed(
        2,
      ),
    ).toBe("0.50");
  });
});

describe("totalLiquidoDoPedido", () => {
  it("soma os totais líquidos dos itens", () => {
    expect(
      totalLiquidoDoPedido([
        { quantidade: 12, preco_unidade: "26.90", desconto_percentual: 5 },
        { quantidade: 6, preco_unidade: "10.00", desconto_percentual: 0 },
      ]).toFixed(2),
    ).toBe("366.66");
  });
});

describe("creditoDisponivel", () => {
  it("é o limite menos o utilizado", () => {
    expect(
      creditoDisponivel({ limite_credito: "1000.00", credito_utilizado: "730.10" }).toFixed(2),
    ).toBe("269.90");
  });
});

describe("validarCredito", () => {
  const itens = [{ quantidade: 10, preco_unidade: "30.00", desconto_percentual: 10 }];

  it("aceita pedido igual ao crédito disponível", () => {
    expect(
      validarCredito({ limite_credito: "1000.00", credito_utilizado: "730.00" }, itens),
    ).toBeNull();
  });

  it("rejeita pedido acima do crédito disponível", () => {
    expect(validarCredito({ limite_credito: "1000.00", credito_utilizado: "730.01" }, itens)).toBe(
      "credito_insuficiente",
    );
  });

  it("rejeita qualquer pedido de cliente com crédito zerado", () => {
    expect(validarCredito({ limite_credito: "500.00", credito_utilizado: "500.00" }, itens)).toBe(
      "credito_insuficiente",
    );
  });
});
