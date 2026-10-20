export const UNIDADES_VENDA = ["UN", "CX", "FD"] as const;

export type UnidadeVenda = (typeof UNIDADES_VENDA)[number];
