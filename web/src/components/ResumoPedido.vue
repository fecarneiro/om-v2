<script setup lang="ts">
import Big from "big.js";
import { PEDIDO_MINIMO } from "contracts/constants";
import {
  definirStatusEnvio,
  totalBrutoDoPedido,
  totalLiquidoDoPedido,
} from "contracts/rules";
import type { ClienteCarteira } from "contracts/schemas";
import { computed } from "vue";
import { bloqueiosDoPedido } from "@/pedido/bloqueios";
import { emUnidades, itemValido } from "@/pedido/item";
import { MENSAGENS } from "@/pedido/mensagens";
import type { ItemPedido } from "@/stores/pedido";
import { formatarMoeda } from "@/utils/moeda";

const props = defineProps<{ itens: ItemPedido[]; cliente: ClienteCarteira; alcada: number }>();
const emit = defineEmits<{ enviar: [] }>();

const itensEmUnidades = computed(() => props.itens.filter(itemValido).map(emUnidades));
const bruto = computed(() => totalBrutoDoPedido(itensEmUnidades.value));
const liquido = computed(() => totalLiquidoDoPedido(itensEmUnidades.value));
const desconto = computed(() => bruto.value.minus(liquido.value));
const faltaParaMinimo = computed(() => new Big(PEDIDO_MINIMO).minus(bruto.value));
const status = computed(() => definirStatusEnvio(props.itens, props.alcada));
const bloqueios = computed(() => bloqueiosDoPedido(props.itens, props.cliente));
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

  <ul v-if="bloqueios.length > 0">
    <li v-for="bloqueio in bloqueios" :key="bloqueio">
      {{ MENSAGENS[bloqueio] }}
      <template v-if="bloqueio === 'abaixo_do_pedido_minimo'">
        Faltam {{ formatarMoeda(faltaParaMinimo.toFixed(2)) }}.
      </template>
      <template v-if="bloqueio === 'credito_insuficiente'">
        Crédito disponível: {{ formatarMoeda(cliente.credito_disponivel) }}.
      </template>
    </li>
  </ul>

  <button type="button" :disabled="bloqueios.length > 0" @click="emit('enviar')">
    Enviar pedido
  </button>
</template>
