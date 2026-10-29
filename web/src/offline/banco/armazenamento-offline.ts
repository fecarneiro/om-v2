import type { ClienteCarteira, ProdutoBusca } from "contracts/schemas";
import { createStore, get, set } from "idb-keyval";

const bancoOffline = createStore("om-offline", "dados");

export type DadosOffline<T> = { dados: T; sincronizado_em: string };

// Interação banco

function salvar<T>(chave: string, dados: T) {
  const registro: DadosOffline<T> = { dados, sincronizado_em: new Date().toISOString() };
  return set(chave, registro, bancoOffline);
}

function ler<T>(chave: string): Promise<DadosOffline<T> | undefined> {
  return get(chave, bancoOffline);
}

// Auxiliares

export function salvarCarteiraOffline(vendedorId: string, carteira: ClienteCarteira[]) {
  return salvar(`carteira:${vendedorId}`, carteira);
}

export function lerCarteiraOffline(vendedorId: string) {
  return ler<ClienteCarteira[]>(`carteira:${vendedorId}`);
}

export async function lerClienteOffline(
  vendedorId: string,
  clienteId: string,
): Promise<DadosOffline<ClienteCarteira> | undefined> {
  const carteira = await lerCarteiraOffline(vendedorId);
  const cliente = carteira?.dados.find((cliente) => cliente.id === clienteId);
  return carteira && cliente && { dados: cliente, sincronizado_em: carteira.sincronizado_em };
}

export function salvarCatalogoOffline(clienteId: string, catalogo: ProdutoBusca[]) {
  return salvar(`catalogo:${clienteId}`, catalogo);
}

export function lerCatalogoOffline(clienteId: string) {
  return ler<ProdutoBusca[]>(`catalogo:${clienteId}`);
}
