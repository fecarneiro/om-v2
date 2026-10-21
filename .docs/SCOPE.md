# Stack:
Vue 3 no frontend, Node.js com TypeScript no backend
PostgreSQL
docker compose

# Requisitos
## Obrigatórios
1. Escopo vendedor
- Vendedor possui carteira de clientes
- um vendedor não ve do outro
- login com select de vendedor (sem auth)

2. Busca de produtos
- Por cód. de barras (EAN)
- Busca por nome

3. Pedido
- adicionar itens
- ajustar quantidade
- aplicar desconto
- respeitar fator unidade de venda e fator embalagem

4. Valor total pedido
- bloquear envio quando regras não forem atendidas

5. Status pedido
- Enviado
- "Aguardando aprovação"

6. Testes automatizados

## Desejáveis
7. Respeitar limite crédito disponível cliente
8. Opção repetir pedido (histórico)

## Opcional
9. Sincronizar pedido offline -> online


---
# Notes
- Assumir estoque "infinito"
- Desconto: por produto ou por pedido?
  - Item (produto)
- Repetir pedido -> `pode esbarrar em ativo false`
  - Poderia nesse caso ter uma "recomendação similares"
- Existe 1 supervisor no seed, mas antecipar "N"
- Precisa do enum "aguardando aprovação" , "aprovado"
- preco_unidade é por produto e não embalagem
- crédito disponível = limite - utilizado
- todos produtos aparecem na busca
  - mas mostram disponivel/nao disponivel
- Produtos ativos deveriam ter preço em todas tabelas (expectativa, não regra)
  - existe um que esta inativo e sem constar em uma das tabelas
- ⭐⭐⭐ INDEXES
- Interessante mostrar no front os creditos disponiveis daquele cliente.

# Assumptions
- Alçada Desconto
  - Desconto em no máximo 1 item do pedido; mais de 1 item com desconto bloqueia o envio.
  - Desconto até a alçada (inclusive) -> "enviado"; acima -> "aguardando aprovação".
- Unidade de venda e fator de embalagem
  - Produtos CX/FD são vendidos sempre em embalagens inteiras (sem unidade avulsa).
  - `venda_somente_multiplo` true: mínimo de 2 embalagens; false: mínimo de 1 embalagem.
  - Evidência: PH002 vendeu 1 caixa do P015 (`venda_somente_multiplo` false).
- Todo produto ativo deveria ter preço nas 3 tabelas, mas isso não é garantido pelo sistema.
- Todo vendedor precisa ter um supervisor.
- Alçada de desconto obigatória, not null e sem default.
- Pedido mínimo considera o valor bruto (sem desconto aplicado).
- Cliente sem `tabela_preco_id` registrada (legados) usarão a TP01 como default fallback e terão um warning no front (não impedirá do vendedor atuar)
- Percentuais de descontos e alçadas são inteiros
- "Tabela de preço: cada cliente está vinculado a uma tabela; o mesmo produto tem
preços diferentes em tabelas diferentes."
  - assumi que podem ser preços iguais.
  - Produto ativo sem preço na tabela do cliente aparece como indisponível apenas para os clientes daquela tabela; o produto não é inativado"
  - Sem regras no banco: uma nova tabela de preços inativaria temporariamente todos os produtos.
- Produto inativo e sem preço ao mesmo tempo: o motivo exibido é `produto_inativo` (inatividade prevalece).
- Status `aguardando_aprovação` "reserva" os créditos consumidos do cliente (conta como consumido)

# Observações no seed.json

- Cliente sem tabela de preço
- EAN (cód de barras) duplicado
  - Não pode ser UNIQUE (por enquanto)
- Produto não é mencionado em tabela de preços
  - Fica indisponível (`produto_sem_preco`) para clientes daquela tabela
  - Fallback para TP01 vale só para cliente sem tabela
- Snapshop de pedidos com preços
  - Blinda quanto a mudança de preços com o tempo
  - Registrar por preço unitario de produto, mesmo quando em caixas/fd, e a UI interpreta
  - Sem snapshot extra: item guarda apenas quantidade, preço unitário e desconto (igual ao seed)
  - Ao "repetir pedido"
    - Fazer um cálculo de quantidade com preço atual
    - E se o pedido mínimo na época era X valor, e agora a régua aumentou?
      - Não compensa ter CHECK no banco... pode alterar com o tempo.
- Crédito de Clientes
  - Clientes com crédito zerado
    - Barrar visita?
    - Validar valor crédito mín. de cliente?
      - Não fazer, mas ponderar: usar histórico para ver gasto médio de cliente e assim criar um crédito mínimo para visita "pronto para seguir" ou "não"?
- Considerar, pelo histórico e enunciado:
  - percentual desconto vendedor -> apenas 1 item do pedido (mais de 1 bloqueia o envio)
  - assumido limite desconto como sendo "menor ou igual" e não "menor"
- Enum: "faturado" e "cancelado", presente no json e no enunciado não
- Falta enum em pedidos: "aguardando aprovação" , "aprovado"
- Historico
  - Pedidos
    - Items[]
      - Quantidade
      - Preço unitário
  - Interface converte para caixas (com regra vigente, snapshot tambem)
- Pedidos venda somente múltiplo: mínimo 2 CX/FD; sem múltiplo: mínimo 1 CX/FD (sempre embalagem inteira)
- Pedido "enviado" ou "aguardando aprovação" consomem o crédito?

