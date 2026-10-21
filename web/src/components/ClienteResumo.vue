<script setup lang="ts">
import type { ClienteCarteira } from "contracts/schemas";
import { formatarMoeda } from "@/utils/moeda";

defineProps<{ cliente: ClienteCarteira }>();
</script>

<template>
  <span v-if="cliente.cidade">{{ cliente.cidade }}/{{ cliente.uf }}</span>
  <span>Crédito disponível: {{ formatarMoeda(cliente.credito_disponivel) }}</span>
  <span v-if="Number(cliente.credito_disponivel) <= 0">Sem crédito disponível</span>
  <span>
    {{ cliente.tabela_preco?.nome }}
    <template v-if="cliente.tabela_preco_pendente">(provisória: cliente sem tabela cadastrada)</template>
  </span>
</template>
