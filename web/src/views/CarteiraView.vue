<script setup lang="ts">
import { PEDIDO_MINIMO } from "contracts/constants";
import { type ClienteCarteira, clienteCarteiraSchema } from "contracts/schemas";
import { onMounted, ref } from "vue";
import { get } from "@/api/client";
import AvisosCliente from "@/components/AvisosCliente.vue";
import TopoApp from "@/components/TopoApp.vue";
import { useSessaoStore } from "@/stores/sessao";
import { formatarMoeda } from "@/utils/moeda";

const sessao = useSessaoStore();

const clientes = ref<ClienteCarteira[]>([]);
const carregando = ref(true);
const erro = ref(false);

onMounted(async () => {
  if (!sessao.vendedor) return;
  try {
    clientes.value = await get(
      `/vendedores/${sessao.vendedor.id}/clientes`,
      clienteCarteiraSchema.array(),
    );
  } catch {
    erro.value = true;
  } finally {
    carregando.value = false;
  }
});
</script>

<template>
  <div class="mx-auto max-w-2xl pb-10">
    <TopoApp />

    <div class="px-5 pt-1 pb-4">
      <h1 class="text-[28px] leading-tight font-bold tracking-tight">Carteira</h1>
      <p v-if="!carregando && !erro" class="text-muted-foreground mt-1 text-sm">
        {{ clientes.length }} {{ clientes.length === 1 ? "cliente" : "clientes" }}, pedido mínimo
        de {{ formatarMoeda(PEDIDO_MINIMO) }}
      </p>
    </div>

    <p v-if="carregando" class="text-muted-foreground px-5 py-10 text-center">
      Carregando clientes...
    </p>
    <p v-else-if="erro" class="text-destructive px-5 py-10 text-center">
      Não foi possível carregar a carteira.
    </p>
    <p v-else-if="clientes.length === 0" class="text-muted-foreground px-5 py-10 text-center">
      Nenhum cliente na carteira.
    </p>
    <template v-else>
      <div class="text-muted-foreground flex justify-between px-5 pb-2 text-[13px]">
        <span>Cliente</span>
        <span>Crédito disponível</span>
      </div>
      <ul class="divide-y border-y">
        <li v-for="cliente in clientes" :key="cliente.id">
          <RouterLink
            :to="`/clientes/${cliente.id}/pedido`"
            class="hover:bg-card grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 px-5 py-4"
          >
            <span class="text-[17px] font-semibold">{{ cliente.nome_fantasia }}</span>
            <span class="text-right text-sm font-semibold tabular-nums">
              {{ formatarMoeda(cliente.credito_disponivel) }}
            </span>
            <span class="text-muted-foreground col-span-2 text-sm">
              <template v-if="cliente.cidade">{{ cliente.cidade }}/{{ cliente.uf }}</template>
            </span>
            <AvisosCliente :cliente="cliente" class="col-span-2 mt-1" />
          </RouterLink>
        </li>
      </ul>
    </template>
  </div>
</template>
