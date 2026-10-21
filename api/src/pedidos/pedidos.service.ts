import { randomUUID } from "node:crypto";
import {
  definirStatusEnvio,
  disponibilidadeDoProduto,
  pertenceACarteira,
  tabelaDoCliente,
  totalLiquidoDoPedido,
  validarCredito,
  validarDescontos,
  validarPedidoMinimo,
  validarQuantidade,
} from "contracts/rules";
import type { NovoPedido, PedidoEnviado } from "contracts/schemas";
import { and, eq, inArray, sql } from "drizzle-orm";
import type { Db } from "../db/client.js";
import {
  clientes,
  pedidos,
  pedidos_itens,
  produtos,
  tabelas_preco_itens,
  vendedores,
} from "../db/schema.js";
import { PedidoInvalidoError } from "./pedidos.errors.js";

export async function enviarPedido(db: Db, input: NovoPedido): Promise<PedidoEnviado> {
  return db.transaction(async (tx) => {
    const [linha] = await tx
      .select({ cliente: clientes, vendedor: vendedores })
      .from(clientes)
      .innerJoin(vendedores, eq(vendedores.id, clientes.vendedor_id))
      .where(eq(clientes.id, input.cliente_id))
      .for("update", { of: clientes });

    if (!linha) throw new PedidoInvalidoError("cliente_nao_encontrado");

    const { cliente, vendedor } = linha;
    if (!pertenceACarteira(cliente, input.vendedor_id))
      throw new PedidoInvalidoError("cliente_fora_da_carteira");

    const { tabela_preco_id } = tabelaDoCliente(cliente);

    const catalogo = await tx
      .select({ produto: produtos, preco_unidade: tabelas_preco_itens.preco_unidade })
      .from(produtos)
      .leftJoin(
        tabelas_preco_itens,
        and(
          eq(tabelas_preco_itens.produto_id, produtos.id),
          eq(tabelas_preco_itens.tabela_preco_id, tabela_preco_id),
        ),
      )
      .where(
        inArray(
          produtos.id,
          input.itens.map((item) => item.produto_id),
        ),
      );

    const itens = input.itens.map((item) => {
      const linha = catalogo.find((linha) => linha.produto.id === item.produto_id);
      if (!linha) throw new PedidoInvalidoError("produto_nao_encontrado", item.produto_id);

      const disponibilidade = disponibilidadeDoProduto(linha.produto, linha.preco_unidade);
      if (!disponibilidade.disponivel)
        throw new PedidoInvalidoError(disponibilidade.motivo, item.produto_id);

      const erroQuantidade = validarQuantidade(linha.produto, item.quantidade);
      if (erroQuantidade) throw new PedidoInvalidoError(erroQuantidade, item.produto_id);

      return { ...item, preco_unidade: disponibilidade.preco_unidade };
    });

    const erroDoPedido =
      validarDescontos(itens) ?? validarPedidoMinimo(itens) ?? validarCredito(cliente, itens);
    if (erroDoPedido) throw new PedidoInvalidoError(erroDoPedido);

    const total = totalLiquidoDoPedido(itens);
    const status = definirStatusEnvio(itens, vendedor.alcada_desconto_percentual);

    const [pedido] = await tx
      .insert(pedidos)
      .values({
        id: randomUUID(),
        cliente_id: cliente.id,
        vendedor_id: vendedor.id,
        data: sql`current_date`,
        status,
      })
      .returning();

    await tx.insert(pedidos_itens).values(itens.map((item) => ({ ...item, pedido_id: pedido.id })));

    await tx
      .update(clientes)
      .set({ credito_utilizado: sql`${clientes.credito_utilizado} + ${total.toFixed(2)}` })
      .where(eq(clientes.id, cliente.id));

    return { ...pedido, total: total.toFixed(2) };
  });
}
