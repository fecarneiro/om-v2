import type { Vendedor } from "contracts/schemas";
import { defineStore } from "pinia";
import { ref } from "vue";

const CHAVE = "sessao.vendedor";

export const useSessaoStore = defineStore("sessao", () => {
  const salvo = localStorage.getItem(CHAVE);
  const vendedor = ref<Vendedor | null>(salvo ? JSON.parse(salvo) : null);

  function entrar(v: Vendedor) {
    vendedor.value = v;
    localStorage.setItem(CHAVE, JSON.stringify(v));
  }

  function sair() {
    vendedor.value = null;
    localStorage.removeItem(CHAVE);
  }

  return { vendedor, entrar, sair };
});
