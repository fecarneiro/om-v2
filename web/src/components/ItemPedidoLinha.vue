<script setup lang="ts">
import { Minus, Plus } from "@lucide/vue";
import {
  acimaDaAlcada,
  embalagensMinimas,
  totalBrutoDoItem,
  totalLiquidoDoItem,
  validarDesconto,
} from "contracts/rules";
import { computed } from "vue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { emUnidades, validarEmbalagens } from "@/pedido/item";
import type { ItemPedido } from "@/stores/pedido";
import { exibicaoEmbalagens } from "@/utils/exibicao-produto";
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
const acima = computed(() => acimaDaAlcada(props.item.desconto_percentual, props.alcada));

function aumentar() {
  emit("alterar", erroQuantidade.value ? minimo.value : props.item.embalagens + 1);
}

function valorDigitado(evento: Event) {
  return Number((evento.target as HTMLInputElement).value);
}

function alterarDesconto(valor: string | number) {
  emit("alterarDesconto", Number(valor));
}
</script>

<template>
  <div class="grid grid-cols-[1fr_auto] gap-x-3 gap-y-2.5 px-5 py-3.5 lg:px-6">
    <div>
      <p class="font-semibold">{{ produto.descricao }}</p>
      <p class="text-muted-foreground text-sm tabular-nums">
        {{ item.embalagens }} {{ exibicaoEmbalagens(produto, item.embalagens) }}
        <template v-if="produto.unidade_venda !== 'UN'">
          de {{ produto.fator_embalagem }}<template v-if="!erroQuantidade">
            ({{ emUnidades(item).quantidade }} un)</template>
        </template>
        a {{ formatarMoeda(produto.preco_unidade) }}/un
      </p>
    </div>
    <div class="text-right font-semibold tabular-nums">
      <template v-if="valido">
        {{ formatarMoeda(liquido.toFixed(2)) }}
        <p v-if="item.desconto_percentual > 0" class="text-muted-foreground text-sm font-normal">
          <s>{{ formatarMoeda(bruto.toFixed(2)) }}</s>
        </p>
      </template>
      <template v-else>—</template>
    </div>

    <div class="col-span-2 flex flex-wrap items-center gap-x-4 gap-y-2">
      <div class="bg-input inline-flex items-center rounded-full">
          <Button
            variant="ghost"
            size="icon"
            class="text-foreground"
            :aria-label="`Diminuir quantidade de ${produto.descricao}`"
            :disabled="!!erroQuantidade || item.embalagens <= minimo"
            @click="emit('alterar', item.embalagens - 1)"
          >
            <Minus />
          </Button>
          <input
            type="number"
            inputmode="numeric"
            :min="minimo"
            step="1"
            :value="item.embalagens"
            :aria-label="`Quantidade de ${produto.descricao}`"
            :aria-invalid="!!erroQuantidade"
            class="aria-invalid:text-destructive w-10 bg-transparent text-center font-semibold tabular-nums outline-none"
            @input="emit('alterar', valorDigitado($event))"
          />
          <Button
            variant="ghost"
            size="icon"
            class="text-foreground"
            :aria-label="`Aumentar quantidade de ${produto.descricao}`"
            @click="aumentar"
          >
            <Plus />
          </Button>
      </div>

      <div class="text-muted-foreground inline-flex items-center gap-1.5 text-sm">
        <label :for="`desconto-${produto.id}`">Desc.</label>
        <Input
          :id="`desconto-${produto.id}`"
          type="number"
          inputmode="numeric"
          min="0"
          max="100"
          step="1"
          :model-value="item.desconto_percentual"
          :aria-invalid="!!erroDesconto"
          :class="['h-8 w-14 px-2 text-right text-sm tabular-nums', { 'border-warning': acima }]"
          @update:model-value="alterarDesconto"
        />
        %
      </div>

      <Button variant="ghost" size="sm" class="ml-auto" @click="emit('remover')">Remover</Button>
    </div>

    <p v-if="erroQuantidade" class="text-destructive col-span-2 text-sm">
      <template v-if="erroQuantidade === 'abaixo_do_minimo_de_embalagens'">
        Mínimo de {{ minimo }} {{ exibicaoEmbalagens(produto, minimo) }}.
      </template>
      <template v-else>Informe uma quantidade inteira.</template>
    </p>
    <p v-if="erroDesconto" class="text-destructive col-span-2 text-sm">
      Informe um desconto inteiro entre 0 e 100.
    </p>
    <p v-else-if="acima" class="text-warning col-span-2 text-sm">
      Desconto acima da sua alçada de {{ alcada }}%.
    </p>
  </div>
</template>
