<script setup lang="ts">
import { ChevronLeft } from "@lucide/vue";
import { useRouter } from "vue-router";
import LogoApp from "@/components/app/LogoApp.vue";
import { Button } from "@/components/ui/button";
import { useSessaoStore } from "@/stores/sessao";

defineProps<{ voltar?: string }>();

const sessao = useSessaoStore();
const router = useRouter();

function sair() {
  sessao.sair();
  router.push("/login");
}
</script>

<template>
  <header
    class="flex items-center justify-between gap-4 px-5 pt-4 pb-2"
    :class="voltar ? 'lg:border-b lg:px-8 lg:py-3' : 'lg:pt-8 lg:pb-10'"
  >
    <LogoApp class="hidden lg:block" />
    <RouterLink
      v-if="voltar"
      :to="voltar"
      class="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm lg:hidden"
    >
      <ChevronLeft class="size-4" />
      Carteira
    </RouterLink>
    <span v-else class="text-muted-foreground text-sm lg:hidden">
      Olá, {{ sessao.vendedor?.nome }}
    </span>

    <div class="flex items-center gap-2">
      <RouterLink
        v-if="voltar"
        :to="voltar"
        class="text-muted-foreground hover:text-foreground mr-3 hidden items-center gap-1 text-sm lg:inline-flex"
      >
        <ChevronLeft class="size-4" />
        Carteira
      </RouterLink>
      <span class="text-muted-foreground hidden text-sm lg:inline">
        {{ voltar ? sessao.vendedor?.nome : `Olá, ${sessao.vendedor?.nome}` }}
      </span>
      <Button variant="ghost" size="sm" class="-mr-3.5" @click="sair">Sair</Button>
    </div>
  </header>
</template>
