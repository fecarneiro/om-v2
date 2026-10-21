import { z } from "zod";

export const vendedorSchema = z.object({
  id: z.string(),
  nome: z.string(),
  supervisor_id: z.string(),
  alcada_desconto_percentual: z.int(),
});

export type Vendedor = z.infer<typeof vendedorSchema>;
