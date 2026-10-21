import { Router } from "express";
import { db } from "../db/client.js";
import { listarCarteira, listarVendedores } from "./vendedores.service.js";

export const vendedoresRoutes = Router();

vendedoresRoutes.get("/vendedores", async (_req, res) => {
  res.json(await listarVendedores(db));
});

vendedoresRoutes.get("/vendedores/:id/clientes", async (req, res) => {
  res.json(await listarCarteira(db, req.params.id));
});
