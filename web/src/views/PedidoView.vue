<script setup lang="ts">
import { History } from "@lucide/vue";
import { useMediaQuery } from "@vueuse/core";
import { totalLiquidoDoPedido } from "contracts/rules";
import {
  type ClienteCarteira,
  clienteCarteiraSchema,
  type PedidoEnviado,
  type PedidoHistorico,
  pedidoEnviadoSchema,
  pedidoHistoricoSchema,
} from "contracts/schemas";
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { get, post } from "@/api/client";
import { ApiError } from "@/api/errors";
import CabecalhoApp from "@/components/app/CabecalhoApp.vue";
import BuscaProdutos from "@/components/pedido/BuscaProdutos.vue";
import CabecalhoCliente from "@/components/pedido/CabecalhoCliente.vue";
import ItensPedido from "@/components/pedido/ItensPedido.vue";
import ResultadoEnvio from "@/components/pedido/ResultadoEnvio.vue";
import ResumoPedido from "@/components/pedido/ResumoPedido.vue";
import UltimosPedidos from "@/components/pedido/UltimosPedidos.vue";
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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { itemEmUnidades, itemParaApi, itemValido } from "@/regras/item-pedido";
import { usePedidoStore } from "@/stores/pedido";
import { useSessaoStore } from "@/stores/sessao";
import { mensagemDoErro } from "@/utils/mensagens-erro";

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
const pedidoAberto = ref(false);
const desktop = useMediaQuery("(min-width: 1024px)");

const ultimosPedidos = ref<PedidoHistorico[]>([]);
const historicoAberto = ref(false);
const confirmandoRepeticao = ref(false);
const pedidoParaRepetir = ref<PedidoHistorico | null>(null);

const itens = computed(() => pedido.itens(clienteId));
const textoItens = computed(() =>
  itens.value.length === 1 ? "1 item" : `${itens.value.length} itens`,
);
const alcada = computed(() => sessao.vendedor?.alcada_desconto_percentual ?? 0);
const total = computed(() => totalLiquidoDoPedido(itens.value.filter(itemValido).map(itemEmUnidades)));

async function carregarCliente() {
  if (!sessao.vendedor) return;
  try {
    cliente.value = await get(
      `/vendedores/${sessao.vendedor.id}/clientes/${clienteId}`,
      clienteCarteiraSchema,
    );
  } catch (e) {
    if (cliente.value) return;
    erro.value = e instanceof ApiError && e.status === 404 ? "nao_encontrado" : "falha";
  } finally {
    carregando.value = false;
  }
}

async function carregarHistorico() {
  if (!sessao.vendedor) return;
  try {
    ultimosPedidos.value = await get(
      `/clientes/${clienteId}/pedidos?vendedor_id=${sessao.vendedor.id}`,
      pedidoHistoricoSchema.array(),
    );
  } catch {
    ultimosPedidos.value = [];
  }
}

onMounted(() => {
  carregarCliente();
  carregarHistorico();
});

function repetir(historico: PedidoHistorico) {
  pedidoParaRepetir.value = historico;
  if (itens.value.length) confirmandoRepeticao.value = true;
  else confirmarRepeticao();
}

function confirmarRepeticao() {
  if (!pedidoParaRepetir.value) return;
  pedido.repetir(clienteId, pedidoParaRepetir.value);
  pedidoParaRepetir.value = null;
  historicoAberto.value = false;
}

function mensagemErroEnvio(e: unknown) {
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
        itens: itens.value.map(itemParaApi),
      },
      pedidoEnviadoSchema,
    );
    pedido.esvaziar(clienteId);
    pedidoAberto.value = false;
    await Promise.all([carregarCliente(), carregarHistorico()]);
  } catch (e) {
    erroEnvio.value = mensagemErroEnvio(e);
  } finally {
    enviando.value = false;
  }
}
</script>

