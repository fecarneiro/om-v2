export class ApiError extends Error {
  status: number;
  codigo: string;
  produtoId?: string;

  constructor(status: number, codigo: string, produtoId?: string) {
    super(codigo);
    this.status = status;
    this.codigo = codigo;
    this.produtoId = produtoId;
  }
}

export class FalhaDeRedeError extends Error {
  constructor(causa: unknown) {
    super("falha_de_rede", { cause: causa });
  }
}
