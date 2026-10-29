<script setup lang="ts">
import type { ClienteCarteira } from "contracts/schemas";
import { Button } from "@/components/ui/button";
import { formatarMoeda } from "@/utils/moeda";

defineProps<{ cliente: ClienteCarteira; total: string }>();
</script>

<template>
  <section class="mx-auto w-full max-w-2xl px-5 py-8 lg:px-8">
    <div class="grid gap-4">
      <p class="text-xl font-semibold">Pedido salvo. Será enviado quando a conexão voltar.</p>
      <p class="text-muted-foreground tabular-nums">
        {{ cliente.nome_fantasia }} · Total de {{ formatarMoeda(total) }}
      </p>
      <div class="flex flex-wrap gap-3">
        <Button size="lg" as-child>
          <RouterLink to="/clientes">Voltar para a carteira</RouterLink>
        </Button>
      </div>
    </div>
  </section>
</template>
