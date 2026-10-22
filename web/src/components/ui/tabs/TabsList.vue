<script setup lang="ts">
import { reactiveOmit } from "@vueuse/core"
import type { TabsListProps } from "reka-ui"
import { TabsList } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { cn } from "@/lib/utils"

const props = defineProps<TabsListProps & { class?: HTMLAttributes["class"] }>()

const delegatedProps = reactiveOmit(props, "class")
</script>

<template>
  <TabsList
    data-slot="tabs-list"
    v-bind="delegatedProps"
    :class="cn(
      'text-muted-foreground flex w-full items-center gap-1 border-b',
      props.class,
    )"
  >
    <slot />
  </TabsList>
</template>
