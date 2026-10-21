import { PEDIDO_MINIMO } from "contracts/constants";
import type { BloqueioDoPedido } from "@/pedido/bloqueios";
import { formatarMoeda } from "@/utils/moeda";

export const MENSAGENS: Record<BloqueioDoPedido, string> = {
  item_invalido: "Corrija os itens com erro.",
  desconto_em_mais_de_um_produto: "Desconto permitido em apenas um item do pedido.",
  abaixo_do_pedido_minimo: `Pedido abaixo do mínimo de ${formatarMoeda(PEDIDO_MINIMO)}.`,
  credito_insuficiente: "Total acima do crédito disponível do cliente.",
};
