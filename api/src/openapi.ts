import {
  clienteCarteiraSchema,
  novoPedidoSchema,
  pedidoEnviadoSchema,
  pedidoHistoricoSchema,
  produtoBuscaSchema,
  vendedorSchema,
} from "contracts/schemas";
import { type ZodType, z } from "zod";

const erro = {
  type: "object",
  properties: { codigo: { type: "string" }, produto_id: { type: "string" } },
};

const respostaDeErro = (description: string) => ({
  description,
  content: { "application/json": { schema: erro } },
});

const resposta = (description: string, schema: ZodType) => ({
  description,
  content: {
    "application/json": { schema: z.toJSONSchema(schema, { target: "openapi-3.0" }) },
  },
});

const parametroDeCaminho = (name: string, example: string) => ({
  name,
  in: "path",
  required: true,
  schema: { type: "string" },
  example,
});

export const openapi = {
  openapi: "3.0.3",
  info: { title: "Order Manager API", version: "0.1.0" },
  paths: {
    "/vendedores": {
      get: {
        summary: "Lista os vendedores (login simulado)",
        responses: {
          200: resposta("Vendedores com a alçada de desconto", vendedorSchema.array()),
        },
      },
    },
    "/vendedores/{id}/clientes": {
      get: {
        summary: "Carteira do vendedor",
        parameters: [parametroDeCaminho("id", "V01")],
        responses: {
          200: resposta("Clientes com crédito disponível", clienteCarteiraSchema.array()),
        },
      },
    },
    "/vendedores/{id}/clientes/{clienteId}": {
      get: {
        summary: "Cliente da carteira do vendedor",
        parameters: [parametroDeCaminho("id", "V01"), parametroDeCaminho("clienteId", "C001")],
        responses: {
          200: resposta("Cliente com crédito disponível", clienteCarteiraSchema),
          404: respostaDeErro("Cliente inexistente ou fora da carteira"),
        },
      },
    },
    "/clientes/{clienteId}/produtos": {
      get: {
        summary: "Busca produtos com o preço da tabela do cliente",
        parameters: [
          parametroDeCaminho("clienteId", "C001"),
          {
            name: "busca",
            in: "query",
            description: "Palavras da descrição, marca ou SKU; só dígitos busca pelo EAN",
            schema: { type: "string" },
            example: "arroz",
          },
        ],
        responses: {
          200: resposta(
            "Até 20 produtos, com disponibilidade e preço ou motivo",
            produtoBuscaSchema.array(),
          ),
          400: respostaDeErro("Input inválido"),
        },
      },
    },
    "/clientes/{clienteId}/catalogo": {
      get: {
        summary: "Catálogo completo com o preço da tabela do cliente (cache offline)",
        parameters: [parametroDeCaminho("clienteId", "C001")],
        responses: {
          200: resposta(
            "Todos os produtos, com disponibilidade e preço ou motivo",
            produtoBuscaSchema.array(),
          ),
        },
      },
    },
    "/clientes/{clienteId}/pedidos": {
      get: {
        summary: "Últimos pedidos do cliente, com disponibilidade e preço atuais",
        parameters: [
          parametroDeCaminho("clienteId", "C001"),
          {
            name: "vendedor_id",
            in: "query",
            required: true,
            description: "Vendedor da carteira do cliente",
            schema: { type: "string" },
            example: "V01",
          },
        ],
        responses: {
          200: resposta(
            "Pedidos do mais recente para o mais antigo",
            pedidoHistoricoSchema.array(),
          ),
          400: respostaDeErro("Input inválido"),
          404: respostaDeErro("Cliente inexistente ou fora da carteira"),
        },
      },
    },
    "/pedidos": {
      post: {
        summary: "Envia um pedido",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: z.toJSONSchema(novoPedidoSchema, { target: "openapi-3.0" }),
              example: {
                vendedor_id: "V01",
                cliente_id: "C001",
                itens: [{ produto_id: "P001", quantidade: 20, desconto_percentual: 0 }],
              },
            },
          },
        },
        responses: {
          201: resposta("Pedido gravado, com status e total", pedidoEnviadoSchema),
          400: respostaDeErro("JSON ou input inválido"),
          422: respostaDeErro("Regra de negócio violada (produto_id quando o erro é de um item)"),
        },
      },
    },
  },
};
