import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "../db/client.js";
import { seed } from "../db/seed.js";
import { listarCarteira } from "./vendedores.service.js";

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
});
