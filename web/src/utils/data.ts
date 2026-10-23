const formatador = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });

export function formatarData(data: string) {
  return formatador.format(new Date(data));
}
