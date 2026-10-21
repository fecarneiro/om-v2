CREATE TYPE "public"."status_pedido" AS ENUM('enviado', 'aguardando_aprovacao', 'faturado', 'cancelado');--> statement-breakpoint
CREATE TYPE "public"."unidade_venda" AS ENUM('UN', 'CX', 'FD');--> statement-breakpoint
CREATE TABLE "clientes" (
	"id" text PRIMARY KEY NOT NULL,
	"nome_fantasia" text NOT NULL,
	"razao_social" text NOT NULL,
	"cnpj" text NOT NULL,
	"vendedor_id" text NOT NULL,
	"tabela_preco_id" text,
	"limite_credito" numeric(12, 2) NOT NULL,
	"credito_utilizado" numeric(12, 2) NOT NULL,
	"cidade" text,
	"uf" text,
	CONSTRAINT "clientes_cnpj_unique" UNIQUE("cnpj"),
	CONSTRAINT "clientes_cnpj_check" CHECK ("clientes"."cnpj" ~ '^[0-9A-Z]{12}[0-9]{2}$'),
	CONSTRAINT "clientes_limite_credito_check" CHECK ("clientes"."limite_credito" >= 0),
	CONSTRAINT "clientes_credito_utilizado_check" CHECK ("clientes"."credito_utilizado" >= 0),
	CONSTRAINT "clientes_uf_check" CHECK ("clientes"."uf" IN ('AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA',
                      'PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'))
);
--> statement-breakpoint
CREATE TABLE "pedidos" (
	"id" text PRIMARY KEY NOT NULL,
	"cliente_id" text NOT NULL,
	"vendedor_id" text NOT NULL,
	"data" date NOT NULL,
	"status" "status_pedido" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pedidos_itens" (
	"pedido_id" text,
	"produto_id" text,
	"quantidade" integer NOT NULL,
	"preco_unidade" numeric(12, 2) NOT NULL,
	"desconto_percentual" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "pedidos_itens_pedido_id_produto_id_pk" PRIMARY KEY("pedido_id","produto_id"),
	CONSTRAINT "pedidos_itens_quantidade_check" CHECK ("pedidos_itens"."quantidade" > 0),
	CONSTRAINT "pedidos_itens_preco_unidade_check" CHECK ("pedidos_itens"."preco_unidade" > 0),
	CONSTRAINT "pedidos_itens_desconto_percentual_check" CHECK ("pedidos_itens"."desconto_percentual" BETWEEN 0 AND 100)
);
--> statement-breakpoint
CREATE TABLE "produtos" (
	"id" text PRIMARY KEY NOT NULL,
	"sku" text NOT NULL,
	"ean" text NOT NULL,
	"descricao" text NOT NULL,
	"categoria" text,
	"marca" text,
	"unidade_venda" "unidade_venda" NOT NULL,
	"fator_embalagem" integer NOT NULL,
	"venda_somente_multiplo" boolean NOT NULL,
	"ativo" boolean NOT NULL,
	CONSTRAINT "produtos_sku_unique" UNIQUE("sku"),
	CONSTRAINT "produtos_fator_embalagem_check" CHECK ("produtos"."fator_embalagem" > 0)
);
--> statement-breakpoint
CREATE TABLE "supervisores" (
	"id" text PRIMARY KEY NOT NULL,
	"nome" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tabelas_preco" (
	"id" text PRIMARY KEY NOT NULL,
	"nome" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tabelas_preco_itens" (
	"tabela_preco_id" text,
	"produto_id" text,
	"preco_unidade" numeric(12, 2) NOT NULL,
	CONSTRAINT "tabelas_preco_itens_tabela_preco_id_produto_id_pk" PRIMARY KEY("tabela_preco_id","produto_id"),
	CONSTRAINT "tabelas_preco_itens_preco_unidade_check" CHECK ("tabelas_preco_itens"."preco_unidade" > 0)
);
--> statement-breakpoint
CREATE TABLE "vendedores" (
	"id" text PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"supervisor_id" text NOT NULL,
	"alcada_desconto_percentual" integer NOT NULL,
	CONSTRAINT "vendedores_alcada_desconto_percentual_check" CHECK ("vendedores"."alcada_desconto_percentual" BETWEEN 0 AND 100)
);
--> statement-breakpoint
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_vendedor_id_vendedores_id_fk" FOREIGN KEY ("vendedor_id") REFERENCES "public"."vendedores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_tabela_preco_id_tabelas_preco_id_fk" FOREIGN KEY ("tabela_preco_id") REFERENCES "public"."tabelas_preco"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_vendedor_id_vendedores_id_fk" FOREIGN KEY ("vendedor_id") REFERENCES "public"."vendedores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pedidos_itens" ADD CONSTRAINT "pedidos_itens_pedido_id_pedidos_id_fk" FOREIGN KEY ("pedido_id") REFERENCES "public"."pedidos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pedidos_itens" ADD CONSTRAINT "pedidos_itens_produto_id_produtos_id_fk" FOREIGN KEY ("produto_id") REFERENCES "public"."produtos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tabelas_preco_itens" ADD CONSTRAINT "tabelas_preco_itens_tabela_preco_id_tabelas_preco_id_fk" FOREIGN KEY ("tabela_preco_id") REFERENCES "public"."tabelas_preco"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tabelas_preco_itens" ADD CONSTRAINT "tabelas_preco_itens_produto_id_produtos_id_fk" FOREIGN KEY ("produto_id") REFERENCES "public"."produtos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendedores" ADD CONSTRAINT "vendedores_supervisor_id_supervisores_id_fk" FOREIGN KEY ("supervisor_id") REFERENCES "public"."supervisores"("id") ON DELETE no action ON UPDATE no action;