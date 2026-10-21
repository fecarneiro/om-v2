import { z } from "zod";

export const novoPedidoSchema = z.object({
  vendedor_id: z.string().min(1),
  cliente_id: z.string().min(1),
  itens: z
    .array(
      z.object({
        produto_id: z.string().min(1),
        quantidade: z.number(),
        desconto_percentual: z.int().min(0).max(100),
      }),
    )
    .min(1),
});

export type NovoPedido = z.infer<typeof novoPedidoSchema>;