<template>
  <div class="pb-44 lg:grid lg:h-dvh lg:grid-rows-[auto_1fr] lg:pb-0">
    <CabecalhoApp voltar="/clientes" />

    <p v-if="carregando" class="text-muted-foreground px-5 py-10 text-center">
      Carregando cliente...
    </p>
    <p v-else-if="erro === 'nao_encontrado'" class="text-destructive px-5 py-10 text-center">
      Cliente não encontrado na sua carteira.
    </p>
    <p v-else-if="erro" class="text-destructive px-5 py-10 text-center">
      Não foi possível carregar o cliente.
    </p>

    <div
      v-else-if="cliente && !pedidoGravado"
      class="lg:grid lg:min-h-0 lg:grid-cols-[1fr_420px]"
    >
      <section class="lg:overflow-y-auto lg:px-8">
        <CabecalhoCliente class="lg:pt-6" :cliente="cliente" :total-pedido="total">
          <Button
            variant="ghost"
            size="icon"
            class="text-foreground border"
            aria-label="Últimos pedidos"
            @click="historicoAberto = true"
          >
            <History />
          </Button>
        </CabecalhoCliente>
        <BuscaProdutos
          :cliente-id="clienteId"
          :itens="itens"
          @adicionar="(produto) => pedido.adicionar(clienteId, produto)"
          @alterar="pedido.alterarEmbalagens"
        />
      </section>

      <!-- Desktop -->
      <aside v-if="desktop" class="bg-card flex min-h-0 flex-col border-l">
        <h2 class="border-b px-6 pt-6 pb-3 font-semibold">Pedido · {{ textoItens }}</h2>
        <div class="flex-1 overflow-y-auto">
          <ItensPedido
            :itens="itens"
            :alcada="alcada"
            @alterar="pedido.alterarEmbalagens"
            @alterar-desconto="pedido.alterarDesconto"
            @remover="(item) => pedido.remover(clienteId, item)"
          />
        </div>
        <ResumoPedido
          variante="detalhado"
          class="bg-background"
          :itens="itens"
          :cliente="cliente"
          :alcada="alcada"
          :enviando="enviando"
          :erro-envio="erroEnvio"
          @enviar="enviar"
        />
      </aside>

      <!-- Mobile -->
      <template v-else>
        <ResumoPedido
          variante="compacto"
          :itens="itens"
          :cliente="cliente"
          :alcada="alcada"
          :enviando="enviando"
          :erro-envio="erroEnvio"
          @enviar="enviar"
          @abrir="pedidoAberto = true"
        />
        <Sheet v-model:open="pedidoAberto">
          <SheetContent
            side="bottom"
            class="max-h-[85dvh] gap-0 rounded-t-2xl"
            :aria-describedby="undefined"
          >
            <SheetHeader class="border-b px-5 pt-5 pb-3">
              <SheetTitle>Pedido · {{ textoItens }}</SheetTitle>
            </SheetHeader>
            <div class="flex-1 overflow-y-auto">
              <ItensPedido
                :itens="itens"
                :alcada="alcada"
                @alterar="pedido.alterarEmbalagens"
                @alterar-desconto="pedido.alterarDesconto"
                @remover="(item) => pedido.remover(clienteId, item)"
              />
            </div>
            <ResumoPedido
              variante="detalhado"
              :itens="itens"
              :cliente="cliente"
              :alcada="alcada"
              :enviando="enviando"
              :erro-envio="erroEnvio"
              @enviar="enviar"
            />
          </SheetContent>
        </Sheet>
      </template>

      <Sheet v-model:open="historicoAberto">
        <SheetContent
          :side="desktop ? 'right' : 'bottom'"
          class="gap-0"
          :class="desktop ? 'w-110 sm:max-w-none' : 'max-h-[85dvh] rounded-t-2xl'"
          :aria-describedby="undefined"
        >
          <SheetHeader class="border-b px-5 pt-5 pb-3">
            <SheetTitle>Últimos pedidos</SheetTitle>
          </SheetHeader>
          <div class="flex-1 overflow-y-auto">
            <UltimosPedidos :pedidos="ultimosPedidos" @repetir="repetir" />
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog v-model:open="confirmandoRepeticao">
        <AlertDialogContent class="bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Substituir os itens do pedido atual?</AlertDialogTitle>
            <AlertDialogDescription>
              A montagem atual do pedido possui {{ textoItens }}. Ao repetir o histórico, eles serão substituídos pelos itens do pedido escolhido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction @click="confirmarRepeticao">Substituir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>

    <ResultadoEnvio
      v-else-if="cliente && pedidoGravado"
      :cliente="cliente"
      :pedido="pedidoGravado"
      :total="total"
      @novo="pedidoGravado = null"
    />
  </div>
</template>
