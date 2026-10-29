import { useLocalStorage } from "@vueuse/core";
import { embalagensMinimas } from "contracts/rules";
import type { PedidoHistorico, ProdutoDisponivel } from "contracts/schemas";
import { defineStore } from "pinia";
import { ref } from "vue";
import ItensPedido from "@/components/pedido/ItensPedido.vue";
import { itensParaRepetir } from "@/regras/item-pedido";

export type ItemPedido = {
  produto: ProdutoDisponivel;
  embalagens: number;
  desconto_percentual: number;
};

export const usePedidoStore = defineStore("pedido", () => {
  const itensPorCliente = useLocalStorage<Record<string, ItemPedido[]>>("pedido.rascunhos", {});

  function itens(clienteId: string) {
    return itensPorCliente.value[clienteId] ?? [];
  }

  function adicionar(clienteId: string, produto: ProdutoDisponivel) {
    if (itens(clienteId).some((item) => item.produto.id === produto.id)) return;
    itensPorCliente.value[clienteId] = [
      ...itens(clienteId),
      { produto, embalagens: embalagensMinimas(produto), desconto_percentual: 0 },
    ];
  }

  function alterarEmbalagens(item: ItemPedido, embalagens: number) {
    item.embalagens = embalagens;
  }

  function alterarDesconto(item: ItemPedido, percentual: number) {
    item.desconto_percentual = percentual;
  }

  function remover(clienteId: string, item: ItemPedido) {
    itensPorCliente.value[clienteId] = itens(clienteId).filter(
      (outro) => outro.produto.id !== item.produto.id,
    );
  }

  function repetir(clienteId: string, historico: PedidoHistorico) {
    itensPorCliente.value[clienteId] = itensParaRepetir(historico);
  }

  function esvaziar(clienteId: string) {
    itensPorCliente.value[clienteId] = [];
  }

  function limpar() {
    itensPorCliente.value = {};
  }

  return {
    itens,
    itensPorCliente,
    adicionar,
    alterarEmbalagens,
    alterarDesconto,
    remover,
    repetir,
    esvaziar,
    limpar,
  };
});
