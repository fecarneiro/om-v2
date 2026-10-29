<script setup lang="ts">
import { useGatilhosSincronizacaoOffline } from "@/offline/sincronizacao/gatilhos-offline";

useGatilhosSincronizacaoOffline();
</script>

<template>
  <RouterView />
</template>
