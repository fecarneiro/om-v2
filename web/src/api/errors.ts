export class ApiError extends Error {
  status: number;
  codigo: string;

  constructor(status: number, codigo: string) {
    super(codigo);
    this.status = status;
    this.codigo = codigo;
  }
}
