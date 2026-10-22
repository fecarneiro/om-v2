<script setup lang="ts">
import { totalLiquidoDoPedido } from "contracts/rules";
import {
  type ClienteCarteira,
  clienteCarteiraSchema,
  type PedidoEnviado,
  pedidoEnviadoSchema,
} from "contracts/schemas";
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { get, post } from "@/api/client";
import { ApiError } from "@/api/errors";
import BuscaProdutos from "@/components/BuscaProdutos.vue";
import CabecalhoCliente from "@/components/CabecalhoCliente.vue";
import ItensPedido from "@/components/ItensPedido.vue";
import ResumoPedido from "@/components/ResumoPedido.vue";
import TopoApp from "@/components/TopoApp.vue";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { emUnidades, itemValido, paraEnvio } from "@/pedido/item";
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
const aba = ref("produtos");

const itens = computed(() => pedido.itens(clienteId));
const total = computed(() => totalLiquidoDoPedido(itens.value.filter(itemValido).map(emUnidades)));

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
  const item = itens.value.find((item) => item.produto.id === e.produtoId);
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
        itens: itens.value.map(paraEnvio),
      },
      pedidoEnviadoSchema,
    );
    pedido.esvaziar(clienteId);
    aba.value = "produtos";
    await carregarCliente();
  } catch (e) {
    erroEnvio.value = mensagemDoEnvio(e);
  } finally {
    enviando.value = false;
  }
}
</script>

<template>
  <div class="pb-44 lg:grid lg:h-dvh lg:grid-rows-[auto_1fr] lg:pb-0">
    <TopoApp voltar="/clientes" />

    <p v-if="carregando" class="text-muted-foreground px-5 py-10 text-center">
      Carregando cliente...
    </p>
    <p v-else-if="erro === 'nao_encontrado'" class="text-destructive px-5 py-10 text-center">
      Cliente não encontrado na sua carteira.
    </p>
    <p v-else-if="erro" class="text-destructive px-5 py-10 text-center">
      Não foi possível carregar o cliente.
    </p>

    <section v-else-if="cliente && pedidoGravado" class="mx-auto w-full max-w-2xl lg:px-8 lg:py-6">
      <CabecalhoCliente :cliente="cliente" :total-pedido="total" />
      <div class="grid gap-4 border-t px-5 pt-8 lg:px-0">
        <p class="text-xl font-semibold">
          {{
            pedidoGravado.status === "aguardando_aprovacao"
              ? "Pedido aguardando aprovação do supervisor."
              : "Pedido enviado."
          }}
        </p>
        <p class="text-muted-foreground tabular-nums">
          Total de {{ formatarMoeda(pedidoGravado.total) }}
        </p>
        <div class="flex flex-wrap gap-3">
          <Button size="lg" @click="pedidoGravado = null">Novo pedido para este cliente</Button>
          <Button size="lg" variant="ghost" as-child>
            <RouterLink to="/clientes">Voltar para a carteira</RouterLink>
          </Button>
        </div>
      </div>
    </section>

    <Tabs
      v-else-if="cliente"
      v-model="aba"
      class="gap-0 lg:grid lg:min-h-0 lg:grid-cols-[1fr_420px]"
    >
      <section class="lg:overflow-y-auto lg:px-8 lg:pt-6">
        <CabecalhoCliente :cliente="cliente" :total-pedido="total" />

        <TabsList class="px-2 lg:hidden">
          <TabsTrigger value="produtos">Produtos</TabsTrigger>
          <TabsTrigger value="pedido">
            No pedido
            <span
              v-if="itens.length > 0"
              class="bg-primary text-primary-foreground min-w-5 rounded-full px-1.5 text-xs tabular-nums"
            >
              {{ itens.length }}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="produtos"
          force-mount
          class="data-[state=inactive]:hidden lg:data-[state=inactive]:block"
        >
          <BuscaProdutos
            :cliente-id="clienteId"
            :ids-adicionados="itens.map((item) => item.produto.id)"
            @adicionar="(produto) => pedido.adicionar(clienteId, produto)"
          />
        </TabsContent>
      </section>

      <aside class="lg:bg-card lg:flex lg:min-h-0 lg:flex-col lg:border-l">
        <div class="hidden items-baseline justify-between border-b px-6 pt-6 pb-3 lg:flex">
          <h2 class="font-semibold">Pedido</h2>
          <span class="text-muted-foreground text-sm">
            {{ itens.length === 1 ? "1 item" : `${itens.length} itens` }}
          </span>
        </div>

        <TabsContent
          value="pedido"
          force-mount
          class="data-[state=inactive]:hidden lg:flex-1 lg:overflow-y-auto lg:data-[state=inactive]:block"
        >
          <ItensPedido
            :itens="itens"
            :alcada="sessao.vendedor?.alcada_desconto_percentual ?? 0"
            @alterar="pedido.alterarEmbalagens"
            @alterar-desconto="pedido.alterarDesconto"
            @remover="(item) => pedido.remover(clienteId, item)"
          />
        </TabsContent>

        <ResumoPedido
          class="fixed inset-x-0 bottom-0 z-20 lg:static"
          :itens="itens"
          :cliente="cliente"
          :alcada="sessao.vendedor?.alcada_desconto_percentual ?? 0"
          :enviando="enviando"
          :erro-envio="erroEnvio"
          @enviar="enviar"
        />
      </aside>
    </Tabs>
  </div>
</template>
