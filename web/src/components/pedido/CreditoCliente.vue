<script setup lang="ts">
import Big from "big.js";
import type { ClienteCarteira } from "contracts/schemas";
import { computed } from "vue";
import { formatarMoeda } from "@/utils/moeda";

const props = defineProps<{ cliente: ClienteCarteira; totalPedido: Big }>();

const disponivel = computed(() => new Big(props.cliente.credito_disponivel));
const restante = computed(() => disponivel.value.minus(props.totalPedido));
const excede = computed(() => restante.value.lt(0));

const percentual = computed(() => {
  if (disponivel.value.lte(0)) return props.totalPedido.gt(0) ? 100 : 0;
  return Math.min(props.totalPedido.div(disponivel.value).times(100).toNumber(), 100);
});
</script>

<template>
  <div class="grid gap-1.5">
    <div class="flex items-baseline justify-between gap-3 text-sm tabular-nums">
      <span class="text-muted-foreground">Crédito disponível</span>
      <strong v-if="excede" class="text-destructive font-semibold">
        Excede em {{ formatarMoeda(restante.times(-1).toFixed(2)) }}
      </strong>
      <strong v-else class="font-semibold">{{ formatarMoeda(restante.toFixed(2)) }}</strong>
    </div>
    <div
      role="progressbar"
      aria-label="Crédito usado por este pedido"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-valuenow="Math.round(percentual)"
      class="bg-secondary h-1 overflow-hidden rounded-full"
    >
      <div
        class="h-full"
        :class="excede ? 'bg-destructive' : 'bg-primary'"
        :style="{ width: `${percentual}%` }"
      />
    </div>
  </div>
</template>
