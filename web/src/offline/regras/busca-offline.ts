import { LIMITE_BUSCA_PRODUTOS } from "contracts/constants";
import type { ProdutoBusca } from "contracts/schemas";

// Espelho da busca LIKE/ILIKE do backend (intencional)

function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function textoBuscavel(produto: ProdutoBusca) {
  return normalizar(`${produto.descricao} ${produto.marca ?? ""} ${produto.sku}`);
}

export function filtrarProdutosOffline(produtos: ProdutoBusca[], busca: string): ProdutoBusca[] {
  const termo = busca.trim();
  const termos = normalizar(termo)
    .split(/\s+/)
    .filter((parte) => parte !== "");

  const encontrados = /^\d+$/.test(termo)
    ? produtos.filter((produto) => produto.ean.startsWith(termo))
    : produtos.filter((produto) => {
        const texto = textoBuscavel(produto);
        return termos.every((parte) => texto.includes(parte));
      });

  return encontrados
    .sort((a, b) => a.descricao.localeCompare(b.descricao, "pt-BR"))
    .slice(0, LIMITE_BUSCA_PRODUTOS);
}
