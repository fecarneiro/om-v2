<script setup lang="ts">
import { ChevronUp } from "@lucide/vue";
import Big from "big.js";
import { PEDIDO_MINIMO } from "contracts/constants";
import {
  definirStatusEnvio,
  totalBrutoDoPedido,
  totalLiquidoDoPedido,
} from "contracts/rules";
import type { ClienteCarteira } from "contracts/schemas";
import { computed, ref } from "vue";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { bloqueiosDoPedido } from "@/regras/bloqueios-pedido";
import { itemEmUnidades, itemValido } from "@/regras/item-pedido";
import type { ItemPedido } from "@/stores/pedido";
import { MENSAGENS } from "@/utils/mensagens-erro";
import { formatarMoeda } from "@/utils/moeda";

const props = defineProps<{
  variante: "compacto" | "detalhado";
  itens: ItemPedido[];
  cliente: ClienteCarteira;
  alcada: number;
  enviando: boolean;
  erroEnvio: string | null;
}>();
const emit = defineEmits<{ enviar: []; abrir: [] }>();

const confirmando = ref(false);

const vazio = computed(() => props.itens.length === 0);
const itensEmUnidades = computed(() => props.itens.filter(itemValido).map(itemEmUnidades));
const bruto = computed(() => totalBrutoDoPedido(itensEmUnidades.value));
const liquido = computed(() => totalLiquidoDoPedido(itensEmUnidades.value));
const desconto = computed(() => bruto.value.minus(liquido.value));
const faltaParaMinimo = computed(() => new Big(PEDIDO_MINIMO).minus(bruto.value));
const excedente = computed(() => liquido.value.minus(props.cliente.credito_disponivel));
const status = computed(() => definirStatusEnvio(props.itens, props.alcada));
const bloqueios = computed(() => (vazio.value ? [] : bloqueiosDoPedido(props.itens, props.cliente)));
const abaixoDoMinimo = computed(() => bloqueios.value.includes("abaixo_do_pedido_minimo"));
const erros = computed(() => bloqueios.value.filter((b) => b !== "abaixo_do_pedido_minimo"));
const paraAprovacao = computed(() => status.value === "aguardando_aprovacao");

const progressoMinimo = computed(() =>
  Math.min(bruto.value.div(PEDIDO_MINIMO).times(100).toNumber(), 100),
);

const rotulo = computed(() => {
  if (props.enviando) return "Enviando...";
  return paraAprovacao.value ? "Enviar para aprovação" : "Enviar pedido";
});

const textoItens = computed(() =>
  props.itens.length === 1 ? "1 item" : `${props.itens.length} itens`,
);

const podeEnviar = computed(() => !vazio.value && bloqueios.value.length === 0 && !props.enviando);
</script>

<template>
  <div
    class="grid gap-3 border-t px-5 pt-4 pb-5"
    :class="
      variante === 'compacto' ? 'bg-card fixed inset-x-0 bottom-0 z-20' : 'relative lg:px-6 lg:pb-6'
    "
  >
    <div
      v-if="abaixoDoMinimo"
      role="progressbar"
      aria-label="Progresso até o pedido mínimo"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-valuenow="Math.round(progressoMinimo)"
      class="bg-secondary absolute inset-x-0 -top-px h-0.75"
    >
      <div class="bg-muted-foreground h-full" :style="{ width: `${progressoMinimo}%` }" />
    </div>

    <p v-if="variante === 'compacto' && abaixoDoMinimo" class="text-muted-foreground text-sm">
      Faltam {{ formatarMoeda(faltaParaMinimo.toFixed(2)) }} para o mínimo
    </p>

    <ul v-if="erros.length > 0" class="text-destructive grid gap-1 text-sm">
      <li v-for="bloqueio in erros" :key="bloqueio">
        <template v-if="bloqueio === 'credito_insuficiente'">
          Acima do crédito disponível em {{ formatarMoeda(excedente.toFixed(2)) }}.
        </template>
        <template v-else>{{ MENSAGENS[bloqueio] }}</template>
      </li>
    </ul>
    <p v-else-if="paraAprovacao" class="text-warning text-sm">
      Pedido sujeito à aprovação do supervisor.
    </p>
    <p v-if="erroEnvio" class="text-destructive text-sm">{{ erroEnvio }}</p>

    <div v-if="variante === 'compacto'" class="flex items-center justify-between gap-4">
      <div class="tabular-nums">
        <p v-if="vazio" class="text-muted-foreground text-[13px]">Nenhum item no pedido</p>
        <button
          v-else
          type="button"
          class="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-[13px]"
          @click="emit('abrir')"
        >
          Pedido · {{ textoItens }}
          <ChevronUp class="size-4" />
        </button>
        <p class="text-2xl font-bold tracking-tight" :class="{ 'text-muted-foreground': vazio }">
          {{ formatarMoeda(liquido.toFixed(2)) }}
        </p>
      </div>
      <Button size="lg" :disabled="!podeEnviar" @click="confirmando = true">{{ rotulo }}</Button>
    </div>

    <template v-else>
      <dl class="grid grid-cols-[1fr_auto] items-baseline gap-y-0.5 tabular-nums">
        <template v-if="desconto.gt(0)">
          <dt class="text-muted-foreground text-sm">Subtotal</dt>
          <dd class="text-right text-sm">{{ formatarMoeda(bruto.toFixed(2)) }}</dd>
          <dt class="text-muted-foreground text-sm">Desconto</dt>
          <dd class="text-right text-sm">− {{ formatarMoeda(desconto.toFixed(2)) }}</dd>
        </template>
        <dt class="font-semibold">Total</dt>
        <dd
          class="text-right text-2xl font-bold tracking-tight"
          :class="{ 'text-muted-foreground': vazio }"
        >
          {{ formatarMoeda(liquido.toFixed(2)) }}
        </dd>
        <dd v-if="abaixoDoMinimo" class="text-muted-foreground col-span-2 text-right text-sm">
          Faltam {{ formatarMoeda(faltaParaMinimo.toFixed(2)) }} para o mínimo
        </dd>
      </dl>
      <Button size="lg" class="w-full" :disabled="!podeEnviar" @click="confirmando = true">
        {{ rotulo }}
      </Button>
    </template>

    <AlertDialog v-model:open="confirmando">
      <AlertDialogContent class="bg-card">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {{ paraAprovacao ? "Enviar pedido para aprovação?" : "Enviar pedido?" }}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {{ textoItens }}, total de {{ formatarMoeda(liquido.toFixed(2)) }}.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Voltar</AlertDialogCancel>
          <AlertDialogAction @click="emit('enviar')">{{ rotulo }}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
