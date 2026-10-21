import Big from "big.js";
import type { Cliente, PedidoItem, Produto } from "../db/schema.js";

// Types
type ItemDoPedido = Pick<PedidoItem, "quantidade" | "preco_unidade">;
type ItemComDesconto = Pick<PedidoItem, "quantidade" | "preco_unidade" | "desconto_percentual">;

type DisponibilidadeProduto =
  | { disponivel: true; preco_unidade: string }
  | { disponivel: false; motivo: "produto_inativo" | "produto_sem_preco" };

// Constants
export const TABELA_PADRAO_FALLBACK = "TP01";
export const MINIMO_EMBALAGENS = 2;
export const PEDIDO_MINIMO = new Big("300");

// Domain rules
export function pertenceACarteira(cliente: Pick<Cliente, "vendedor_id">, vendedorId: string) {
  return cliente.vendedor_id === vendedorId;
}

export function tabelaDoCliente(cliente: Pick<Cliente, "tabela_preco_id">) {
  return {
    tabela_preco_id: cliente.tabela_preco_id ?? TABELA_PADRAO_FALLBACK,
    usa_tabela_padrao: cliente.tabela_preco_id === null,
  };
}

export function disponibilidadeDoProduto(
  produto: Pick<Produto, "ativo">,
  precoUnidade: string | null,
): DisponibilidadeProduto {
  if (!produto.ativo) return { disponivel: false, motivo: "produto_inativo" };
  if (precoUnidade === null) return { disponivel: false, motivo: "produto_sem_preco" };
  return { disponivel: true, preco_unidade: precoUnidade };
}

export function validarQuantidade(
  produto: Pick<Produto, "fator_embalagem" | "venda_somente_multiplo">,
  quantidade: number,
) {
  if (!Number.isInteger(quantidade) || quantidade <= 0) return "quantidade_invalida";
  if (quantidade % produto.fator_embalagem !== 0) return "fora_do_multiplo";
  if (produto.venda_somente_multiplo && quantidade < produto.fator_embalagem * MINIMO_EMBALAGENS)
    return "abaixo_do_minimo_de_embalagens";
  return null;
}

export function validarDescontos(itens: { desconto_percentual: number }[]) {
  const itensComDesconto = itens.filter((item) => item.desconto_percentual > 0);
  if (itensComDesconto.length > 1) return "desconto_em_mais_de_um_produto";
  return null;
}

export function definirStatusEnvio(
  itens: { desconto_percentual: number }[],
  alcadaPercentual: number,
) {
  return itens.some((item) => item.desconto_percentual > alcadaPercentual)
    ? "aguardando_aprovacao"
    : "enviado";
}

export function totalBrutoDoItem(item: ItemDoPedido) {
  return new Big(item.preco_unidade).times(item.quantidade);
}

export function totalBrutoDoPedido(itens: ItemDoPedido[]) {
  return itens.reduce((total, item) => total.plus(totalBrutoDoItem(item)), new Big(0));
}

export function validarPedidoMinimo(itens: ItemDoPedido[]) {
  if (totalBrutoDoPedido(itens).lt(PEDIDO_MINIMO)) return "abaixo_do_pedido_minimo";
  return null;
}

export function totalLiquidoDoItem(item: ItemComDesconto) {
  const fator = new Big(100).minus(item.desconto_percentual).div(100);
  return totalBrutoDoItem(item).times(fator).round(2, Big.roundHalfUp);
}

export function totalLiquidoDoPedido(itens: ItemComDesconto[]) {
  return itens.reduce((total, item) => total.plus(totalLiquidoDoItem(item)), new Big(0));
}

export function creditoDisponivel(cliente: Pick<Cliente, "limite_credito" | "credito_utilizado">) {
  return new Big(cliente.limite_credito).minus(cliente.credito_utilizado);
}

export function validarCredito(
  cliente: Pick<Cliente, "limite_credito" | "credito_utilizado">,
  itens: ItemComDesconto[],
) {
  if (totalLiquidoDoPedido(itens).gt(creditoDisponivel(cliente))) return "credito_insuficiente";
  return null;
}
