<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";

const props = defineProps<{ class?: HTMLAttributes["class"] }>();
</script>

<template>
  <span :class="cn('text-xl font-bold tracking-tight', props.class)">
    Smart<span class="text-primary">Pedido</span>
  </span>
</template>
