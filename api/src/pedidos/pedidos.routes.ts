import { Router } from "express";
import { db } from "../db/client.js";
import { novoPedidoSchema } from "./pedidos.schema.js";
import { enviarPedido } from "./pedidos.service.js";

export const pedidosRoutes = Router();

pedidosRoutes.post("/pedidos", async (req, res) => {
  const input = novoPedidoSchema.parse(req.body);
  const pedido = await enviarPedido(db, input);
  res.status(201).json(pedido);
});
