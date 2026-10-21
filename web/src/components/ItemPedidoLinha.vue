<script setup lang="ts">
import {
  acimaDaAlcada,
  embalagensMinimas,
  totalBrutoDoItem,
  totalLiquidoDoItem,
  validarDesconto,
} from "contracts/rules";
import { computed } from "vue";
import { emUnidades, validarEmbalagens } from "@/pedido/item";
import type { ItemPedido } from "@/stores/pedido";
import { exibicaoEmbalagens, exibicaoPreco, exibicaoUnidade } from "@/utils/exibicao-produto";
import { formatarMoeda } from "@/utils/moeda";

const props = defineProps<{ item: ItemPedido; alcada: number }>();
const emit = defineEmits<{
  alterar: [embalagens: number];
  alterarDesconto: [percentual: number];
  remover: [];
}>();

const produto = computed(() => props.item.produto);
const minimo = computed(() => embalagensMinimas(produto.value));
const erroQuantidade = computed(() => validarEmbalagens(props.item));
const erroDesconto = computed(() => validarDesconto(props.item.desconto_percentual));
const valido = computed(() => !erroQuantidade.value && !erroDesconto.value);
const bruto = computed(() => totalBrutoDoItem(emUnidades(props.item)));
const liquido = computed(() => totalLiquidoDoItem(emUnidades(props.item)));

function aumentar() {
  emit("alterar", erroQuantidade.value ? minimo.value : props.item.embalagens + 1);
}

function valorDigitado(evento: Event) {
  return Number((evento.target as HTMLInputElement).value);
}
</script>

<template>
  <strong>{{ produto.descricao }}</strong>
  <span>{{ exibicaoUnidade(produto) }}</span>
  <span>{{ exibicaoPreco(produto, produto.preco_unidade) }}</span>

  <span>
    <button
      type="button"
      :disabled="!!erroQuantidade || item.embalagens <= minimo"
      @click="emit('alterar', item.embalagens - 1)"
    >
      −
    </button>
    <input
      type="number"
      inputmode="numeric"
      :min="minimo"
      step="1"
      :value="item.embalagens"
      :aria-label="`Quantidade de ${produto.descricao}`"
      @input="emit('alterar', valorDigitado($event))"
    />
    <button type="button" @click="aumentar">+</button>
    {{ exibicaoEmbalagens(produto, item.embalagens) }}
    <template v-if="produto.unidade_venda !== 'UN' && !erroQuantidade">
      ({{ emUnidades(item).quantidade }} un)
    </template>
  </span>
  <span v-if="erroQuantidade === 'abaixo_do_minimo_de_embalagens'">
    Mínimo de {{ minimo }} {{ exibicaoEmbalagens(produto, minimo) }}.
  </span>
  <span v-else-if="erroQuantidade">Informe uma quantidade inteira.</span>

  <label :for="`desconto-${produto.id}`">Desconto (%)</label>
  <input
    :id="`desconto-${produto.id}`"
    type="number"
    inputmode="numeric"
    min="0"
    max="100"
    step="1"
    :value="item.desconto_percentual"
    @input="emit('alterarDesconto', valorDigitado($event))"
  />
  <span v-if="erroDesconto">Informe um desconto inteiro entre 0 e 100.</span>
  <span v-else-if="acimaDaAlcada(item.desconto_percentual, alcada)">Acima da alçada</span>

  <span v-if="!valido">—</span>
  <span v-else>
    <s v-if="item.desconto_percentual > 0">{{ formatarMoeda(bruto.toFixed(2)) }}</s>
    {{ formatarMoeda(liquido.toFixed(2)) }}
  </span>
  <button type="button" @click="emit('remover')">Remover</button>
</template>
