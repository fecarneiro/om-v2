# Order Manager

Módulo de montagem de pedidos para vendedores externos. O vendedor escolhe um cliente da sua carteira, busca produtos por nome ou EAN com o preço da tabela daquele cliente, monta o pedido respeitando embalagem, alçada de desconto, pedido mínimo e crédito, e envia.

Stack: Vue 3 + Vite, Node.js + TypeScript (Express, Drizzle), PostgreSQL, tudo com `docker compose`.

## Como rodar

```bash
docker compose up
```

| Serviço | URL |
|---|---|
| Front | http://localhost:5173 |
| API | http://localhost:3000 |
| Swagger | http://localhost:3000/docs |
| Postgres | `localhost:5432` (usuário, senha e banco: `order_manager`) |
| Postgres de teste | `localhost:5433`, em memória, usado só pelos testes de integração |

Na subida, a API roda as migrations e popula o banco com o `seed.json` se ele estiver vazio. Não há login: na tela inicial, escolha um dos vendedores do seed.

Para recomeçar do zero (apaga o banco):

```bash
docker compose down -v && docker compose up
```

## Como testar

Os testes rodam fora do Docker e precisam de Node e pnpm:

```bash
pnpm install
pnpm test       # regras de negócio e do front, sem banco
pnpm test:int   # integração da API com Postgres real (precisa do docker compose up no ar)
```

| Comando | O que cobre |
|---|---|
| `pnpm test` | regras de negócio em `contracts` (alçada, embalagem, pedido mínimo, crédito, totais) e regras do front em `web` (itens e bloqueios do pedido) |
| `pnpm test:int` | services da API contra o `db-test`: carteira, busca de produtos e envio do pedido com reserva de crédito |

Os testes de integração recriam os dados do `seed.json` no `db-test` antes de rodar (nos de pedido, antes de cada teste), então são independentes entre si e não tocam no banco do app.


## Requisitos do enunciado

| # | Requisito | Situação |
|---|---|---|
| 1 | Vendedor vê só a própria carteira | ✅ |
| 2 | Busca por nome ou EAN com preço da tabela do cliente | ✅ |
| 3 | Montar pedido com embalagem e desconto | ✅ |
| 4 | Totais e bloqueio de envio | ✅ |
| 5 | Envio com status "Enviado" ou "Aguardando aprovação" | ✅ |
| 6 | Testes das regras de negócio | ✅ |
| 7 | Limite de crédito (desejável) | ✅ |
| 8 | Histórico e "repetir pedido" (desejável) | ✅ |
| 9 | Pedido offline com sincronização (opcional) | ❌ |

## O que ficou de fora

- **Offline e sincronização.** O pedido em montagem fica só na memória do front: some se a página recarregar ou se o celular descartar a aba, e não é reenviado quando a conexão volta.
- **Idempotência do envio.** O id do pedido é gerado na API; com sinal ruim, um reenvio pode duplicar o pedido. O caminho seria o app gerar o id e a API ignorar repetidos.
- **Feedback e resiliência com internet fraca.** Carteira, cliente, busca e envio têm estados de carregamento e de erro, e a busca cancela requisições antigas. Mas há telas sem feedback enquanto carregam (o seletor de vendedores do login fica vazio, e o histórico mostra "nenhum pedido" até a resposta chegar), o `fetch` não tem timeout (numa conexão que trava, a tela fica carregando indefinidamente), não há botão de "tentar de novo" (o vendedor recarrega a página) e não há aviso de que o aparelho está sem conexão.
- **Aprovação do supervisor.** O pedido fica como "Aguardando aprovação", sem tela para aprovar ou recusar.
- **Devolução de crédito.** Cada envio soma ao crédito utilizado do cliente, mas nada devolve: não há recusa de aprovação, cancelamento nem baixa por pagamento. Em uso contínuo, o crédito disponível só diminui.
- **Autenticação real.** O login é só a escolha do vendedor, guardada no `localStorage`.
- **Testes de componente e E2E.** As regras têm testes unitários e de integração com Postgres real; não há testes de componentes Vue nem de ponta a ponta no navegador (ex.: Playwright).
- **Mudança de preço durante a montagem.** O front calcula com o preço do momento em que o item entrou. Se o produto ficar indisponível, ou se o preço novo estourar o crédito ou o mínimo, o envio é bloqueado com erro. Se o preço mudar sem violar nenhuma regra, o pedido é gravado com o valor novo, e o vendedor só vê a diferença no total da tela de confirmação.
- **Produto sem preço na tabela do cliente.** Aparece como indisponível e o vendedor não consegue vendê-lo; não há fluxo para pedir a inclusão do preço.
- **Crédito mínimo para visita.** Cliente sem crédito aparece na carteira normalmente. Uma ideia seria usar o histórico para sinalizar, antes da visita, se o crédito cobre um pedido típico.
- **Diferenças em relação ao pedido original ao repetir.** O histórico mostra os itens com o preço de hoje, sem o preço da época; e a quantidade é arredondada para cima até fechar a embalagem atual. O vendedor vê o novo total, mas não há destaque do que mudou em preço ou quantidade.
- **Paginação, filtros e ordenação.** A busca devolve até 20 produtos, sem paginação nem filtro por categoria ou marca. A carteira lista todos os clientes, sem busca por nome (suficiente para as carteiras pequenas do seed). O histórico mostra os 10 últimos pedidos ordenados só pela data, sem horário: pedidos do mesmo dia não têm ordem garantida.

## Documentos
- Mocks da interface (abrir o HTML no navegador):
  - [mock-v1.html](.docs/mock/mock-v1.html): primeiro mock da interface estilizada
  - [mock-v2.html](.docs/mock/mock-v2.html): montagem do pedido antes e depois da revisão de UX, no mobile e no desktop
  - [mock-v3.html](.docs/mock/mock-v3.html): repetir pedido a partir do histórico do cliente
- [DECISIONS.md](DECISIONS.md): decisões técnicas e alternativas
- [ASSUMPTIONS.md](ASSUMPTIONS.md): ambiguidades do enunciado e do seed, e a interpretação adotada
- [AI_LOG.md](AI_LOG.md): uso de IA e mapa de autoria

