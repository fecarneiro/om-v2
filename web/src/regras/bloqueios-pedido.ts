import { validarCredito, validarDescontos, validarPedidoMinimo } from "contracts/rules";
import type { ClienteCarteira } from "contracts/schemas";
import { itemEmUnidades, itemValido } from "@/regras/item-pedido";
import type { ItemPedido } from "@/stores/pedido";

export type BloqueioDoPedido =
  | "item_invalido"
  | "desconto_em_mais_de_um_produto"
  | "abaixo_do_pedido_minimo"
  | "credito_insuficiente";

export function bloqueiosDoPedido(itens: ItemPedido[], cliente: ClienteCarteira) {
  const validos = itens.filter(itemValido).map(itemEmUnidades);
  const bloqueios: BloqueioDoPedido[] = [];

  if (validos.length < itens.length) bloqueios.push("item_invalido");

  const erroDesconto = validarDescontos(itens);
  if (erroDesconto) bloqueios.push(erroDesconto);

  const erroMinimo = validarPedidoMinimo(validos);
  if (erroMinimo) bloqueios.push(erroMinimo);

  const erroCredito = validarCredito(cliente, validos);
  if (erroCredito) bloqueios.push(erroCredito);

  return bloqueios;
}
