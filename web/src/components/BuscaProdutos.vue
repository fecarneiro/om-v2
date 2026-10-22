<script setup lang="ts">
import { type ProdutoBusca, type ProdutoDisponivel, produtoBuscaSchema } from "contracts/schemas";
import { onUnmounted, ref, watch } from "vue";
import { get } from "@/api/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { exibicaoMinimo, exibicaoUnidade, precoPorEmbalagem } from "@/utils/exibicao-produto";
import { formatarMoeda } from "@/utils/moeda";

const props = defineProps<{ clienteId: string; idsAdicionados: string[] }>();
const emit = defineEmits<{ adicionar: [produto: ProdutoDisponivel] }>();

const MOTIVOS = {
  produto_inativo: "Produto inativo",
  produto_sem_preco: "Sem preço na tabela do cliente",
};

const busca = ref("");
const resultados = ref<ProdutoBusca[]>([]);
const buscando = ref(false);
const erro = ref(false);

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
  <div class="bg-background sticky top-0 z-10 px-5 py-3.5 lg:px-0 lg:pt-0">
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
      v-for="produto in resultados"
      :key="produto.id"
      class="grid grid-cols-[1fr_auto] items-end gap-x-3 gap-y-2 px-5 py-3.5 lg:grid-cols-[1fr_auto_auto] lg:items-center lg:px-1"
    >
      <div class="col-span-2 grid gap-1.5 lg:col-span-1">
        <span class="font-semibold" :class="{ 'text-muted-foreground': !produto.disponivel }">
          {{ produto.descricao }}
        </span>
        <div class="flex flex-wrap items-center gap-1.5">
          <span v-if="produto.marca" class="text-muted-foreground mr-1 text-[13px]">
            {{ produto.marca }}
          </span>
          <Badge variant="embalagem">{{ exibicaoUnidade(produto) }}</Badge>
          <Badge v-if="exibicaoMinimo(produto)" variant="embalagem">
            {{ exibicaoMinimo(produto) }}
          </Badge>
          <span class="text-muted-foreground ml-1 text-[13px] tabular-nums">{{ produto.ean }}</span>
        </div>
      </div>

      <template v-if="produto.disponivel">
        <div class="tabular-nums lg:text-right">
          <span class="text-[17px] font-semibold">{{ formatarMoeda(produto.preco_unidade) }}</span>
          <span class="text-muted-foreground text-[13px]"> /un</span>
          <p
            v-if="precoPorEmbalagem(produto, produto.preco_unidade)"
            class="text-muted-foreground text-[13px]"
          >
            {{ precoPorEmbalagem(produto, produto.preco_unidade) }}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          class="lg:w-28"
          :disabled="idsAdicionados.includes(produto.id)"
          @click="emit('adicionar', produto)"
        >
          {{ idsAdicionados.includes(produto.id) ? "No pedido" : "Adicionar" }}
        </Button>
      </template>
      <span v-else class="text-muted-foreground col-span-2 text-sm lg:text-right">
        {{ MOTIVOS[produto.motivo] }}
      </span>
    </li>
  </ul>
</template>
