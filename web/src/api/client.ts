import type { z } from "zod";
import { ApiError } from "./errors";

export async function get<S extends z.ZodType>(
  caminho: string,
  schema: S,
  opcoes: { signal?: AbortSignal } = {},
): Promise<z.infer<S>> {
  const resposta = await fetch(`/api${caminho}`, { signal: opcoes.signal });

  if (!resposta.ok) {
    const corpo = await resposta.json().catch(() => ({}));
    throw new ApiError(resposta.status, corpo.codigo ?? "erro_desconhecido");
  }

  return schema.parse(await resposta.json());
}
