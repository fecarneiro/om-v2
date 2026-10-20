export const STATUS_PEDIDO = ["enviado", "aguardando_aprovacao", "faturado", "cancelado"] as const;

export type StatusPedido = (typeof STATUS_PEDIDO)[number];
