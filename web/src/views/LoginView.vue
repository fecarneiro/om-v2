<script setup lang="ts">
import { type Vendedor, vendedorSchema } from "contracts/schemas";
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { get } from "@/api/client";
import LogoApp from "@/components/app/LogoApp.vue";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSessaoStore } from "@/stores/sessao";

const sessao = useSessaoStore();
const router = useRouter();

const vendedores = ref<Vendedor[]>([]);
const selecionadoId = ref<string>();
const erro = ref(false);

onMounted(async () => {
  try {
    vendedores.value = await get("/vendedores", vendedorSchema.array());
  } catch {
    erro.value = true;
  }
});

function entrar() {
  const vendedor = vendedores.value.find((v) => v.id === selecionadoId.value);
  if (!vendedor) return;
  sessao.entrar(vendedor);
  router.push("/clientes");
}
</script>

<template>
  <main class="mx-auto flex min-h-dvh max-w-md flex-col justify-end gap-8 px-6 pt-8 pb-10 sm:justify-center">
    <LogoApp class="text-3xl" />
    <h1 class="text-[34px] leading-tight font-bold tracking-tight">Quem está vendendo hoje?</h1>

    <p v-if="erro" class="text-destructive">Não foi possível carregar os vendedores.</p>
    <form v-else class="grid gap-3" @submit.prevent="entrar">
      <label for="vendedor" class="text-muted-foreground text-sm">Vendedor</label>
      <Select v-model="selecionadoId">
        <SelectTrigger id="vendedor" class="w-full">
          <SelectValue placeholder="Selecione seu nome" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="vendedor in vendedores" :key="vendedor.id" :value="vendedor.id">
            {{ vendedor.nome }}
          </SelectItem>
        </SelectContent>
      </Select>
      <Button type="submit" size="lg" :disabled="!selecionadoId">Entrar</Button>
    </form>
  </main>
</template>
