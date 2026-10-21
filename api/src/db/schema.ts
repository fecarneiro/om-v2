import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  boolean,
  check,
  date,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
} from "drizzle-orm/pg-core";
import { STATUS_PEDIDO } from "../domain/status-pedido.js";
import { UNIDADES_VENDA } from "../domain/unidade-venda.js";

// Helpers
const dinheiro = () => numeric({ precision: 12, scale: 2 });
const checkPercentual = (nome: string, coluna: AnyPgColumn) =>
  check(nome, sql`${coluna} BETWEEN 0 AND 100`);

// Enums
export const unidadeVendaEnum = pgEnum("unidade_venda", UNIDADES_VENDA);
export const statusPedidoEnum = pgEnum("status_pedido", STATUS_PEDIDO);

// Tables
export const supervisores = pgTable("supervisores", {
  id: text().primaryKey(),
  nome: text().notNull(),
});

export const vendedores = pgTable(
  "vendedores",
  {
    id: text().primaryKey(),
    nome: text().notNull(),
    supervisor_id: text()
      .notNull()
      .references(() => supervisores.id),
    alcada_desconto_percentual: integer().notNull(),
  },
  (t) => [
    checkPercentual("vendedores_alcada_desconto_percentual_check", t.alcada_desconto_percentual),
  ],
);

export const clientes = pgTable(
  "clientes",
  {
    id: text().primaryKey(),
    nome_fantasia: text().notNull(),
    razao_social: text().notNull(),
    cnpj: text().notNull().unique(),
    vendedor_id: text()
      .notNull()
      .references(() => vendedores.id),
    tabela_preco_id: text().references(() => tabelas_preco.id),
    limite_credito: dinheiro().notNull(),
    credito_utilizado: dinheiro().notNull(),
    cidade: text(),
    uf: text(),
  },
  (t) => [
    check("clientes_cnpj_check", sql`${t.cnpj} ~ '^[0-9A-Z]{12}[0-9]{2}$'`),
    check("clientes_limite_credito_check", sql`${t.limite_credito} >= 0`),
    check("clientes_credito_utilizado_check", sql`${t.credito_utilizado} >= 0`),
    check(
      "clientes_uf_check",
      sql`${t.uf} IN ('AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA',
                      'PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO')`,
    ),
    index("clientes_vendedor_id_idx").on(t.vendedor_id),
  ],
);

export const produtos = pgTable(
  "produtos",
  {
    id: text().primaryKey(),
    sku: text().notNull().unique(),
    ean: text().notNull(),
    descricao: text().notNull(),
    categoria: text(),
    marca: text(),
    unidade_venda: unidadeVendaEnum().notNull(),
    fator_embalagem: integer().notNull(),
    venda_somente_multiplo: boolean().notNull(),
    ativo: boolean().notNull(),
  },
  (t) => [
    check("produtos_fator_embalagem_check", sql`${t.fator_embalagem} > 0`),
    index("produtos_ean_idx").on(t.ean.op("text_pattern_ops")),
  ],
);

export const tabelas_preco = pgTable("tabelas_preco", {
  id: text().primaryKey(),
  nome: text().notNull(),
});

export const tabelas_preco_itens = pgTable(
  "tabelas_preco_itens",
  {
    tabela_preco_id: text().references(() => tabelas_preco.id, { onDelete: "cascade" }),
    produto_id: text().references(() => produtos.id),
    preco_unidade: dinheiro().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.tabela_preco_id, t.produto_id] }),
    check("tabelas_preco_itens_preco_unidade_check", sql`${t.preco_unidade} > 0`),
  ],
);

export const pedidos = pgTable(
  "pedidos",
  {
    id: text().primaryKey(),
    cliente_id: text()
      .notNull()
      .references(() => clientes.id),
    vendedor_id: text()
      .notNull()
      .references(() => vendedores.id),
    data: date().notNull(),
    status: statusPedidoEnum().notNull(),
  },
  (t) => [index("pedidos_cliente_id_data_idx").on(t.cliente_id, t.data)],
);

export const pedidos_itens = pgTable(
  "pedidos_itens",
  {
    pedido_id: text().references(() => pedidos.id, { onDelete: "cascade" }),
    produto_id: text().references(() => produtos.id),
    quantidade: integer().notNull(),
    preco_unidade: dinheiro().notNull(),
    desconto_percentual: integer().notNull().default(0),
  },
  (t) => [
    primaryKey({ columns: [t.pedido_id, t.produto_id] }),
    check("pedidos_itens_quantidade_check", sql`${t.quantidade} > 0`),
    check("pedidos_itens_preco_unidade_check", sql`${t.preco_unidade} > 0`),
    checkPercentual("pedidos_itens_desconto_percentual_check", t.desconto_percentual),
  ],
);

export type Cliente = typeof clientes.$inferSelect;
export type Produto = typeof produtos.$inferSelect;
export type PedidoItem = typeof pedidos_itens.$inferSelect;
