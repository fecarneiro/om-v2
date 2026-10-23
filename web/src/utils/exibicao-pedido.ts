import type { StatusPedido } from "contracts/constants";

const STATUS: Record<StatusPedido, string> = {
  enviado: "Enviado",
  aguardando_aprovacao: "Aguardando aprovação",
  faturado: "Faturado",
  cancelado: "Cancelado",
};

export function nomeDoStatus(status: StatusPedido) {
  return STATUS[status];
}
