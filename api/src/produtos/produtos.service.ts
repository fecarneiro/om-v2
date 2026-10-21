import { and, eq, sql } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { clientes, produtos, tabelas_preco_itens } from "../db/schema.js";
import { disponibilidadeDoProduto, tabelaDoCliente } from "../pedidos/pedido.rules.js";

const textoBuscavel = sql`unaccent(${produtos.descricao} || ' ' || coalesce(${produtos.marca}, '') || ' ' || ${produtos.sku})`;

// TODO: ponderar índice pg_trgm ou tsvector se o catálogo crescer
export async function buscarProdutos(db: Db, clienteId: string, busca: string) {
  const [cliente] = await db.select().from(clientes).where(eq(clientes.id, clienteId));
  if (!cliente) return [];

  const { tabela_preco_id } = tabelaDoCliente(cliente);

  // Só dígitos: começo do EAN. Texto: todas as palavras (AND), sem acento.
  // Valores vão como parâmetros (sem SQL injection); % e _ escapados do LIKE.
  const filtro = /^\d+$/.test(busca)
    ? sql`${produtos.ean} LIKE ${`${busca}%`}`
    : and(
        ...busca
          .split(/\s+/)
          .filter((termo) => termo !== "")
          .map((termo) => termo.replace(/[\\%_]/g, "\\$&"))
          .map((termo) => sql`${textoBuscavel} ILIKE unaccent(${`%${termo}%`})`),
      );

  const linhas = await db
    .select({ produto: produtos, preco_unidade: tabelas_preco_itens.preco_unidade })
    .from(produtos)
    .leftJoin(
      tabelas_preco_itens,
      and(
        eq(tabelas_preco_itens.produto_id, produtos.id),
        eq(tabelas_preco_itens.tabela_preco_id, tabela_preco_id),
      ),
    )
    .where(filtro)
    .orderBy(produtos.descricao)
    .limit(20);

  return linhas.map(({ produto, preco_unidade }) => ({
    ...produto,
    ...disponibilidadeDoProduto(produto, preco_unidade),
  }));
}
