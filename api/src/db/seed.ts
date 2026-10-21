import { readFile } from "node:fs/promises";
import { sql } from "drizzle-orm";
import type { Db } from "./client.js";
import {
  clientes,
  pedidos,
  pedidos_itens,
  produtos,
  supervisores,
  tabelas_preco,
  tabelas_preco_itens,
  vendedores,
} from "./schema.js";

const dinheiro = (valor: number) => valor.toFixed(2);

export async function seed(db: Db) {
  const dados = JSON.parse(await readFile(new URL("./seed.json", import.meta.url), "utf-8"));

  await db.transaction(async (tx) => {
    await tx.execute(
      sql`TRUNCATE supervisores, vendedores, clientes, produtos, tabelas_preco, tabelas_preco_itens, pedidos, pedidos_itens CASCADE`,
    );

    await tx.insert(supervisores).values(dados.supervisores);
    await tx.insert(vendedores).values(dados.vendedores);

    await tx
      .insert(tabelas_preco)
      .values(dados.tabelas_preco.map((tabela: any) => ({ id: tabela.id, nome: tabela.nome })));
    await tx.insert(produtos).values(dados.produtos);
    await tx.insert(tabelas_preco_itens).values(
      dados.tabelas_preco.flatMap((tabela: any) =>
        tabela.itens.map((item: any) => ({
          tabela_preco_id: tabela.id,
          produto_id: item.produto_id,
          preco_unidade: dinheiro(item.preco_unidade),
        })),
      ),
    );

    await tx.insert(clientes).values(
      dados.clientes.map((cliente: any) => ({
        ...cliente,
        cnpj: cliente.cnpj.replace(/[^0-9A-Z]/g, ""),
        limite_credito: dinheiro(cliente.limite_credito),
        credito_utilizado: dinheiro(cliente.credito_utilizado),
      })),
    );

    await tx.insert(pedidos).values(
      dados.pedidos_historico.map((pedido: any) => ({
        id: pedido.id,
        cliente_id: pedido.cliente_id,
        vendedor_id: pedido.vendedor_id,
        data: pedido.data,
        status: pedido.status.toLowerCase(),
      })),
    );
    await tx.insert(pedidos_itens).values(
      dados.pedidos_historico.flatMap((pedido: any) =>
        pedido.itens.map((item: any) => ({
          ...item,
          pedido_id: pedido.id,
          preco_unidade: dinheiro(item.preco_unidade),
        })),
      ),
    );
  });
}
