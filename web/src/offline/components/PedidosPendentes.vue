<script setup lang="ts">
import { useFilaEnvioOfflineStore } from "@/offline/stores/fila-envio";
import { mensagemDoErro } from "@/utils/mensagens-erro";
import { formatarMoeda } from "@/utils/moeda";

const filaEnvio = useFilaEnvioOfflineStore();
</script>

<template>
  <section v-if="filaEnvio.pedidos.length || filaEnvio.recusados.length" class="px-5 pb-6">
    <h2 class="mb-2 text-sm font-semibold">Pedidos pendentes</h2>
    <ul class="divide-y rounded-lg border text-sm">
      <li
        v-for="pedido in filaEnvio.pedidos"
        :key="pedido.chave_idempotencia"
        class="grid grid-cols-[1fr_auto] gap-x-3 px-4 py-3"
      >
        <span class="font-semibold">{{ pedido.cliente_nome }}</span>
        <span class="text-right tabular-nums">{{ formatarMoeda(pedido.total) }}</span>
        <span class="text-muted-foreground col-span-2 text-xs">Aguardando conexão</span>
      </li>
      <li
        v-for="{ pedido, codigo } in filaEnvio.recusados"
        :key="pedido.chave_idempotencia"
        class="grid grid-cols-[1fr_auto] gap-x-3 px-4 py-3"
      >
        <span class="font-semibold">✕ {{ pedido.cliente_nome }}</span>
        <span class="text-right tabular-nums">{{ formatarMoeda(pedido.total) }}</span>
        <span class="text-destructive col-span-2 text-xs">Recusado: {{ mensagemDoErro(codigo) }}</span>
      </li>
    </ul>
  </section>
</template>
