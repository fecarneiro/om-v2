import type { Vendedor } from "contracts/schemas";
import { defineStore } from "pinia";
import { ref } from "vue";
import { usePedidoStore } from "./pedido";

const CHAVE = "sessao.vendedor";

export const useSessaoStore = defineStore("sessao", () => {
  const salvo = localStorage.getItem(CHAVE);
  const vendedor = ref<Vendedor | null>(salvo ? JSON.parse(salvo) : null);

  function entrar(v: Vendedor) {
    vendedor.value = v;
    localStorage.setItem(CHAVE, JSON.stringify(v));
  }

  function sair() {
    usePedidoStore().limpar();
    vendedor.value = null;
    localStorage.removeItem(CHAVE);
  }

  return { vendedor, entrar, sair };
});
