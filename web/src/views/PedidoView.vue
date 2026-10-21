<script setup lang="ts">
import {
  type ClienteCarteira,
  clienteCarteiraSchema,
  type PedidoEnviado,
  pedidoEnviadoSchema,
} from "contracts/schemas";
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { get, post } from "@/api/client";
import { ApiError } from "@/api/errors";
import BuscaProdutos from "@/components/BuscaProdutos.vue";
import ClienteResumo from "@/components/ClienteResumo.vue";
import ItensPedido from "@/components/ItensPedido.vue";
import ResumoPedido from "@/components/ResumoPedido.vue";
import { paraEnvio } from "@/pedido/item";
import { mensagemDoErro } from "@/pedido/mensagens";
import { usePedidoStore } from "@/stores/pedido";
import { useSessaoStore } from "@/stores/sessao";
import { formatarMoeda } from "@/utils/moeda";

const sessao = useSessaoStore();
const pedido = usePedidoStore();
const route = useRoute();
const clienteId = String(route.params.clienteId);

const cliente = ref<ClienteCarteira | null>(null);
const carregando = ref(true);
const erro = ref<"nao_encontrado" | "falha" | null>(null);

const pedidoGravado = ref<PedidoEnviado | null>(null);
const enviando = ref(false);
const erroEnvio = ref<string | null>(null);

async function carregarCliente() {
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
}

onMounted(carregarCliente);

function mensagemDoEnvio(e: unknown) {
  if (!(e instanceof ApiError)) return "Não foi possível enviar o pedido. Tente de novo.";

  const mensagem = mensagemDoErro(e.codigo);
  const item = pedido.itens(clienteId).find((item) => item.produto.id === e.produtoId);
  return item ? `${mensagem} (${item.produto.descricao})` : mensagem;
}

async function enviar() {
  if (!sessao.vendedor) return;

  enviando.value = true;
  erroEnvio.value = null;
  try {
    pedidoGravado.value = await post(
      "/pedidos",
      {
        vendedor_id: sessao.vendedor.id,
        cliente_id: clienteId,
        itens: pedido.itens(clienteId).map(paraEnvio),
      },
      pedidoEnviadoSchema,
    );
    pedido.esvaziar(clienteId);
    await carregarCliente();
  } catch (e) {
    erroEnvio.value = mensagemDoEnvio(e);
  } finally {
    enviando.value = false;
  }
}
</script>

<template>
  <RouterLink to="/clientes">Voltar para a carteira</RouterLink>

  <p v-if="carregando">Carregando cliente...</p>
  <p v-else-if="erro === 'nao_encontrado'">Cliente não encontrado na sua carteira.</p>
  <p v-else-if="erro">Não foi possível carregar o cliente.</p>
  <section v-else-if="cliente">
    <h1>{{ cliente.nome_fantasia }}</h1>
    <ClienteResumo :cliente="cliente" />

    <template v-if="pedidoGravado">
      <p v-if="pedidoGravado.status === 'aguardando_aprovacao'">
        Pedido aguardando aprovação do supervisor.
      </p>
      <p v-else>Pedido enviado.</p>
      <p>Total: {{ formatarMoeda(pedidoGravado.total) }}</p>
      <button type="button" @click="pedidoGravado = null">Novo pedido para este cliente</button>
    </template>

    <template v-else>
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
          :enviando="enviando"
          :erro-envio="erroEnvio"
          @enviar="enviar"
        />
      </template>

      <h2>Adicionar produtos</h2>
      <BuscaProdutos
        :cliente-id="clienteId"
        :ids-adicionados="pedido.itens(clienteId).map((item) => item.produto.id)"
        @adicionar="(produto) => pedido.adicionar(clienteId, produto)"
      />
    </template>
  </section>
</template>
