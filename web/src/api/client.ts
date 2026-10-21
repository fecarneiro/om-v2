import type { z } from "zod";
import { ApiError } from "./errors";

async function lerResposta<S extends z.ZodType>(
  resposta: Response,
  schema: S,
): Promise<z.infer<S>> {
  if (!resposta.ok) {
    const corpo = await resposta.json().catch(() => ({}));
    throw new ApiError(resposta.status, corpo.codigo ?? "erro_desconhecido", corpo.produto_id);
  }

  return schema.parse(await resposta.json());
}

export async function get<S extends z.ZodType>(
  caminho: string,
  schema: S,
  opcoes: { signal?: AbortSignal } = {},
) {
  return lerResposta(await fetch(`/api${caminho}`, { signal: opcoes.signal }), schema);
}

export async function post<S extends z.ZodType>(caminho: string, corpo: unknown, schema: S) {
  const resposta = await fetch(`/api${caminho}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(corpo),
  });
  return lerResposta(resposta, schema);
}
