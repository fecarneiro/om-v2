import { embalagensMinimas, validarDesconto, validarQuantidade } from "contracts/rules";
import type { ItemPedido } from "@/stores/pedido";

export function itemEmUnidades(item: ItemPedido) {
  return {
    quantidade: item.embalagens * item.produto.fator_embalagem,
    preco_unidade: item.produto.preco_unidade,
    desconto_percentual: item.desconto_percentual,
  };
}

export function itemParaApi(item: ItemPedido) {
  return {
    produto_id: item.produto.id,
    quantidade: itemEmUnidades(item).quantidade,
    desconto_percentual: item.desconto_percentual,
  };
}

export function validarEmbalagens(item: ItemPedido) {
  return validarQuantidade(item.produto, itemEmUnidades(item).quantidade);
}

export function itemValido(item: ItemPedido) {
  return validarEmbalagens(item) === null && validarDesconto(item.desconto_percentual) === null;
}

export function incrementarEmbalagens(item: ItemPedido) {
  return validarEmbalagens(item) ? embalagensMinimas(item.produto) : item.embalagens + 1;
}
