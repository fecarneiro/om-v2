<script setup lang="ts">
import { watch } from "vue";
import { useRouter } from "vue-router";
import { useSessaoStore } from "@/stores/sessao";

const sessao = useSessaoStore();
const router = useRouter();

watch(
  () => sessao.vendedor,
  (vendedor) => {
    if (!vendedor) router.replace("/login");
  },
);
</script>

<template>
  <RouterView />
</template>
