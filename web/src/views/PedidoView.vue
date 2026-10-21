<script setup lang="ts">
import { type ClienteCarteira, clienteCarteiraSchema } from "contracts/schemas";
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { get } from "@/api/client";
import { ApiError } from "@/api/errors";
import BuscaProdutos from "@/components/BuscaProdutos.vue";
import ClienteResumo from "@/components/ClienteResumo.vue";
import ItensPedido from "@/components/ItensPedido.vue";
import ResumoPedido from "@/components/ResumoPedido.vue";
import { usePedidoStore } from "@/stores/pedido";
import { useSessaoStore } from "@/stores/sessao";

const sessao = useSessaoStore();
const pedido = usePedidoStore();
const route = useRoute();
const clienteId = String(route.params.clienteId);

const cliente = ref<ClienteCarteira | null>(null);
const carregando = ref(true);
const erro = ref<"nao_encontrado" | "falha" | null>(null);

onMounted(async () => {
  if (!sessao.vendedor) return;
  try {
    cliente.value = await get(
      `/vendedores/${sessao.vendedor.id}/clientes/${clienteId}`,
      clienteCarteiraSchema,
    );
  } catch (e) {
    erro.value = e instanceof ApiError && e.status === 404 ? "nao_encontrado" : "falha";
  } finally {
    carregando.value = false;
  }
});
</script>

<template>
  <RouterLink to="/clientes">Voltar para a carteira</RouterLink>

  <p v-if="carregando">Carregando cliente...</p>
  <p v-else-if="erro === 'nao_encontrado'">Cliente não encontrado na sua carteira.</p>
  <p v-else-if="erro">Não foi possível carregar o cliente.</p>
  <section v-else-if="cliente">
    <h1>{{ cliente.nome_fantasia }}</h1>
    <ClienteResumo :cliente="cliente" />

    <h2>Itens do pedido</h2>
    <ItensPedido
      :itens="pedido.itens(clienteId)"
      :alcada="sessao.vendedor?.alcada_desconto_percentual ?? 0"
      @alterar="pedido.alterarEmbalagens"
      @alterar-desconto="pedido.alterarDesconto"
      @remover="(item) => pedido.remover(clienteId, item)"
    />

    <template v-if="pedido.itens(clienteId).length > 0">
      <h2>Resumo</h2>
      <ResumoPedido
        :itens="pedido.itens(clienteId)"
        :cliente="cliente"
        :alcada="sessao.vendedor?.alcada_desconto_percentual ?? 0"
      />
    </template>

    <h2>Adicionar produtos</h2>
    <BuscaProdutos
      :cliente-id="clienteId"
      :ids-adicionados="pedido.itens(clienteId).map((item) => item.produto.id)"
      @adicionar="(produto) => pedido.adicionar(clienteId, produto)"
    />
  </section>
</template>
