<script setup lang="ts">
import { Minus, Plus } from "@lucide/vue";
import { embalagensMinimas } from "contracts/rules";
import { type ProdutoBusca, type ProdutoDisponivel, produtoBuscaSchema } from "contracts/schemas";
import { computed, onUnmounted, ref, watch } from "vue";
import { get } from "@/api/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { embalagensAoAumentar, validarEmbalagens } from "@/pedido/item";
import type { ItemPedido } from "@/stores/pedido";
import { exibicaoEmbalagem, precoDaEmbalagem } from "@/utils/exibicao-produto";
import { formatarMoeda } from "@/utils/moeda";

const props = defineProps<{ clienteId: string; itens: ItemPedido[] }>();
const emit = defineEmits<{
  adicionar: [produto: ProdutoDisponivel];
  alterar: [item: ItemPedido, embalagens: number];
}>();

const MOTIVOS = {
  produto_inativo: "Produto inativo",
  produto_sem_preco: "Sem preço na tabela do cliente",
};

const busca = ref("");
const resultados = ref<ProdutoBusca[]>([]);
const buscando = ref(false);
const erro = ref(false);

const linhas = computed(() =>
  resultados.value.map((produto) => ({
    produto,
    item: props.itens.find((item) => item.produto.id === produto.id),
  })),
);

let timer: ReturnType<typeof setTimeout> | undefined;
let controller: AbortController | null = null;

watch(busca, (valor) => {
  clearTimeout(timer);
  controller?.abort();

  const termo = valor.trim();
  erro.value = false;

  if (!termo) {
    resultados.value = [];
    buscando.value = false;
    return;
  }

  buscando.value = true;
  timer = setTimeout(() => buscar(termo), 300);
});

async function buscar(termo: string) {
  const atual = new AbortController();
  controller = atual;
  try {
    resultados.value = await get(
      `/clientes/${props.clienteId}/produtos?busca=${encodeURIComponent(termo)}`,
      produtoBuscaSchema.array(),
      { signal: atual.signal },
    );
  } catch {
    if (!atual.signal.aborted) erro.value = true;
  } finally {
    if (!atual.signal.aborted) buscando.value = false;
  }
}

onUnmounted(() => {
  clearTimeout(timer);
  controller?.abort();
});
</script>

<template>
  <div class="bg-background sticky top-0 z-10 px-5 py-3.5 lg:px-0 lg:pt-3 lg:pb-4">
    <label for="busca" class="sr-only">Buscar produto</label>
    <Input
      id="busca"
      v-model="busca"
      type="search"
      placeholder="Nome ou código de barras"
      autocomplete="off"
    />
  </div>

  <p v-if="buscando" class="text-muted-foreground px-5 py-10 text-center text-sm">Buscando...</p>
  <p v-else-if="erro" class="text-destructive px-5 py-10 text-center text-sm">
    Não foi possível buscar os produtos.
  </p>
  <p v-else-if="!busca.trim()" class="text-muted-foreground px-5 py-10 text-center text-sm">
    Busque pelo nome ou código de barras para adicionar ao pedido.
  </p>
  <p v-else-if="resultados.length === 0" class="text-muted-foreground px-5 py-10 text-center text-sm">
    Nenhum produto encontrado.
  </p>
  <ul v-else class="divide-y border-y">
    <li
      v-for="{ produto, item } in linhas"
      :key="produto.id"
      class="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-0.5 px-5 py-3.5 lg:px-1"
    >
      <span class="font-semibold" :class="{ 'text-muted-foreground': !produto.disponivel }">
        {{ produto.descricao }}
      </span>
      <span v-if="produto.disponivel" class="text-right font-semibold tabular-nums">
        {{ precoDaEmbalagem(produto, produto.preco_unidade) }}
      </span>

      <span class="text-muted-foreground col-start-1 text-sm tabular-nums">{{ produto.ean }}</span>
      <span
        v-if="produto.disponivel && produto.unidade_venda !== 'UN'"
        class="text-muted-foreground col-start-2 text-right text-xs tabular-nums"
      >
        {{ formatarMoeda(produto.preco_unidade) }}/un
      </span>

      <template v-if="produto.disponivel">
        <Badge variant="embalagem" class="col-start-1 mt-1">{{ exibicaoEmbalagem(produto) }}</Badge>
        <div
          v-if="item"
          class="bg-input col-start-2 mt-1 inline-flex items-center justify-self-end rounded-full"
        >
          <Button
            variant="ghost"
            size="icon"
            class="text-foreground size-8"
            :aria-label="`Diminuir quantidade de ${produto.descricao}`"
            :disabled="!!validarEmbalagens(item) || item.embalagens <= embalagensMinimas(produto)"
            @click="emit('alterar', item, item.embalagens - 1)"
          >
            <Minus />
          </Button>
          <span class="min-w-6 text-center font-semibold tabular-nums">{{ item.embalagens }}</span>
          <Button
            variant="ghost"
            size="icon"
            class="text-foreground size-8"
            :aria-label="`Aumentar quantidade de ${produto.descricao}`"
            @click="emit('alterar', item, embalagensAoAumentar(item))"
          >
            <Plus />
          </Button>
        </div>
        <Button
          v-else
          variant="outline"
          size="icon"
          class="text-primary col-start-2 mt-1 size-8 justify-self-end rounded-full"
          :aria-label="`Adicionar ${produto.descricao}`"
          @click="emit('adicionar', produto)"
        >
          <Plus />
        </Button>
      </template>
      <span v-else class="text-muted-foreground col-start-1 text-sm">
        {{ MOTIVOS[produto.motivo] }}
      </span>
    </li>
  </ul>
</template>
