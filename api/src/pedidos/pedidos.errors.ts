export class PedidoInvalidoError extends Error {
  constructor(
    codigo: string,
    readonly produto_id?: string,
  ) {
    super(codigo);
  }
}
