import Big from "big.js";
import { embalagensMinimas } from "contracts/rules";
import type { Produto } from "contracts/schemas";
import { formatarMoeda } from "./moeda";

const UNIDADE_VENDA: Record<Produto["unidade_venda"], { singular: string; plural: string }> = {
  UN: { singular: "Unidade", plural: "Unidades" },
  CX: { singular: "Caixa", plural: "Caixas" },
  FD: { singular: "Fardo", plural: "Fardos" },
};

export function nomeDaEmbalagem(produto: Produto, embalagens: number) {
  const nome = UNIDADE_VENDA[produto.unidade_venda];
  return (embalagens === 1 ? nome.singular : nome.plural).toLowerCase();
}

export function descricaoDaEmbalagem(produto: Produto) {
  const nome = UNIDADE_VENDA[produto.unidade_venda].singular;
  const minimo = embalagensMinimas(produto);
  const embalagem = produto.unidade_venda === "UN" ? nome : `${nome} c/ ${produto.fator_embalagem}`;
  return minimo > 1 ? `${embalagem} (mín. ${minimo})` : embalagem;
}

export function precoDaEmbalagem(produto: Produto, precoUnidade: string) {
  return formatarMoeda(new Big(precoUnidade).times(produto.fator_embalagem).toFixed(2));
}
