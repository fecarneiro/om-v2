import { LIMITE_BUSCA_PRODUTOS } from "contracts/constants";
import { disponibilidadeDoProduto, tabelaDoCliente } from "contracts/rules";
import type { ProdutoBusca } from "contracts/schemas";
import { and, eq, type SQL, sql } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { clientes, produtos, tabelas_preco_itens } from "../db/schema.js";

const textoBuscavel = sql`unaccent(${produtos.descricao} || ' ' || coalesce(${produtos.marca}, '') || ' ' || ${produtos.sku})`;

// Espelhado em web/src/offline/busca-offline.ts
export async function buscarProdutos(
  db: Db,
  clienteId: string,
  busca: string,
): Promise<ProdutoBusca[]> {
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

  return produtosComPrecoDoCliente(db, clienteId, filtro, LIMITE_BUSCA_PRODUTOS);
}

export async function listarCatalogo(db: Db, clienteId: string): Promise<ProdutoBusca[]> {
  return produtosComPrecoDoCliente(db, clienteId);
}

async function produtosComPrecoDoCliente(
  db: Db,
  clienteId: string,
  filtro?: SQL,
  limite?: number,
): Promise<ProdutoBusca[]> {
  const [cliente] = await db.select().from(clientes).where(eq(clientes.id, clienteId));
  if (!cliente) return [];

  const { tabela_preco_id } = tabelaDoCliente(cliente);

  const consulta = db
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
    .$dynamic();

  const linhas = await (limite ? consulta.limit(limite) : consulta);

  return linhas.map(({ produto, preco_unidade }) => ({
    ...produto,
    ...disponibilidadeDoProduto(produto, preco_unidade),
  }));
}
