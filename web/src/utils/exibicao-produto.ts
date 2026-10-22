import Big from "big.js";
import { embalagensMinimas } from "contracts/rules";
import type { Produto } from "contracts/schemas";
import { formatarMoeda } from "./moeda";

const UNIDADE_VENDA: Record<Produto["unidade_venda"], { singular: string; plural: string }> = {
  UN: { singular: "Unidade", plural: "Unidades" },
  CX: { singular: "Caixa", plural: "Caixas" },
  FD: { singular: "Fardo", plural: "Fardos" },
};

export function exibicaoEmbalagens(produto: Produto, embalagens: number) {
  const nome = UNIDADE_VENDA[produto.unidade_venda];
  return (embalagens === 1 ? nome.singular : nome.plural).toLowerCase();
}

export function exibicaoUnidade(produto: Produto) {
  const nome = UNIDADE_VENDA[produto.unidade_venda].singular;
  return produto.unidade_venda === "UN" ? nome : `${nome} c/ ${produto.fator_embalagem}`;
}

export function exibicaoMinimo(produto: Produto) {
  const minimo = embalagensMinimas(produto);
  if (minimo === 1) return null;
  return `Mín. ${minimo} ${exibicaoEmbalagens(produto, minimo)}`;
}

export function precoPorEmbalagem(produto: Produto, precoUnidade: string) {
  if (produto.unidade_venda === "UN") return null;
  const embalagem = formatarMoeda(new Big(precoUnidade).times(produto.fator_embalagem).toFixed(2));
  return `${embalagem} por ${exibicaoEmbalagens(produto, 1)}`;
}
