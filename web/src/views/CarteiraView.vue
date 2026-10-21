<script setup lang="ts">
import { type ClienteCarteira, clienteCarteiraSchema } from "contracts/schemas";
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { get } from "@/api/client";
import ClienteResumo from "@/components/ClienteResumo.vue";
import { useSessaoStore } from "@/stores/sessao";

const sessao = useSessaoStore();
const router = useRouter();

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

function sair() {
  sessao.sair();
  router.push("/login");
}
</script>

<template>
  <header>
    <p>Olá, {{ sessao.vendedor?.nome }}</p>
    <button type="button" @click="sair">Sair</button>
  </header>

  <h1>Carteira</h1>

  <p v-if="carregando">Carregando clientes...</p>
  <p v-else-if="erro">Não foi possível carregar a carteira.</p>
  <p v-else-if="clientes.length === 0">Nenhum cliente na carteira.</p>
  <ul v-else>
    <li v-for="cliente in clientes" :key="cliente.id">
      <RouterLink :to="`/clientes/${cliente.id}/pedido`">
        <strong>{{ cliente.nome_fantasia }}</strong>
        <ClienteResumo :cliente="cliente" />
      </RouterLink>
    </li>
  </ul>
</template>
