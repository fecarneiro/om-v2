import { creditoDisponivel, tabelaDoCliente } from "contracts/rules";
import type { ClienteCarteira, Vendedor } from "contracts/schemas";
import { and, eq } from "drizzle-orm";
import type { Db } from "../db/client.js";
import {
  type Cliente,
  clientes,
  type TabelaPreco,
  tabelas_preco,
  vendedores,
} from "../db/schema.js";

function comCreditoETabela(cliente: Cliente, tabelas: TabelaPreco[]): ClienteCarteira {
  const { tabela_preco_id, tabela_preco_pendente } = tabelaDoCliente(cliente);
  const tabela = tabelas.find((tabela) => tabela.id === tabela_preco_id);

  return {
    ...cliente,
    credito_disponivel: creditoDisponivel(cliente).toFixed(2),
    tabela_preco: tabela ?? null,
    tabela_preco_pendente,
  };
}

export function listarVendedores(db: Db): Promise<Vendedor[]> {
  return db.select().from(vendedores).orderBy(vendedores.nome);
}

export async function listarCarteira(db: Db, vendedorId: string): Promise<ClienteCarteira[]> {
  const carteira = await db
    .select()
    .from(clientes)
    .where(eq(clientes.vendedor_id, vendedorId))
    .orderBy(clientes.nome_fantasia);

  const tabelas = await db.select().from(tabelas_preco);
  return carteira.map((cliente) => comCreditoETabela(cliente, tabelas));
}

export async function buscarClienteDaCarteira(
  db: Db,
  vendedorId: string,
  clienteId: string,
): Promise<ClienteCarteira | undefined> {
  const [cliente] = await db
    .select()
    .from(clientes)
    .where(and(eq(clientes.id, clienteId), eq(clientes.vendedor_id, vendedorId)));

  if (!cliente) return undefined;

  const tabelas = await db.select().from(tabelas_preco);
  return comCreditoETabela(cliente, tabelas);
}
