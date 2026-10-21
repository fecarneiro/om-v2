<script setup lang="ts">
import { type Vendedor, vendedorSchema } from "contracts/schemas";
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { get } from "@/api/client";
import { useSessaoStore } from "@/stores/sessao";

const sessao = useSessaoStore();
const router = useRouter();

const vendedores = ref<Vendedor[]>([]);
const selecionado = ref<Vendedor | null>(null);
const erro = ref(false);

onMounted(async () => {
  try {
    vendedores.value = await get("/vendedores", vendedorSchema.array());
  } catch {
    erro.value = true;
  }
});

function entrar() {
  if (!selecionado.value) return;
  sessao.entrar(selecionado.value);
  router.push("/clientes");
}
</script>

<template>
  <h1>Entrar</h1>
  <p v-if="erro">Não foi possível carregar os vendedores.</p>
  <form v-else @submit.prevent="entrar">
    <label for="vendedor">Vendedor</label>
    <select id="vendedor" v-model="selecionado">
      <option :value="null" disabled>Selecione o vendedor</option>
      <option v-for="vendedor in vendedores" :key="vendedor.id" :value="vendedor">
        {{ vendedor.nome }}
      </option>
    </select>
    <button type="submit" :disabled="!selecionado">Entrar</button>
  </form>
</template>
