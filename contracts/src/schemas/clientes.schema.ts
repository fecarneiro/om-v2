import { z } from "zod";

export const clienteCarteiraSchema = z.object({
  id: z.string(),
  nome_fantasia: z.string(),
  razao_social: z.string(),
  cnpj: z.string(),
  vendedor_id: z.string(),
  tabela_preco_id: z.string().nullable(),
  limite_credito: z.string(),
  credito_utilizado: z.string(),
  credito_disponivel: z.string(),
  tabela_preco: z.object({ id: z.string(), nome: z.string() }).nullable(),
  tabela_preco_pendente: z.boolean(),
  cidade: z.string().nullable(),
  uf: z.string().nullable(),
});

export type ClienteCarteira = z.infer<typeof clienteCarteiraSchema>;
