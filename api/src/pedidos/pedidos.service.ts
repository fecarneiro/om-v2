import { randomUUID } from "node:crypto";
import { LIMITE_HISTORICO_PEDIDOS } from "contracts/constants";
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
import type { NovoPedido, PedidoEnviado, PedidoHistorico } from "contracts/schemas";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import type { Db } from "../db/client.js";
import {
  clientes,
  pedidos,
  pedidos_itens,
  produtos,
  tabelas_preco_itens,
  vendedores,
} from "../db/schema.js";
import { ChaveIdempotenciaEmUsoError, PedidoInvalidoError } from "./pedidos.errors.js";

type Transacao = Parameters<Parameters<Db["transaction"]>[0]>[0];

const colunasPedido = {
  id: pedidos.id,
  cliente_id: pedidos.cliente_id,
  vendedor_id: pedidos.vendedor_id,
  data: pedidos.data,
  status: pedidos.status,
};

async function pedidoJaEnviado(
  tx: Transacao,
  input: NovoPedido,
  chaveIdempotencia: string,
): Promise<PedidoEnviado | undefined> {
  const [pedido] = await tx
    .select(colunasPedido)
    .from(pedidos)
    .where(
      and(
        eq(pedidos.vendedor_id, input.vendedor_id),
        eq(pedidos.chave_idempotencia, chaveIdempotencia),
      ),
    );
  if (!pedido) return undefined;

  if (pedido.cliente_id !== input.cliente_id) throw new ChaveIdempotenciaEmUsoError();

  const itens = await tx.select().from(pedidos_itens).where(eq(pedidos_itens.pedido_id, pedido.id));
  return { ...pedido, total: totalLiquidoDoPedido(itens).toFixed(2) };
}

export async function enviarPedido(
  db: Db,
  input: NovoPedido,
  chaveIdempotencia: string,
): Promise<{ pedido: PedidoEnviado; criado: boolean }> {
  return db.transaction(async (tx) => {
    const [linha] = await tx
      .select({ cliente: clientes, vendedor: vendedores })
      .from(clientes)
      .innerJoin(vendedores, eq(vendedores.id, clientes.vendedor_id))
      .where(eq(clientes.id, input.cliente_id))
      .for("update", { of: clientes });

    if (!linha) throw new PedidoInvalidoError("cliente_nao_encontrado");

    const jaEnviado = await pedidoJaEnviado(tx, input, chaveIdempotencia);
    if (jaEnviado) return { pedido: jaEnviado, criado: false };

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
        chave_idempotencia: chaveIdempotencia,
      })
      .returning(colunasPedido);

    await tx.insert(pedidos_itens).values(itens.map((item) => ({ ...item, pedido_id: pedido.id })));

    await tx
      .update(clientes)
      .set({ credito_utilizado: sql`${clientes.credito_utilizado} + ${total.toFixed(2)}` })
      .where(eq(clientes.id, cliente.id));

    return { pedido: { ...pedido, total: total.toFixed(2) }, criado: true };
  });
}

export async function listarUltimosPedidosPrecoAtual(
  db: Db,
  vendedorId: string,
  clienteId: string,
): Promise<PedidoHistorico[] | undefined> {
  const [cliente] = await db
    .select()
    .from(clientes)
    .where(and(eq(clientes.id, clienteId), eq(clientes.vendedor_id, vendedorId)));

  if (!cliente) return undefined;

  const ultimosPedidos = await db
    .select()
    .from(pedidos)
    .where(eq(pedidos.cliente_id, clienteId))
    .orderBy(desc(pedidos.data))
    .limit(LIMITE_HISTORICO_PEDIDOS);

  if (ultimosPedidos.length === 0) return [];

  const { tabela_preco_id } = tabelaDoCliente(cliente);

  const itensComPrecoAtual = await db
    .select({
      pedido_id: pedidos_itens.pedido_id,
      quantidade: pedidos_itens.quantidade,
      produto: produtos,
      preco_unidade: tabelas_preco_itens.preco_unidade,
    })
    .from(pedidos_itens)
    .innerJoin(produtos, eq(produtos.id, pedidos_itens.produto_id))
    .leftJoin(
      tabelas_preco_itens,
      and(
        eq(tabelas_preco_itens.produto_id, produtos.id),
        eq(tabelas_preco_itens.tabela_preco_id, tabela_preco_id),
      ),
    )
    .where(
      inArray(
        pedidos_itens.pedido_id,
        ultimosPedidos.map((pedido) => pedido.id),
      ),
    );

  return ultimosPedidos.map((pedido) => ({
    ...pedido,
    itens: itensComPrecoAtual
      .filter((item) => item.pedido_id === pedido.id)
      .map((item) => ({
        quantidade: item.quantidade,
        produto: { ...item.produto, ...disponibilidadeDoProduto(item.produto, item.preco_unidade) },
      })),
  }));
}
