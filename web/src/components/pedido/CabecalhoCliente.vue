<script setup lang="ts">
import type Big from "big.js";
import type { ClienteCarteira } from "contracts/schemas";
import CreditoCliente from "@/components/pedido/CreditoCliente.vue";
import { Badge } from "@/components/ui/badge";

defineProps<{ cliente: ClienteCarteira; totalPedido: Big }>();
</script>

<template>
  <header class="grid gap-4 px-5 pt-1 pb-5 lg:grid-cols-[1fr_380px] lg:items-end lg:gap-8 lg:px-0">
    <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
      <h1 class="text-[28px] leading-tight font-bold tracking-tight">{{ cliente.nome_fantasia }}</h1>
      <Badge v-if="cliente.tabela_preco_pendente" variant="aviso">Tabela provisória</Badge>
    </div>
    <CreditoCliente :cliente="cliente" :total-pedido="totalPedido" />
  </header>
</template>
