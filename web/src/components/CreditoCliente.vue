<script setup lang="ts">
import Big from "big.js";
import type { ClienteCarteira } from "contracts/schemas";
import { computed } from "vue";
import { formatarMoeda } from "@/utils/moeda";

const props = defineProps<{ cliente: ClienteCarteira; totalPedido: Big }>();

const limite = computed(() => new Big(props.cliente.limite_credito));
const utilizado = computed(() => new Big(props.cliente.credito_utilizado));
const comPedido = computed(() => utilizado.value.plus(props.totalPedido));
const restante = computed(() => limite.value.minus(comPedido.value));
const escala = computed(() => (comPedido.value.gt(limite.value) ? comPedido.value : limite.value));

const segmentos = computed(() => {
  const livreAntes = maior(limite.value.minus(utilizado.value), new Big(0));
  return {
    utilizado: largura(menor(utilizado.value, limite.value)),
    pedido: largura(menor(props.totalPedido, livreAntes)),
    excedente: largura(maior(restante.value.times(-1), new Big(0))),
  };
});

function menor(a: Big, b: Big) {
  return a.lt(b) ? a : b;
}

function maior(a: Big, b: Big) {
  return a.gt(b) ? a : b;
}

function largura(valor: Big) {
  if (escala.value.lte(0)) return "0%";
  return `${valor.div(escala.value).times(100).toFixed(2)}%`;
}
</script>

<template>
  <div class="grid gap-2">
    <div class="flex items-baseline justify-between gap-3 text-sm tabular-nums">
      <span>Crédito</span>
      <span v-if="restante.gte(0)">
        <strong class="font-semibold">{{ formatarMoeda(restante.toFixed(2)) }}</strong>
        <span class="text-muted-foreground">
          disponível de {{ formatarMoeda(limite.toFixed(2)) }}
        </span>
      </span>
      <strong v-else class="text-destructive font-semibold">
        Excede em {{ formatarMoeda(restante.times(-1).toFixed(2)) }}
      </strong>
    </div>
    <div class="bg-secondary flex h-2 overflow-hidden rounded-full">
      <span class="bg-muted-foreground" :style="{ width: segmentos.utilizado }" />
      <span class="bg-primary" :style="{ width: segmentos.pedido }" />
      <span class="bg-destructive" :style="{ width: segmentos.excedente }" />
    </div>
    <div class="text-muted-foreground flex flex-wrap justify-between gap-x-4 gap-y-1 text-[13px] tabular-nums">
      <span class="inline-flex items-center gap-1.5">
        <i class="bg-muted-foreground size-2 rounded-xs" />
        Já utilizado {{ formatarMoeda(utilizado.toFixed(2)) }}
      </span>
      <span v-if="totalPedido.gt(0)" class="inline-flex items-center gap-1.5">
        <i class="bg-primary size-2 rounded-xs" />
        Este pedido {{ formatarMoeda(totalPedido.toFixed(2)) }}
      </span>
      <span v-if="restante.lt(0)" class="text-destructive inline-flex items-center gap-1.5">
        <i class="bg-destructive size-2 rounded-xs" />
        Excedente {{ formatarMoeda(restante.times(-1).toFixed(2)) }}
      </span>
    </div>
  </div>
</template>
