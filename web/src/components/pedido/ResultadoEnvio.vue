<script setup lang="ts">
import type Big from "big.js";
import type { ClienteCarteira, PedidoEnviado } from "contracts/schemas";
import CabecalhoCliente from "@/components/pedido/CabecalhoCliente.vue";
import { Button } from "@/components/ui/button";
import { formatarMoeda } from "@/utils/moeda";

defineProps<{ cliente: ClienteCarteira; pedido: PedidoEnviado; total: Big }>();
defineEmits<{ novo: [] }>();
</script>

<template>
  <section class="mx-auto w-full max-w-2xl lg:px-8 lg:py-6">
    <CabecalhoCliente :cliente="cliente" :total-pedido="total" />
    <div class="grid gap-4 border-t px-5 pt-8 lg:px-0">
      <p class="text-xl font-semibold">
        {{
          pedido.status === "aguardando_aprovacao"
            ? "Pedido aguardando aprovação do supervisor."
            : "Pedido enviado."
        }}
      </p>
      <p class="text-muted-foreground tabular-nums">Total de {{ formatarMoeda(pedido.total) }}</p>
      <div class="flex flex-wrap gap-3">
        <Button size="lg" @click="$emit('novo')">Novo pedido para este cliente</Button>
        <Button size="lg" variant="ghost" as-child>
          <RouterLink to="/clientes">Voltar para a carteira</RouterLink>
        </Button>
      </div>
    </div>
  </section>
</template>
