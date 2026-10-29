import { clienteCarteiraSchema, produtoBuscaSchema } from "contracts/schemas";
import { defineStore } from "pinia";
import { ref } from "vue";
import { get } from "@/api/client";
import {
  lerCarteiraOffline,
  salvarCarteiraOffline,
  salvarCatalogoOffline,
} from "@/offline/banco/armazenamento-offline";

// Intencionalmente não limpa dados de carteira/catálogo de um vendedor ao deslogar

async function baixarDadosOffline(vendedorId: string) {
  const carteira = await get(`/vendedores/${vendedorId}/clientes`, clienteCarteiraSchema.array());
  await salvarCarteiraOffline(vendedorId, carteira);

  await Promise.all(
    carteira.map(async (cliente) => {
      const catalogo = await get(`/clientes/${cliente.id}/catalogo`, produtoBuscaSchema.array());
      await salvarCatalogoOffline(cliente.id, catalogo);
    }),
  );
}

export const useSincronizacaoOfflineStore = defineStore("sincronizacao-offline", () => {
  const ultimaSincronizacao = ref<string | null>(null);
  const sincronizando = ref(false);

  async function carregarUltimaSincronizacao(vendedorId: string) {
    const carteira = await lerCarteiraOffline(vendedorId);
    ultimaSincronizacao.value = carteira?.sincronizado_em ?? null;
  }

  async function sincronizar(vendedorId: string) {
    if (sincronizando.value) return;
    sincronizando.value = true;
    try {
      await baixarDadosOffline(vendedorId);
      ultimaSincronizacao.value = new Date().toISOString();
    } finally {
      sincronizando.value = false;
    }
  }

  return { ultimaSincronizacao, sincronizando, carregarUltimaSincronizacao, sincronizar };
});
