export class PedidoInvalidoError extends Error {
  constructor(
    codigo: string,
    readonly produto_id?: string,
  ) {
    super(codigo);
  }
}

export class ChaveIdempotenciaEmUsoError extends Error {
  constructor() {
    super("chave_idempotencia_em_uso");
  }
}
