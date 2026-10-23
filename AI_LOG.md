# AI Log

Usei o Claude Code durante todo o case, no terminal e no VS Code: para analisar o seed, discutir regras, gerar código, revisar e escrever a documentação.

## 1. Regra de embalagem: a IA interpretou errado
- **Pedido:** escrever as regras de quantidade e os testes a partir do enunciado ("alguns produtos só podem ser vendidos em múltiplos da embalagem").
- **Resposta da IA:** entendeu que `venda_somente_multiplo: false` liberava a venda de unidade avulsa de produto em caixa, e escreveu um teste "aceita unidade avulsa de produto em caixa" (1 óleo de uma caixa de 20).
- **O que fiz:** descartei. Mostrei o P015 (caixa de 24, `false`) vendido como 1 caixa no PH002 e expliquei que `false` não libera unidade avulsa, só reduz o mínimo para 1 embalagem. A IA refez a regra e os testes e apontou que o histórico não decidia sozinho entre as duas leituras, então a interpretação foi para o ASSUMPTIONS.
- **Por quê:** a IA seguiu a leitura literal do campo, sem pensar em como o produto é vendido. O teste passava e estava errado; só percebi lendo o caso de teste contra os dados.

## 2. Envio do pedido: service reconstruído em partes
- **Pedido:** o service de envio do pedido, que confere a carteira, busca o preço de cada item, aplica as regras, reserva o crédito e grava.
- **Resposta da IA:** uma função grande que fazia quatro trabalhos num bloco só (carregar dados, montar os itens, validar e gravar), com a validação misturada às consultas e o mesmo `throw` repetido em vários pontos. Quando reclamei, a IA propôs quebrar tudo em várias funções auxiliares.
- **O que fiz:** recusei as duas versões, mandei apagar e reconstruímos trecho a trecho, comigo questionando cada parte:
  - por que duas consultas para cliente e vendedor, se dá para fazer um `join`;
  - como impedir que dois envios ao mesmo tempo estourem o crédito (o `FOR UPDATE` trava só o cliente do pedido: dois envios para o mesmo cliente entram em fila, e envios para clientes diferentes seguem em paralelo);
  - se buscar o preço item a item não virava N+1 (virou uma consulta só para todos os itens);
  - se a API devia devolver todos os erros ou o primeiro (ficou o primeiro, e o front lista todos);
  - a validação final numa cadeia curta: `validarDescontos ?? validarPedidoMinimo ?? validarCredito`.
- **Por quê:** o código estava perdendo legibilidade, e a refatoração proposta só espalhava o problema por mais funções. Reconstruir em partes pequenas, entendendo cada decisão, deu uma função mais curta e fácil de ler do que as duas versões.

## 3. A IA registrou uma decisão que eu não tinha tomado
- **Pedido:** explicar como o sistema garante que o vendedor só vende para clientes da própria carteira.
- **Resposta da IA:** disse que o banco não barrava pedido para cliente de outra carteira "porque descartamos a FK composta", uma trava no banco que fazia exatamente isso. Essa decisão nunca tinha sido discutida: a ideia só tinha aparecido de passagem numa lista da revisão do schema.
- **O que fiz:** perguntei de onde vinha esse "descartamos", e a IA admitiu que foi exagero. Aí discutimos de verdade: a trava no banco atrapalharia quando um cliente mudasse de vendedor, porque os pedidos antigos ficariam presos ao vendedor anterior. Decidi conferir a carteira no código, no envio, e deixar o histórico intocado.
- **Por quê:** o resultado acabou sendo o mesmo, mas agora como decisão minha e com motivo. Sem a pergunta, a documentação registraria uma escolha que eu nunca tinha avaliado.

## 4. Um campo que só os testes usavam
- **Pedido:** a regra da tabela de preço do cliente, com o fallback para a TP01 quando o cliente não tem tabela (caso do C004).
- **Resposta da IA:** a função devolvia o id da tabela e uma flag `usa_tabela_padrao`, com testes passando. Mas nenhum código real lia a flag: a API só usava o id, e o front decidia o aviso por conta própria, olhando se a tabela do cliente era nula.
- **O que fiz:** questionei o campo e, ao investigar, apareceu que ele só existia nos testes. Em vez de apagar, dei uso real: virou `tabela_preco_pendente`, a API passou a devolvê-lo e o front usa esse campo para mostrar o aviso "Tabela provisória", sem repetir a regra.
- **Por quê:** teste passando não garante que o código faz sentido. Um campo que só os testes usam engana quem lê a regra, e a regra do fallback ficava espalhada entre API e front.

## Mapa de autoria

| Parte | Autoria |
|---|---|
| Modelagem (schema, migrations, seed) | A IA gerou; eu decidi campo a campo (tipos, `NOT NULL`, `CHECK`, enums) e alterei. |
| Regras de negócio | Eu defini as regras (alçada, embalagem, mínimo, crédito); a IA escreveu o código, e eu revisei, corrigi e renomeei. |
| API | A IA gerou a maior parte (Express, rotas, Swagger, busca, Docker) e eu revisei; o envio do pedido foi reconstruído junto, trecho a trecho. |
| Telas | A IA gerou a primeira versão (login, carteira, montagem e envio), e eu revisei nomes e fluxo. A montagem v2, o histórico e a organização de pastas foram dirigidos por mim, com mocks discutidos item a item. |
| Testes | A IA gerou; eu revisei os casos e os nomes e corrigi os que estavam errados. |
| Documentação (README, ASSUMPTIONS, DECISIONS, este log) | A IA redigiu a partir das minhas anotações; eu revisei e reescrevi trechos. |
