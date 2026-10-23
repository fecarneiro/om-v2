export const STATUS_PEDIDO = ["enviado", "aguardando_aprovacao", "faturado", "cancelado"] as const;
export const UNIDADES_VENDA = ["UN", "CX", "FD"] as const;

export const PEDIDO_MINIMO = "300.00";
export const MINIMO_EMBALAGENS = 2;
export const TABELA_PADRAO_FALLBACK = "TP01";
export const LIMITE_HISTORICO_PEDIDOS = 10;

export type StatusPedido = (typeof STATUS_PEDIDO)[number];
export type UnidadeVenda = (typeof UNIDADES_VENDA)[number];
