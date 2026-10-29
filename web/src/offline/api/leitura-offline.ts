import { FalhaDeRedeError } from "@/api/errors";
import type { DadosOffline } from "@/offline/banco/armazenamento-offline";

export function detectouFalhaDeRedeOffline(erro: unknown) {
  return erro instanceof FalhaDeRedeError;
}

export async function lerComFallbackOffline<T>(
  lerDaApi: () => Promise<T>,
  lerDoBancoLocal: () => Promise<DadosOffline<T> | undefined>,
): Promise<T> {
  try {
    return await lerDaApi();
  } catch (erro) {
    if (!detectouFalhaDeRedeOffline(erro)) throw erro;
    const local = await lerDoBancoLocal();
    if (!local) throw erro;
    return local.dados;
  }
}
