import { z } from "zod";
import { STATUS_PEDIDO } from "../constants/index.js";

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

export const pedidoEnviadoSchema = z.object({
  id: z.string(),
  cliente_id: z.string(),
  vendedor_id: z.string(),
  data: z.string(),
  status: z.enum(STATUS_PEDIDO),
  total: z.string(),
});

export type NovoPedido = z.infer<typeof novoPedidoSchema>;
export type PedidoEnviado = z.infer<typeof pedidoEnviadoSchema>;
