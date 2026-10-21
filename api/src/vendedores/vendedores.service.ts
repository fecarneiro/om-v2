import { eq } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { clientes, vendedores } from "../db/schema.js";
import { creditoDisponivel } from "../pedidos/pedido.rules.js";

export function listarVendedores(db: Db) {
  return db.select().from(vendedores).orderBy(vendedores.nome);
}

export async function listarCarteira(db: Db, vendedorId: string) {
  const carteira = await db
    .select()
    .from(clientes)
    .where(eq(clientes.vendedor_id, vendedorId))
    .orderBy(clientes.nome_fantasia);

  return carteira.map((cliente) => ({
    ...cliente,
    credito_disponivel: creditoDisponivel(cliente).toFixed(2),
  }));
}
