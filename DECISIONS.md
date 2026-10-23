# Decisions

## Busca de produtos
- **Contexto:** o vendedor busca por nome ou código de barras enquanto digita, e o resultado traz o preço da tabela do cliente.
- **Escolha:** `ILIKE`, pela simplicidade do catálogo do seed. A busca identifica se o vendedor digitou só números (EAN, pelo começo do código) ou texto; no texto, procura com ou sem acento no nome, na marca e no SKU (ex.: `SKU-1014`). No front, a busca espera o vendedor parar de digitar (debounce) e cancela a requisição anterior quando sai uma nova, para que, com rede lenta, uma resposta antiga não sobrescreva o resultado da busca mais recente.
- **Alternativas:** `tsvector` (busca textual do Postgres) e `pg_trgm` (trigramas), pensadas para catálogos grandes e matches mais precisos.
- **Por quê:** acha "cafe" em "Café" e "arroz 5kg" em "Arroz Branco Tipo 1 5kg", o que basta para o catálogo do seed.
- **Com mais tempo:** mediria a busca atual com um catálogo maior e estudaria `tsvector` e `pg_trgm` antes de escolher entre eles.

## Login simulado e acesso à carteira
- **Contexto:** o enunciado permite simular o login escolhendo o vendedor, mas o vendedor só pode ver a própria carteira.
- **Escolha:** o vendedor escolhido fica no store do Pinia, espelhado no `localStorage`, e vai em cada requisição, no caminho (`/vendedores/:id/clientes`) ou na query (`/clientes/:clienteId/pedidos?vendedor_id=`). A API confere se o cliente é da carteira desse vendedor. A busca de produtos não confere, porque só expõe preços, sem dados do cliente.
- **Alternativas:**
  - autenticação real: login com credenciais (usuário e senha, ou um provedor como Google via OAuth), e a API criaria uma sessão e saberia quem é o vendedor sem depender do que o front manda. Exige cadastro de usuários ou integração com o provedor, rota de login e validação da sessão em toda requisição, e o enunciado permite simular o login;
  - guardar o vendedor só no store do Pinia, em memória: some a cada recarga da página ou quando o celular descarta a aba em segundo plano, e sem internet o vendedor não consegue nem escolher o nome de novo, porque a lista vem da API.
- **Por quê:** cumpre "o vendedor vê só a carteira dele" sem construir autenticação. O `localStorage` guarda só id, nome, supervisor e alçada do vendedor, nada sensível, sobrevive ao F5 e funciona offline.
- **Com mais tempo:** login real com cookie `httpOnly`. O JavaScript da página não consegue ler esse cookie, e o principal: a API passaria a tirar o vendedor da sessão, em vez de confiar no id que o front manda. Hoje, quem trocar o id na URL vê a carteira de outro vendedor.

## Valores monetários
- **Contexto:** o total de cada item com desconto percentual gera casas decimais quebradas, e o `number` do JavaScript erra em conta com decimais (`0.1 + 0.2` dá `0.30000000000000004`).
- **Escolha:** `numeric(12,2)` no banco e big.js nas regras de `contracts`, trabalhando direto com o valor em texto que o banco devolve. Cada item é arredondado em 2 casas (metade para cima) antes da soma.
- **Alternativas:**
  - centavos em inteiro: evita o erro de ponto flutuante, mas obriga a converter em toda entrada e saída, e o desconto percentual ainda gera frações de centavo que precisam de regra de arredondamento;
  - `number` comum: o mais simples, mas acumula erro de ponto flutuante e pode mudar o resultado de uma comparação como a do pedido mínimo.
- **Por quê:** o valor é exato do banco ao front, sem conversão, e o total do pedido bate com a soma das linhas exibidas e com o que é gravado.
- **Com mais tempo:** centralizar o manuseio de dinheiro num módulo em `contracts`, com um tipo próprio. Hoje back e front lidam direto com o big.js e repetem o arredondamento em vários pontos; com o módulo, a biblioteca ficaria só em `contracts` e poderia ser trocada sem mexer no resto.

