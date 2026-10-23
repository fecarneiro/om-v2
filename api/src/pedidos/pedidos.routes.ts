import { novoPedidoSchema } from "contracts/schemas";
import { Router } from "express";
import { z } from "zod";
import { db } from "../db/client.js";
import { enviarPedido, listarUltimosPedidosPrecoAtual } from "./pedidos.service.js";

const historicoSchema = z.object({ vendedor_id: z.string().min(1) });

export const pedidosRoutes = Router();

pedidosRoutes.post("/pedidos", async (req, res) => {
  const input = novoPedidoSchema.parse(req.body);
  const pedido = await enviarPedido(db, input);
  res.status(201).json(pedido);
});

pedidosRoutes.get("/clientes/:clienteId/pedidos", async (req, res) => {
  const { vendedor_id } = historicoSchema.parse(req.query);
  const pedidos = await listarUltimosPedidosPrecoAtual(db, vendedor_id, req.params.clienteId);
  if (!pedidos) return res.status(404).json({ codigo: "cliente_nao_encontrado" });
  res.json(pedidos);
});
