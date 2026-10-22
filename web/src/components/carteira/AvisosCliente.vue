<script setup lang="ts">
import Big from "big.js";
import { PEDIDO_MINIMO } from "contracts/constants";
import type { ClienteCarteira } from "contracts/schemas";
import { computed } from "vue";
import { Badge } from "@/components/ui/badge";

const props = defineProps<{ cliente: ClienteCarteira }>();

const creditoInsuficiente = computed(() =>
  new Big(props.cliente.credito_disponivel).lt(PEDIDO_MINIMO),
);
</script>

<template>
  <div v-if="creditoInsuficiente || cliente.tabela_preco_pendente" class="flex flex-wrap gap-3.5">
    <Badge v-if="creditoInsuficiente" variant="erro">Crédito insuficiente</Badge>
    <Badge v-if="cliente.tabela_preco_pendente" variant="aviso">Tabela provisória</Badge>
  </div>
</template>
