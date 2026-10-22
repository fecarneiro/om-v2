<script setup lang="ts">
import Big from "big.js";
import { PEDIDO_MINIMO } from "contracts/constants";
import {
  definirStatusEnvio,
  totalBrutoDoPedido,
  totalLiquidoDoPedido,
} from "contracts/rules";
import type { ClienteCarteira } from "contracts/schemas";
import { computed } from "vue";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { bloqueiosDoPedido } from "@/pedido/bloqueios";
import { emUnidades, itemValido } from "@/pedido/item";
import { MENSAGENS } from "@/pedido/mensagens";
import type { ItemPedido } from "@/stores/pedido";
import { formatarMoeda } from "@/utils/moeda";

const props = defineProps<{
  itens: ItemPedido[];
  cliente: ClienteCarteira;
  alcada: number;
  enviando: boolean;
  erroEnvio: string | null;
}>();
const emit = defineEmits<{ enviar: [] }>();

const vazio = computed(() => props.itens.length === 0);
const itensEmUnidades = computed(() => props.itens.filter(itemValido).map(emUnidades));
const bruto = computed(() => totalBrutoDoPedido(itensEmUnidades.value));
const liquido = computed(() => totalLiquidoDoPedido(itensEmUnidades.value));
const desconto = computed(() => bruto.value.minus(liquido.value));
const faltaParaMinimo = computed(() => new Big(PEDIDO_MINIMO).minus(bruto.value));
const excedente = computed(() => liquido.value.minus(props.cliente.credito_disponivel));
const status = computed(() => definirStatusEnvio(props.itens, props.alcada));
const bloqueios = computed(() => (vazio.value ? [] : bloqueiosDoPedido(props.itens, props.cliente)));
const paraAprovacao = computed(() => status.value === "aguardando_aprovacao");

const estado = computed(() => {
  if (bloqueios.value.length > 0 || props.erroEnvio) return "erro";
  if (paraAprovacao.value) return "aviso";
  return null;
});

const rotulo = computed(() => {
  if (props.enviando) return "Enviando...";
  return paraAprovacao.value ? "Enviar para aprovação" : "Enviar pedido";
});

const quantidade = computed(() =>
  props.itens.length === 1 ? "1 item" : `${props.itens.length} itens`,
);

const detalhe = computed(() => {
  if (vazio.value) return "Nenhum item adicionado";
  if (desconto.value.lte(0)) return quantidade.value;
  return `${quantidade.value}, desconto de ${formatarMoeda(desconto.value.toFixed(2))}`;
});
</script>

<template>
  <div
    class="bg-card grid gap-3 border-t px-5 pt-3.5 pb-5 lg:bg-background lg:px-6 lg:pb-6"
    :class="{
      'shadow-[inset_0_3px_0_var(--destructive)]': estado === 'erro',
      'shadow-[inset_0_3px_0_var(--warning)]': estado === 'aviso',
    }"
  >
    <ul v-if="bloqueios.length > 0" class="text-destructive grid gap-1 text-sm">
      <li v-for="bloqueio in bloqueios" :key="bloqueio">
        {{ MENSAGENS[bloqueio] }}
        <template v-if="bloqueio === 'abaixo_do_pedido_minimo'">
          Faltam {{ formatarMoeda(faltaParaMinimo.toFixed(2)) }}.
        </template>
        <template v-if="bloqueio === 'credito_insuficiente'">
          Excede em {{ formatarMoeda(excedente.toFixed(2)) }}.
        </template>
      </li>
    </ul>
    <p v-else-if="paraAprovacao" class="text-warning text-sm">
      Desconto acima da sua alçada de {{ alcada }}%. O pedido vai para aprovação do supervisor.
    </p>
    <p v-if="erroEnvio" class="text-destructive text-sm">{{ erroEnvio }}</p>

    <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
      <div class="whitespace-nowrap tabular-nums">
        <p class="text-2xl font-bold tracking-tight" :class="{ 'text-muted-foreground': vazio }">
          {{ formatarMoeda(liquido.toFixed(2)) }}
        </p>
        <p class="text-muted-foreground text-[13px]">{{ detalhe }}</p>
      </div>

      <AlertDialog>
        <AlertDialogTrigger as-child>
          <Button size="lg" class="grow" :disabled="vazio || bloqueios.length > 0 || enviando">
            {{ rotulo }}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent class="bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {{ paraAprovacao ? "Enviar pedido para aprovação?" : "Enviar pedido?" }}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {{ quantidade }} para {{ cliente.nome_fantasia }}, total de
              {{ formatarMoeda(liquido.toFixed(2)) }}.
              <template v-if="paraAprovacao">
                O pedido fica aguardando aprovação do supervisor.
              </template>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction @click="emit('enviar')">{{ rotulo }}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  </div>
</template>
