import { StorageSerializers, useLocalStorage } from "@vueuse/core";
import type { Vendedor } from "contracts/schemas";
import { defineStore } from "pinia";
import { usePedidoStore } from "./pedido";

export const useSessaoStore = defineStore("sessao", () => {
  const vendedor = useLocalStorage<Vendedor | null>("sessao.vendedor", null, {
    serializer: StorageSerializers.object,
  });

  function entrar(v: Vendedor) {
    vendedor.value = v;
  }

  function sair() {
    usePedidoStore().limpar();
    vendedor.value = null;
  }

  return { vendedor, entrar, sair };
});
