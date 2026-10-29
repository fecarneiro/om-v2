import { novoPedidoSchema } from "contracts/schemas";
import { Router } from "express";
import { z } from "zod";
import { db } from "../db/client.js";
import { enviarPedido, listarUltimosPedidosPrecoAtual } from "./pedidos.service.js";

const historicoSchema = z.object({ vendedor_id: z.string().min(1) });
const headersEnvioSchema = z.object({ "idempotency-key": z.string().min(1).max(255) });

export const pedidosRoutes = Router();

pedidosRoutes.post("/pedidos", async (req, res) => {
  const input = novoPedidoSchema.parse(req.body);
  const { "idempotency-key": chaveIdempotencia } = headersEnvioSchema.parse(req.headers);
  const { pedido, criado } = await enviarPedido(db, input, chaveIdempotencia);
  res.status(criado ? 201 : 200).json(pedido);
});

pedidosRoutes.get("/clientes/:clienteId/pedidos", async (req, res) => {
  const { vendedor_id } = historicoSchema.parse(req.query);
  const pedidos = await listarUltimosPedidosPrecoAtual(db, vendedor_id, req.params.clienteId);
  if (!pedidos) return res.status(404).json({ codigo: "cliente_nao_encontrado" });
  res.json(pedidos);
});
