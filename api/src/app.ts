import express, { type NextFunction, type Request, type Response } from "express";
import swaggerUi from "swagger-ui-express";
import { ZodError } from "zod";
import { openapi } from "./openapi.js";
import { ChaveIdempotenciaEmUsoError, PedidoInvalidoError } from "./pedidos/pedidos.errors.js";
import { pedidosRoutes } from "./pedidos/pedidos.routes.js";
import { produtosRoutes } from "./produtos/produtos.routes.js";
import { vendedoresRoutes } from "./vendedores/vendedores.routes.js";

export const app = express();

app.use(express.json());
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapi));
app.use(vendedoresRoutes);
app.use(produtosRoutes);
app.use(pedidosRoutes);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof SyntaxError) return res.status(400).json({ codigo: "json_invalido" });

  if (err instanceof ZodError)
    return res.status(400).json({ codigo: "input_invalido", erros: err.issues });

  if (err instanceof PedidoInvalidoError)
    return res.status(422).json({ codigo: err.message, produto_id: err.produto_id });

  if (err instanceof ChaveIdempotenciaEmUsoError)
    return res.status(409).json({ codigo: err.message });

  console.error(err);
  res.status(500).json({ codigo: "erro_interno" });
});
