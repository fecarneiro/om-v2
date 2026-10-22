<script setup lang="ts">
import type Big from "big.js";
import type { ClienteCarteira } from "contracts/schemas";
import { computed } from "vue";
import CreditoCliente from "@/components/CreditoCliente.vue";

const props = defineProps<{ cliente: ClienteCarteira; totalPedido: Big }>();

const local = computed(() => {
  const { cidade, uf, tabela_preco } = props.cliente;
  return [cidade && `${cidade}/${uf}`, tabela_preco?.nome]
    .filter(Boolean)
    .join(", ");
});
</script>

<template>
  <header class="grid gap-4 px-5 pt-1 pb-5 lg:grid-cols-[1fr_380px] lg:items-end lg:gap-8 lg:px-0">
    <div>
      <h1 class="text-[28px] leading-tight font-bold tracking-tight">{{ cliente.nome_fantasia }}</h1>
      <p class="text-muted-foreground mt-1 text-sm">
        {{ local }}
        <span v-if="cliente.tabela_preco_pendente" class="text-warning">
          (provisória: cliente sem tabela cadastrada)
        </span>
      </p>
    </div>
    <CreditoCliente :cliente="cliente" :total-pedido="totalPedido" />
  </header>
</template>
