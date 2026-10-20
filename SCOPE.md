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
- pedido minimo
  - sobre bruto ou liquido?
    - liquido... e aparece para o vendedor se da para dar desconto ou nao?
- todos produtos aparecem na busca
  - mas mostram disponivel/nao disponivel
- Produtos ativos obrigatoriamente precisam ter precos em todas tabelas
  - existe um que esta inativo e sem constar em uma das tabelas
- ⭐⭐⭐ INDEXES

# Assumptions
- Desconto por produto (máx 1 produto) e não por pedido
  - Aprovação seria mais de de um produto (precisa marcar no fluxo qual item para supervisor).
- `venda_somente_multiplo` quando true, assumi `mais que 1 CX/FD`
- Todo produto disponível precisa ter preço nas 3 tabelas.
- Todo vendedor precisa ter um supervisor.
- Alçada de desconto obigatória, not null e sem default.

# Observações no seed.json

- Cliente sem tabela de preço
- EAN (cód de barras) duplicado
  - Não pode ser UNIQUE (por enquanto)
- Produto não é mencionado em tabela de preços (fallback tab. padrão?)
- Snapshop de pedidos com preços
  - Blinda quanto a mudança de preços com o tempo
  - Registrar por preço unitario de produto, mesmo quando em caixas/fd, e a UI interpreta
  - Registrar todos dados: quantidade, regras vigentes de unitário, qntd. embalagem, qntd. item por embalagem
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
  - percentual desconto vendedor -> apenas 1 item do pedido
  - assumido limite desconto como sendo "menor ou igual" e não "menor"
- Enum: "faturado" e "cancelado", presente no json e no enunciado não
- Falta enum em pedidos: "aguardando aprovação" , "aprovado"
- Historico
  - Pedidos
    - Items[]
      - Quantidade
      - Preço unitário
  - Interface converte para caixas (com regra vigente, snapshot tambem)
- Pedidos venda somente múltiplo, assumir `obrigatorio > 1 daquela CX/FD`
- Pedido "enviado" ou "aguardando aprovação" consomem o crédito?
