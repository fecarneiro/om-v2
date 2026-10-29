import { pedidoEnviadoSchema } from "contracts/schemas";
import { defineStore } from "pinia";
import { ref } from "vue";
import { post } from "@/api/client";
import { ApiError } from "@/api/errors";
import {
  adicionarNaFilaEnvioOffline,
  lerFilaEnvioOffline,
  type PedidoNaFilaEnvio,
  removerDaFilaEnvioOffline,
} from "@/offline/banco/armazenamento-offline";

export type PedidoRecusadoNaFilaEnvio = { pedido: PedidoNaFilaEnvio; codigo: string };

export const useFilaEnvioOfflineStore = defineStore("fila-envio-offline", () => {
  const pedidos = ref<PedidoNaFilaEnvio[]>([]);
  const recusados = ref<PedidoRecusadoNaFilaEnvio[]>([]);
  const processando = ref(false);

  async function carregar(vendedorId: string) {
    pedidos.value = await lerFilaEnvioOffline(vendedorId);
  }

  function temPendente(clienteId: string) {
    return pedidos.value.some((pedido) => pedido.cliente_id === clienteId);
  }

  async function enfileirar(vendedorId: string, pedido: PedidoNaFilaEnvio) {
    await adicionarNaFilaEnvioOffline(vendedorId, pedido);
    await carregar(vendedorId);
  }

  async function processar(vendedorId: string) {
    if (processando.value) return;
    processando.value = true;
    try {
      for (const pedido of await lerFilaEnvioOffline(vendedorId)) {
        try {
          await post("/pedidos", pedido.pedido, pedidoEnviadoSchema, {
            headers: { "Idempotency-Key": pedido.chave_idempotencia },
          });
        } catch (erro) {
          if (!(erro instanceof ApiError) || erro.status >= 500) break;
          recusados.value.push({ pedido, codigo: erro.codigo });
        }
        await removerDaFilaEnvioOffline(vendedorId, pedido.chave_idempotencia);
        await carregar(vendedorId);
      }
    } finally {
      processando.value = false;
    }
  }

  return { pedidos, recusados, processando, carregar, temPendente, enfileirar, processar };
});
