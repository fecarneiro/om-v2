import { Router } from "express";
import { db } from "../db/client.js";
import { buscarClienteDaCarteira, listarCarteira, listarVendedores } from "./vendedores.service.js";

export const vendedoresRoutes = Router();

vendedoresRoutes.get("/vendedores", async (_req, res) => {
  res.json(await listarVendedores(db));
});

vendedoresRoutes.get("/vendedores/:id/clientes", async (req, res) => {
  res.json(await listarCarteira(db, req.params.id));
});

vendedoresRoutes.get("/vendedores/:id/clientes/:clienteId", async (req, res) => {
  const cliente = await buscarClienteDaCarteira(db, req.params.id, req.params.clienteId);
  if (!cliente) return res.status(404).json({ codigo: "cliente_nao_encontrado" });
  res.json(cliente);
});
