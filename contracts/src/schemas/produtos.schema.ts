import { z } from "zod";
import { UNIDADES_VENDA } from "../constants/index.js";

export const produtoSchema = z.object({
  id: z.string(),
  sku: z.string(),
  ean: z.string(),
  descricao: z.string(),
  categoria: z.string().nullable(),
  marca: z.string().nullable(),
  unidade_venda: z.enum(UNIDADES_VENDA),
  fator_embalagem: z.int(),
  venda_somente_multiplo: z.boolean(),
  ativo: z.boolean(),
});

export const produtoBuscaSchema = z.discriminatedUnion("disponivel", [
  produtoSchema.extend({ disponivel: z.literal(true), preco_unidade: z.string() }),
  produtoSchema.extend({
    disponivel: z.literal(false),
    motivo: z.enum(["produto_inativo", "produto_sem_preco"]),
  }),
]);

export type Produto = z.infer<typeof produtoSchema>;
export type ProdutoBusca = z.infer<typeof produtoBuscaSchema>;
export type ProdutoDisponivel = Extract<ProdutoBusca, { disponivel: true }>;
