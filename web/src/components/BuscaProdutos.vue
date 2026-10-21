<script setup lang="ts">
import { type ProdutoBusca, type ProdutoDisponivel, produtoBuscaSchema } from "contracts/schemas";
import { onUnmounted, ref, watch } from "vue";
import { get } from "@/api/client";
import { exibicaoPreco, exibicaoUnidade } from "@/utils/exibicao-produto";

const props = defineProps<{ clienteId: string; idsAdicionados: string[] }>();
const emit = defineEmits<{ adicionar: [produto: ProdutoDisponivel] }>();

const MOTIVOS = {
  produto_inativo: "Produto inativo",
  produto_sem_preco: "Sem preço nesta tabela",
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
  <label for="busca">Buscar produto</label>
  <input
    id="busca"
    v-model="busca"
    type="search"
    placeholder="Nome ou código de barras"
    autocomplete="off"
  />

  <p v-if="buscando">Buscando...</p>
  <p v-else-if="erro">Não foi possível buscar os produtos.</p>
  <p v-else-if="busca.trim() && resultados.length === 0">Nenhum produto encontrado.</p>
  <ul v-else-if="resultados.length > 0">
    <li v-for="produto in resultados" :key="produto.id">
      <strong>{{ produto.descricao }}</strong>
      <span v-if="produto.marca">{{ produto.marca }}</span>
      <span>EAN {{ produto.ean }}</span>
      <span>{{ exibicaoUnidade(produto) }}</span>
      <template v-if="produto.disponivel">
        <span>{{ exibicaoPreco(produto, produto.preco_unidade) }}</span>
        <button
          type="button"
          :disabled="idsAdicionados.includes(produto.id)"
          @click="emit('adicionar', produto)"
        >
          {{ idsAdicionados.includes(produto.id) ? "No pedido" : "Adicionar" }}
        </button>
      </template>
      <span v-else>{{ MOTIVOS[produto.motivo] }}</span>
    </li>
  </ul>
</template>
