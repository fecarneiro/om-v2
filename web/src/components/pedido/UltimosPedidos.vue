<script setup lang="ts">
import { ChevronDown } from "@lucide/vue";
import { totalLiquidoDoItem, totalLiquidoDoPedido } from "contracts/rules";
import type { PedidoHistorico } from "contracts/schemas";
import { computed } from "vue";
import { Button } from "@/components/ui/button";
import { itemEmUnidades, itensParaRepetir } from "@/regras/item-pedido";
import { formatarData } from "@/utils/data";
import { nomeDoStatus } from "@/utils/exibicao-pedido";
import { nomeDaEmbalagem } from "@/utils/exibicao-produto";
import { MENSAGENS } from "@/utils/mensagens-erro";
import { formatarMoeda } from "@/utils/moeda";

const props = defineProps<{ pedidos: PedidoHistorico[] }>();
const emit = defineEmits<{ repetir: [pedido: PedidoHistorico] }>();

const historico = computed(() =>
  props.pedidos.map((pedido) => {
    const itens = itensParaRepetir(pedido);
    return {
      pedido,
      itens,
      indisponiveis: pedido.itens.filter((item) => !item.produto.disponivel),
      total: totalLiquidoDoPedido(itens.map(itemEmUnidades)),
    };
  }),
);
</script>

<template>
  <p v-if="pedidos.length === 0" class="text-muted-foreground px-5 py-10 text-center text-sm">
    Nenhum pedido anterior para este cliente.
  </p>
  <ul v-else class="divide-y border-b">
    <li v-for="{ pedido, itens, indisponiveis, total } in historico" :key="pedido.id">
      <details class="group">
        <summary
          class="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-3.5 [&::-webkit-details-marker]:hidden"
        >
          <div>
            <p class="text-sm">{{ formatarData(pedido.data) }} · {{ nomeDoStatus(pedido.status) }}</p>
            <p class="text-muted-foreground text-xs">
              {{ pedido.itens.length }} {{ pedido.itens.length === 1 ? "item" : "itens" }}
              <template v-if="indisponiveis.length">
                · {{ indisponiveis.length }}
                {{ indisponiveis.length === 1 ? "indisponível" : "indisponíveis" }}
              </template>
            </p>
          </div>
          <ChevronDown class="text-muted-foreground size-4 transition-transform group-open:rotate-180" />
        </summary>

        <div class="grid gap-2.5 px-5 pb-4">
          <div v-for="item in itens" :key="item.produto.id" class="grid grid-cols-[1fr_auto] gap-x-3 text-sm">
            <p class="font-semibold">{{ item.produto.descricao }}</p>
            <p class="text-right tabular-nums">
              {{ formatarMoeda(totalLiquidoDoItem(itemEmUnidades(item)).toFixed(2)) }}
            </p>
            <p class="text-muted-foreground text-xs tabular-nums">
              {{ item.embalagens }} {{ nomeDaEmbalagem(item.produto, item.embalagens) }}
              <template v-if="item.produto.unidade_venda !== 'UN'">
                de {{ item.produto.fator_embalagem }} ({{ itemEmUnidades(item).quantidade }} un)
              </template>
              a {{ formatarMoeda(item.produto.preco_unidade) }}/un
            </p>
          </div>

          <div
            v-for="item in indisponiveis"
            :key="item.produto.id"
            class="text-muted-foreground grid text-sm"
          >
            <p class="font-semibold">{{ item.produto.descricao }}</p>
            <p v-if="!item.produto.disponivel" class="text-xs">
              {{ MENSAGENS[item.produto.motivo] }} Não entra no pedido.
            </p>
          </div>

          <div class="flex items-center justify-between border-t border-dashed pt-3">
            <p class="text-muted-foreground text-sm">
              Hoje:
              <span class="text-foreground font-semibold tabular-nums">
                {{ formatarMoeda(total.toFixed(2)) }}
              </span>
            </p>
            <Button size="sm" variant="outline" :disabled="itens.length === 0" @click="emit('repetir', pedido)">
              Repetir
            </Button>
          </div>
        </div>
      </details>
    </li>
  </ul>
</template>
