import Big from "big.js";
import { MINIMO_EMBALAGENS, PEDIDO_MINIMO, TABELA_PADRAO_FALLBACK } from "../constants/index.js";
import type { Produto } from "../schemas/produtos.schema.js";

// Types
type Cliente = {
  vendedor_id: string;
  tabela_preco_id: string | null;
  limite_credito: string;
  credito_utilizado: string;
};
type ItemDoPedido = { quantidade: number; preco_unidade: string };
type ItemComDesconto = ItemDoPedido & { desconto_percentual: number };

type DisponibilidadeProduto =
  | { disponivel: true; preco_unidade: string }
  | { disponivel: false; motivo: "produto_inativo" | "produto_sem_preco" };

// Domain rules
export function pertenceACarteira(cliente: Pick<Cliente, "vendedor_id">, vendedorId: string) {
  return cliente.vendedor_id === vendedorId;
}

export function tabelaDoCliente(cliente: Pick<Cliente, "tabela_preco_id">) {
  return {
    tabela_preco_id: cliente.tabela_preco_id ?? TABELA_PADRAO_FALLBACK,
    tabela_preco_pendente: cliente.tabela_preco_id === null,
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

export function embalagensMinimas(produto: Pick<Produto, "venda_somente_multiplo">) {
  return produto.venda_somente_multiplo ? MINIMO_EMBALAGENS : 1;
}

export function unidadesEmEmbalagens(
  produto: Pick<Produto, "fator_embalagem" | "venda_somente_multiplo">,
  quantidade: number,
) {
  return Math.max(Math.ceil(quantidade / produto.fator_embalagem), embalagensMinimas(produto));
}

export function validarQuantidade(
  produto: Pick<Produto, "fator_embalagem" | "venda_somente_multiplo">,
  quantidade: number,
) {
  if (!Number.isInteger(quantidade) || quantidade <= 0) return "quantidade_invalida";
  if (quantidade % produto.fator_embalagem !== 0) return "fora_do_multiplo";
  if (quantidade < produto.fator_embalagem * embalagensMinimas(produto))
    return "abaixo_do_minimo_de_embalagens";
  return null;
}

export function validarDesconto(percentual: number) {
  if (!Number.isInteger(percentual) || percentual < 0 || percentual > 100)
    return "desconto_invalido";
  return null;
}

export function validarDescontos(itens: { desconto_percentual: number }[]) {
  const itensComDesconto = itens.filter((item) => item.desconto_percentual > 0);
  if (itensComDesconto.length > 1) return "desconto_em_mais_de_um_produto";
  return null;
}

export function acimaDaAlcada(percentual: number, alcadaPercentual: number) {
  return percentual > alcadaPercentual;
}

export function definirStatusEnvio(
  itens: { desconto_percentual: number }[],
  alcadaPercentual: number,
) {
  return itens.some((item) => acimaDaAlcada(item.desconto_percentual, alcadaPercentual))
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
