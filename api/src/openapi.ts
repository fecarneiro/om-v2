import { z } from "zod";
import { novoPedidoSchema } from "./pedidos/pedidos.schema.js";

const erro = {
  type: "object",
  properties: { codigo: { type: "string" }, produto_id: { type: "string" } },
};

const respostaDeErro = (description: string) => ({
  description,
  content: { "application/json": { schema: erro } },
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
        responses: { 200: { description: "Vendedores com a alçada de desconto" } },
      },
    },
    "/vendedores/{id}/clientes": {
      get: {
        summary: "Carteira do vendedor",
        parameters: [parametroDeCaminho("id", "V01")],
        responses: { 200: { description: "Clientes com crédito disponível" } },
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
          201: { description: "Pedido gravado, com status e total" },
          400: respostaDeErro("JSON ou input inválido"),
          422: respostaDeErro("Regra de negócio violada (produto_id quando o erro é de um item)"),
        },
      },
    },
  },
};
