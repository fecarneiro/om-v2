<script setup lang="ts">
import { useOnline } from "@vueuse/core";
import { computed } from "vue";
import { useSincronizacaoOfflineStore } from "@/offline/stores/sincronizacao";

const online = useOnline();
const sincronizacao = useSincronizacaoOfflineStore();

const hora = new Intl.DateTimeFormat("pt-BR", { timeStyle: "short" });
const diaEHora = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

const dadosDe = computed(() => {
  if (!sincronizacao.ultimaSincronizacao) return null;
  const data = new Date(sincronizacao.ultimaSincronizacao);
  const hoje = data.toDateString() === new Date().toDateString();
  return (hoje ? hora : diaEHora).format(data);
});
</script>

<template>
  <span class="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
    <span class="size-2 rounded-full" :class="online ? 'bg-emerald-500' : 'bg-destructive'" />
    <template v-if="online">Online</template>
    <template v-else-if="dadosDe">Offline (dados de {{ dadosDe }})</template>
    <template v-else>Offline</template>
  </span>
</template>
