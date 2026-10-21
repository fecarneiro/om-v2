import { eq, sql } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "../db/client.js";
import { clientes, pedidos } from "../db/schema.js";
import { seed } from "../db/seed.js";
import { PedidoInvalidoError } from "./pedidos.errors.js";
import { enviarPedido } from "./pedidos.service.js";

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