## Validação do pedido enquanto o vendedor monta
- **Contexto:** o vendedor monta o pedido na frente do cliente, muitas vezes com internet ruim. Ele precisa saber na hora o total, quanto falta para o mínimo, se cabe no crédito, se vai para aprovação e o que impede o envio, sem descobrir só depois de enviar.
- **Escolha:** o front aplica as mesmas regras da API (alçada, embalagem, mínimo, crédito, totais) a cada mudança, sem chamar a API, lista todos os bloqueios de uma vez e só libera o envio quando não há nenhum. No envio, a API aplica as regras de novo e é ela quem decide. As regras ficam em `/contracts`, usado pelos dois lados, para não existirem duas versões.
- **Alternativas:**
  - validar só na API, no envio: o vendedor descobre o problema depois de enviar e precisa corrigir e tentar de novo, com o cliente esperando e a rede ruim;
  - perguntar à API a cada mudança: depende de rede a cada clique.
- **Por quê:** o vendedor corrige o pedido enquanto ainda está montando, e só chega ao envio um pedido que passa nas regras com os preços que ele está vendo. A API ainda pode recusar se o preço ou a disponibilidade mudou durante a montagem.
- **Com mais tempo:** estudar o versionamento da tabela de preço, para o pedido nascer preso à versão vigente quando o vendedor começou e a API considerar essa versão no envio. Hoje a API usa o preço do momento do envio: se ele mudou no meio, o pedido é gravado com o valor novo, ou bloqueado se passar a violar uma regra.

## Reserva de crédito com trava no banco
- **Contexto:** dois envios ao mesmo tempo para o mesmo cliente (dois aparelhos, ou um reenvio com sinal ruim) poderiam ler o mesmo crédito disponível e, juntos, passar do limite.
- **Escolha:** o envio roda numa transação que trava a linha do cliente (`SELECT ... FOR UPDATE`), valida o crédito, grava o pedido e soma o total ao crédito utilizado. Um segundo envio para o mesmo cliente espera o primeiro terminar e já lê o crédito atualizado.
- **Alternativas:**
  - validar sem trava: simples, mas deixa passar os dois envios simultâneos;
  - trava otimista, com versão na linha do cliente: não segura a linha, mas o envio que perde a disputa precisa tentar de novo, o que complica a API e o front.
- **Por quê:** a garantia fica com o banco e cabe em uma linha de código. A trava vale só para o mesmo cliente, então envios para clientes diferentes não esperam um pelo outro. Um teste de integração dispara 5 envios simultâneos que o crédito cobre só uma vez e confere que só um é aceito.
- **Com mais tempo:** devolver o crédito quando o pedido for recusado ou cancelado, e dar idempotência ao envio, para um reenvio com sinal ruim não virar um segundo pedido.

## Simplicidade na montagem do pedido
- **Contexto:** o principal do case é o vendedor conseguir montar e enviar um pedido válido. Priorizei esse fluxo e deixei refinamentos de experiência para depois.
- **Escolha:**
  - o vendedor vê o preço da caixa ou fardo e, abaixo, o preço por unidade, só como referência para negociar com o cliente;
  - ele vende sempre em embalagens inteiras: ao adicionar, o produto já entra com a quantidade mínima;
  - o histórico mostra os últimos pedidos do cliente com o preço de hoje, e o botão "Repetir" monta um pedido novo com esses itens, já com valores, quantidades mínimas e múltiplos atualizados.
- **Alternativas:** deixar o vendedor digitar qualquer quantidade e só avisar quando estiver errada.
- **Por quê:** menos passos e menos chance de erro: o vendedor não consegue montar um item fora da regra de embalagem.
- **Com mais tempo:**
  - mostrar na busca o preço já com a quantidade mínima, porque hoje o total "pula" ao adicionar um produto com mínimo de 2;
  - mostrar no histórico o preço que o cliente pagou na época;
  - melhorar a experiência com sinal ruim: indicador de carregamento em todas as telas, botão de tentar de novo e o pedido salvo no aparelho.
