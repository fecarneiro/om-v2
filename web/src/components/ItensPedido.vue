<script setup lang="ts">
import ItemPedidoLinha from "@/components/ItemPedidoLinha.vue";
import type { ItemPedido } from "@/stores/pedido";

defineProps<{ itens: ItemPedido[]; alcada: number }>();
const emit = defineEmits<{
  alterar: [item: ItemPedido, embalagens: number];
  alterarDesconto: [item: ItemPedido, percentual: number];
  remover: [item: ItemPedido];
}>();
</script>

<template>
  <p v-if="itens.length === 0">Nenhum item no pedido.</p>
  <ul v-else>
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
