<script setup lang="ts">
import ItemPedidoLinha from "@/components/pedido/ItemPedidoLinha.vue";
import type { ItemPedido } from "@/stores/pedido";

defineProps<{ itens: ItemPedido[]; alcada: number }>();
const emit = defineEmits<{
  alterar: [item: ItemPedido, embalagens: number];
  alterarDesconto: [item: ItemPedido, percentual: number];
  remover: [item: ItemPedido];
}>();
</script>

<template>
  <p v-if="itens.length === 0" class="text-muted-foreground px-5 py-10 text-center text-sm">
    Nenhum item no pedido. Busque produtos para adicionar.
  </p>
  <ul v-else class="divide-y border-b">
    <li v-for="item in itens" :key="item.produto.id">
      <ItemPedidoLinha
        :item="item"
        :alcada="alcada"
        @alterar="(embalagens) => emit('alterar', item, embalagens)"
        @alterar-desconto="(percentual) => emit('alterarDesconto', item, percentual)"
        @remover="emit('remover', item)"
      />
    </li>
  </ul>
</template>
