<script setup lang="ts">
import { reactiveOmit } from "@vueuse/core"
import type { TabsTriggerProps } from "reka-ui"
import { TabsTrigger, useForwardProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { cn } from "@/lib/utils"

const props = defineProps<TabsTriggerProps & { class?: HTMLAttributes["class"] }>()

const delegatedProps = reactiveOmit(props, "class")

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <TabsTrigger
    data-slot="tabs-trigger"
    :class="cn(
      `text-muted-foreground data-[state=active]:text-foreground data-[state=active]:border-primary -mb-px inline-flex items-center gap-1.5 border-b-2 border-transparent px-3 py-3 text-[15px] font-semibold whitespace-nowrap outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50`,
      props.class,
    )"
    v-bind="forwardedProps"
  >
    <slot />
  </TabsTrigger>
</template>
