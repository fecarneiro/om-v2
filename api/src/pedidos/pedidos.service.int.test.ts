import { eq, sql } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "../db/client.js";
import { clientes, pedidos } from "../db/schema.js";
import { seed } from "../db/seed.js";
import { PedidoInvalidoError } from "./pedidos.errors.js";
import { enviarPedido, listarUltimosPedidosPrecoAtual } from "./pedidos.service.js";

async function creditoUtilizado(clienteId: string) {
  const [cliente] = await db.select().from(clientes).where(eq(clientes.id, clienteId));
  return cliente.credito_utilizado;
}

beforeEach(async () => {
  await seed(db);
});

afterAll(async () => {
  await db.$client.end();
});

describe("enviarPedido", () => {
  it("grava o pedido com o preço da tabela do cliente e reserva o crédito", async () => {
    const pedido = await enviarPedido(db, {
      vendedor_id: "V01",
      cliente_id: "C001",
      itens: [
        { produto_id: "P001", quantidade: 10, desconto_percentual: 0 },
        { produto_id: "P006", quantidade: 40, desconto_percentual: 5 },
      ],
    });

    expect(pedido.status).toBe("enviado");
    expect(pedido.total).toBe("395.54");
    expect(await creditoUtilizado("C001")).toBe("1595.54");
  });

  it("deixa aguardando aprovação quando o desconto passa da alçada do vendedor", async () => {
    const pedido = await enviarPedido(db, {
      vendedor_id: "V01",
      cliente_id: "C001",
      itens: [
        { produto_id: "P001", quantidade: 10, desconto_percentual: 0 },
        { produto_id: "P006", quantidade: 40, desconto_percentual: 7 },
      ],
    });

    expect(pedido.status).toBe("aguardando_aprovacao");
  });

  it("rejeita cliente de outra carteira", async () => {
    const envio = enviarPedido(db, {
      vendedor_id: "V02",
      cliente_id: "C001",
      itens: [{ produto_id: "P001", quantidade: 20, desconto_percentual: 0 }],
    });

    await expect(envio).rejects.toThrow("cliente_fora_da_carteira");
  });

  it("rejeita item fora do múltiplo informando o produto", async () => {
    const envio = enviarPedido(db, {
      vendedor_id: "V01",
      cliente_id: "C001",
      itens: [
        { produto_id: "P001", quantidade: 20, desconto_percentual: 0 },
        { produto_id: "P006", quantidade: 30, desconto_percentual: 0 },
      ],
    });

    await expect(envio).rejects.toMatchObject({ message: "fora_do_multiplo", produto_id: "P006" });
  });

  it("rejeita pedido abaixo do mínimo", async () => {
    const envio = enviarPedido(db, {
      vendedor_id: "V01",
      cliente_id: "C001",
      itens: [{ produto_id: "P001", quantidade: 10, desconto_percentual: 0 }],
    });

    await expect(envio).rejects.toThrow("abaixo_do_pedido_minimo");
  });

  it("rejeita desconto em mais de um item", async () => {
    const envio = enviarPedido(db, {
      vendedor_id: "V01",
      cliente_id: "C001",
      itens: [
        { produto_id: "P001", quantidade: 10, desconto_percentual: 2 },
        { produto_id: "P006", quantidade: 40, desconto_percentual: 3 },
      ],
    });

    await expect(envio).rejects.toThrow("desconto_em_mais_de_um_produto");
  });

  it("rejeita pedido acima do crédito sem gravar nada", async () => {
    const envio = enviarPedido(db, {
      vendedor_id: "V01",
      cliente_id: "C002",
      itens: [{ produto_id: "P001", quantidade: 20, desconto_percentual: 0 }],
    });

    await expect(envio).rejects.toThrow("credito_insuficiente");
    expect(await creditoUtilizado("C002")).toBe("11650.00");
    expect(await db.select().from(pedidos).where(eq(pedidos.cliente_id, "C002"))).toHaveLength(0);
  });

  it("aceita só um entre envios simultâneos quando o crédito cobre apenas um", async () => {
    const pedido = {
      vendedor_id: "V01",
      cliente_id: "C002",
      itens: [{ produto_id: "P001", quantidade: 12, desconto_percentual: 0 }],
    };

    const envios = 5;
    await Promise.all(Array.from({ length: envios }, () => db.execute(sql`select 1`)));

    const resultados = await Promise.allSettled(
      Array.from({ length: envios }, () => enviarPedido(db, pedido)),
    );

    const aceitos = resultados.filter((resultado) => resultado.status === "fulfilled");
    const rejeitados = resultados.filter((resultado) => resultado.status === "rejected");
    expect(aceitos).toHaveLength(1);
    for (const rejeitado of rejeitados) {
      expect(rejeitado.reason).toBeInstanceOf(PedidoInvalidoError);
      expect(rejeitado.reason.message).toBe("credito_insuficiente");
    }
    expect(await creditoUtilizado("C002")).toBe("11953.48");
  });
});

describe("listarUltimosPedidosPrecoAtual", () => {
  it("lista os pedidos do mais recente para o mais antigo, com o preço atual da tabela", async () => {
    const historico = await listarUltimosPedidosPrecoAtual(db, "V01", "C001");

    expect(historico?.map((pedido) => pedido.id)).toEqual(["PH002", "PH001"]);
    expect(historico?.[0].itens[0]).toMatchObject({
      quantidade: 15,
      produto: { id: "P002", disponivel: true, preco_unidade: "7.49" },
    });
  });

  it("marca como indisponível o produto que hoje está inativo", async () => {
    const historico = await listarUltimosPedidosPrecoAtual(db, "V01", "C001");
    const ph001 = historico?.find((pedido) => pedido.id === "PH001");

    expect(ph001?.itens.find((item) => item.produto.id === "P022")?.produto).toMatchObject({
      disponivel: false,
      motivo: "produto_inativo",
    });
  });

  it("não devolve histórico de cliente de outra carteira", async () => {
    expect(await listarUltimosPedidosPrecoAtual(db, "V02", "C001")).toBeUndefined();
  });

  it("devolve lista vazia para cliente sem pedidos", async () => {
    expect(await listarUltimosPedidosPrecoAtual(db, "V01", "C002")).toEqual([]);
  });
});
