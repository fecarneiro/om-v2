# Assumptions

Ambiguidades do enunciado e do `seed.json`, e a interpretação adotada em cada uma. Nenhuma foi enviada por e-mail; todas foram decididas e documentadas aqui.

## Alçada de desconto
- **Ambiguidade:** "pode conceder até um percentual de desconto" não diz se o limite entra, nem se o desconto pode ir para vários itens do mesmo pedido.
- **Interpretação:** desconto em no máximo 1 item, com a alçada inclusiva: até a alçada fica "Enviado", acima dela fica "Aguardando aprovação". Desconto em 2 ou mais itens bloqueia o envio.
- **Base:** no histórico, V01 deu 5% (PH002) e V02 deu 7% (PH003), exatamente a alçada de cada um, e todos os pedidos têm desconto em no máximo um item.

## Percentuais inteiros
- **Ambiguidade:** o seed só tem percentuais inteiros, mas o enunciado não restringe.
- **Interpretação:** desconto e alçada são inteiros de 0 a 100.

## Embalagem e múltiplo
- **Ambiguidade:** "alguns produtos só podem ser vendidos em múltiplos da embalagem" não detalha as regras da venda em múltiplo.
- **Interpretação:** produtos em CX/FD são vendidos sempre em embalagens inteiras, sem unidade avulsa. Com `venda_somente_multiplo`, o mínimo é de 2 embalagens; sem ele, de 1 embalagem.

## Pedido mínimo sobre o valor bruto
- **Ambiguidade:** "pedidos abaixo de R$ 300,00" não diz se o desconto entra na conta.
- **Interpretação:** o mínimo vale sobre o total bruto, antes do desconto. R$ 300,00 exatos podem ser enviados.

## Crédito reservado no envio
- **Ambiguidade:** o enunciado não diz quais pedidos consomem crédito, nem o que fazer quando ele não cobre o pedido.
- **Interpretação:** crédito disponível = limite − utilizado. Pedidos "Enviado" e "Aguardando aprovação" somam ao utilizado no momento do envio. Pedido acima do crédito disponível tem o envio bloqueado.

## Preço por tabela
- **Ambiguidade:** "o mesmo produto tem preços diferentes em tabelas diferentes" não diz se o preço pode se repetir, nem o que fazer quando o produto não está na tabela.
- **Interpretação:** o preço pode ser igual em tabelas diferentes. Produto ativo sem preço na tabela do cliente aparece como indisponível só para os clientes daquela tabela, e continua ativo e à venda para os clientes das outras tabelas. Assim, uma tabela nova, criada antes de ter todos os preços, não tira produtos de venda para todo mundo.

## Status do pedido
- **Ambiguidade:** o enunciado fala em "Enviado" e "Aguardando aprovação"; o seed tem "Faturado" e "Cancelado".
- **Interpretação:** os 4 status existem. O envio gera só os dois do enunciado; os outros dois vêm do histórico. Não existe "Aprovado" nem fluxo de aprovação.

## EAN duplicado
- **Ambiguidade:** P009 e P023 têm o mesmo EAN.
- **Interpretação:** EAN não é único no banco; a busca por esse código devolve os dois produtos.

## Histórico que viola as regras de hoje
- **Ambiguidade:** PH002, PH003 e PH004 estão abaixo do mínimo (269,57, 253,74 e 102,60 reais), e PH001 e PH003 têm produtos hoje inativos (P022, P021).
- **Interpretação:** o histórico entra como está, e cada pedido novo é validado pelas regras vigentes no momento do envio; por isso as regras não viraram `CHECK` no banco.
- **Versionamento:** não há versionamento de regras. O pedido guarda quantidade, preço unitário e desconto de cada item, mas não a tabela de preço, o pedido mínimo ou a alçada que valiam quando foi feito.
- **Base:** dedução a partir do seed, que traz pedidos fora das regras atuais e não registra a regra de cada época; o mais provável é que as regras tenham mudado depois desses pedidos.

## Estoque
- **Ambiguidade:** o enunciado não fala de estoque.
- **Interpretação:** estoque infinito; o que define se o produto pode ser vendido é estar disponível (ativo e com preço na tabela).

## Repetir pedido
- **Ambiguidade:** "repetir pedido" não diz com que preço, nem o que fazer com o que mudou desde então.
- **Interpretação:** o pedido repetido usa o preço e as regras de hoje. Produtos indisponíveis ficam de fora, o desconto não é copiado (a alçada pode ter mudado) e a quantidade é arredondada para cima até fechar a embalagem atual. Pedidos de qualquer status podem ser repetidos, inclusive cancelados.

## Histórico de quem herda a carteira
- **Ambiguidade:** um cliente pode mudar de vendedor.
- **Interpretação:** o histórico pertence ao cliente; quem herda a carteira vê os pedidos anteriores, que continuam gravados com o vendedor original.

## Produto com histórico
- **Ambiguidade:** o que acontece com o histórico se um produto for apagado.
- **Interpretação:** produto com histórico não é apagado, só inativado; a chave estrangeira do banco impede a exclusão.

## Sem autenticação
- **Ambiguidade:** o enunciado permite simular o login escolhendo o vendedor.
- **Interpretação:** a API confia no `vendedor_id` recebido e confere a carteira com ele.
