<script setup lang="ts">
import {
  definirStatusEnvio,
  totalBrutoDoPedido,
  totalLiquidoDoPedido,
  validarDescontos,
} from "contracts/rules";
import { computed } from "vue";
import { emUnidades, itemValido } from "@/pedido/item";
import type { ItemPedido } from "@/stores/pedido";
import { formatarMoeda } from "@/utils/moeda";

const props = defineProps<{ itens: ItemPedido[]; alcada: number }>();

const itensEmUnidades = computed(() => props.itens.filter(itemValido).map(emUnidades));
const bruto = computed(() => totalBrutoDoPedido(itensEmUnidades.value));
const liquido = computed(() => totalLiquidoDoPedido(itensEmUnidades.value));
const desconto = computed(() => bruto.value.minus(liquido.value));
const status = computed(() => definirStatusEnvio(props.itens, props.alcada));
</script>

<template>
  <template v-if="desconto.gt(0)">
    <p>Subtotal: {{ formatarMoeda(bruto.toFixed(2)) }}</p>
    <p>Desconto: −{{ formatarMoeda(desconto.toFixed(2)) }}</p>
  </template>
  <p>Total do pedido: {{ formatarMoeda(liquido.toFixed(2)) }}</p>
  <p v-if="status === 'aguardando_aprovacao'">
    Este pedido vai para aprovação do supervisor (desconto acima da sua alçada de {{ alcada }}%).
  </p>
  <p v-if="validarDescontos(itens)">Desconto permitido em apenas um item do pedido.</p>
</template>
