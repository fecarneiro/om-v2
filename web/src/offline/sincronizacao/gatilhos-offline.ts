import { useDocumentVisibility, useEventListener, useIntervalFn } from "@vueuse/core";
import { watch } from "vue";
import { useFilaEnvioOfflineStore } from "@/offline/stores/fila-envio";
import { useSincronizacaoOfflineStore } from "@/offline/stores/sincronizacao";
import { useSessaoStore } from "@/stores/sessao";

const INTERVALO_SINCRONIZACAO_OFFLINE = 15 * 60 * 1000;

export function useGatilhosSincronizacaoOffline() {
  const sessao = useSessaoStore();
  const sincronizacao = useSincronizacaoOfflineStore();
  const filaEnvio = useFilaEnvioOfflineStore();
  const visibilidade = useDocumentVisibility();
  let ultimaTentativa = 0;

  async function sincronizar() {
    if (!sessao.vendedor || !navigator.onLine) return;
    const vendedorId = sessao.vendedor.id;
    ultimaTentativa = Date.now();
    try {
      await filaEnvio.processar(vendedorId);
      await sincronizacao.sincronizar(vendedorId);
    } catch (erro) {
      console.warn("Falha na sincronização offline", erro);
    }
  }

  watch(
    () => sessao.vendedor?.id,
    async (vendedorId) => {
      if (vendedorId)
        await Promise.all([
          sincronizacao.carregarUltimaSincronizacao(vendedorId),
          filaEnvio.carregar(vendedorId),
        ]);
      sincronizar();
    },
    { immediate: true },
  );
  useEventListener(window, "online", sincronizar);
  useIntervalFn(sincronizar, INTERVALO_SINCRONIZACAO_OFFLINE);
  watch(visibilidade, (estado) => {
    const desatualizado = Date.now() - ultimaTentativa >= INTERVALO_SINCRONIZACAO_OFFLINE;
    if (estado === "visible" && desatualizado) sincronizar();
  });
}
