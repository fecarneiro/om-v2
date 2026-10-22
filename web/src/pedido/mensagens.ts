import type { BloqueioDoPedido } from "@/pedido/bloqueios";

type ErroDoEnvio =
  | "cliente_nao_encontrado"
  | "cliente_fora_da_carteira"
  | "produto_nao_encontrado"
  | "produto_inativo"
  | "produto_sem_preco"
  | "quantidade_invalida"
  | "fora_do_multiplo"
  | "abaixo_do_minimo_de_embalagens";

export const MENSAGENS: Record<BloqueioDoPedido | ErroDoEnvio, string> = {
  item_invalido: "Corrija os itens com erro.",
  desconto_em_mais_de_um_produto: "Desconto permitido em apenas um item.",
  abaixo_do_pedido_minimo: "Pedido abaixo do mínimo.",
  credito_insuficiente: "Acima do crédito disponível.",
  cliente_nao_encontrado: "Cliente não encontrado.",
  cliente_fora_da_carteira: "Cliente fora da sua carteira.",
  produto_nao_encontrado: "Produto não encontrado.",
  produto_inativo: "Produto inativo.",
  produto_sem_preco: "Produto sem preço na tabela do cliente.",
  quantidade_invalida: "Quantidade inválida.",
  fora_do_multiplo: "Quantidade fora do múltiplo da embalagem.",
  abaixo_do_minimo_de_embalagens: "Quantidade abaixo do mínimo de embalagens.",
};

export function mensagemDoErro(codigo: string) {
  return (
    MENSAGENS[codigo as keyof typeof MENSAGENS] ??
    "Não foi possível enviar o pedido. Tente de novo."
  );
}
