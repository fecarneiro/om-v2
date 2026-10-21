CREATE INDEX "clientes_vendedor_id_idx" ON "clientes" USING btree ("vendedor_id");--> statement-breakpoint
CREATE INDEX "pedidos_cliente_id_data_idx" ON "pedidos" USING btree ("cliente_id","data");--> statement-breakpoint
CREATE INDEX "produtos_ean_idx" ON "produtos" USING btree ("ean" text_pattern_ops);