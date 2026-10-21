import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "../db/client.js";
import { seed } from "../db/seed.js";
import { buscarClienteDaCarteira, listarCarteira } from "./vendedores.service.js";

beforeAll(async () => {
  await seed(db);
});

afterAll(async () => {
  await db.$client.end();
});

describe("listarCarteira", () => {
  it("lista só os clientes do vendedor, com o crédito disponível", async () => {
    const carteira = await listarCarteira(db, "V01");

    expect(carteira.map((cliente) => cliente.id).sort()).toEqual(["C001", "C002", "C003", "C004"]);
    expect(carteira.find((cliente) => cliente.id === "C002")?.credito_disponivel).toBe("350.00");
  });

  it("resolve a tabela de preço e marca a pendente quando o cliente não tem tabela", async () => {
    const carteira = await listarCarteira(db, "V01");
    const c002 = carteira.find((cliente) => cliente.id === "C002");
    const c004 = carteira.find((cliente) => cliente.id === "C004");

    expect(c002?.tabela_preco).toEqual({ id: "TP02", nome: "Tabela Volume" });
    expect(c002?.tabela_preco_pendente).toBe(false);
    expect(c004?.tabela_preco).toEqual({ id: "TP01", nome: "Tabela Padrão" });
    expect(c004?.tabela_preco_pendente).toBe(true);
  });
});

describe("buscarClienteDaCarteira", () => {
  it("devolve o cliente da carteira, com o crédito disponível", async () => {
    const cliente = await buscarClienteDaCarteira(db, "V01", "C002");

    expect(cliente?.id).toBe("C002");
    expect(cliente?.credito_disponivel).toBe("350.00");
  });

  it("não devolve cliente de outra carteira", async () => {
    expect(await buscarClienteDaCarteira(db, "V01", "C005")).toBeUndefined();
  });

  it("não devolve cliente inexistente", async () => {
    expect(await buscarClienteDaCarteira(db, "V01", "C999")).toBeUndefined();
  });
});
