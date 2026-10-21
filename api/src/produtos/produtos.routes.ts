import { Router } from "express";
import { z } from "zod";
import { db } from "../db/client.js";
import { buscarProdutos } from "./produtos.service.js";

const buscaSchema = z.object({ busca: z.string().trim().default("") });

export const produtosRoutes = Router();

produtosRoutes.get("/clientes/:clienteId/produtos", async (req, res) => {
  const { busca } = buscaSchema.parse(req.query);
  res.json(await buscarProdutos(db, req.params.clienteId, busca));
});
