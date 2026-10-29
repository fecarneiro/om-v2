import type { z } from "zod";
import { ApiError, FalhaDeRedeError } from "./errors";

async function requisitar(url: string, init?: RequestInit) {
  try {
    return await fetch(url, init);
  } catch (erro) {
    if (erro instanceof DOMException && erro.name === "AbortError") throw erro;
    throw new FalhaDeRedeError(erro);
  }
}

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
  return lerResposta(await requisitar(`/api${caminho}`, { signal: opcoes.signal }), schema);
}

export async function post<S extends z.ZodType>(
  caminho: string,
  corpo: unknown,
  schema: S,
  opcoes: { headers?: Record<string, string> } = {},
) {
  const resposta = await requisitar(`/api${caminho}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...opcoes.headers },
    body: JSON.stringify(corpo),
  });
  return lerResposta(resposta, schema);
}
