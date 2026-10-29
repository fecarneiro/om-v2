# Modo offline

O vendedor monta e envia pedidos sem conexão. O app guarda uma cópia local dos dados de montagem e uma fila de envio, e despacha tudo quando a conexão volta, sem duplicar pedidos.

## Visão geral

```
┌──────────────────────────── NAVEGADOR ────────────────────────────┐
│                                                                   │
│  Service Worker ── guarda o app (HTML/JS/CSS) → abre sem rede     │
│                                                                   │
│  Telas ──► lerComFallbackOffline ── API ok? ──► dados da API      │
│                     │                                             │
│                     └─ falha de rede ──► IndexedDB (om-offline)   │
│                                            ├─ carteira:{vendedor} │
│                                            ├─ catalogo:{cliente}  │
│                                            └─ fila-envio:{vend.}  │
│                                                                   │
│  Gatilhos (abrir app, online, 15 min, voltar à aba)               │
│     1. processa a fila  ──► POST /pedidos + Idempotency-Key       │
│     2. sincroniza       ──► baixa carteira + catálogos            │
│     3. telas recarregam                                           │
└───────────────────────────────────────────────────────────────────┘
```

## Roteiro do vendedor

1. **Online, faz login.** O Service Worker guarda o app e a sincronização baixa a carteira e o catálogo de cada cliente.
2. **Perde o sinal.** O cabeçalho mostra `● Offline (dados de 11:46)` e o botão Sair fica desabilitado.
3. **Navega e busca.** Carteira, cliente e produtos vêm do IndexedDB. A busca local imita a da API (sem acento, várias palavras, prefixo de EAN).
4. **Envia.** O pedido vai para a fila e aparece em "Pedidos pendentes" na Carteira. Só pode haver um pendente por cliente.
5. **Sinal volta.** A fila despacha em ordem, a sincronização atualiza o crédito e as telas recarregam.

## Onde está cada coisa

```
web/src/offline/
├─ api/             lerComFallbackOffline: tenta a API e, em falha de rede, lê do banco local
├─ banco/           acesso ao IndexedDB (idb-keyval): carteira, catálogo e fila de envio
├─ regras/          filtrarProdutosOffline: espelho da busca SQL do backend, com testes
├─ stores/          Pinia: sincronizacao (horário, em andamento) e fila-envio (pendentes, recusados)
├─ sincronizacao/   useGatilhosSincronizacaoOffline: quando processar a fila e sincronizar
└─ components/      aviso de conexão, pedidos pendentes, tela de "pedido salvo"
```

Fora de `offline/`:
- `web/vite.config.ts`: Service Worker (`vite-plugin-pwa`, só o app shell).
- `web/src/api/client.ts`: `FalhaDeRedeError` (sem resposta) separado de `ApiError` (4xx/5xx).
- `api/`: `GET /clientes/:id/catalogo` e idempotência no `POST /pedidos`.

## Garantias

- **Sem pedido duplicado.** Cada envio leva `Idempotency-Key`. A API faz o `SELECT` pela chave depois do `FOR UPDATE` no cliente e antes das validações; o índice único `(vendedor_id, chave_idempotencia)` é a última barreira. Um reenvio devolve o pedido existente (200).
- **Crédito coerente offline.** Com um único pendente por cliente, o crédito da última sincronização é suficiente para validar.
- **Erro honesto.** Se a API recusar um pedido da fila, ele aparece como "Recusado: motivo" (em memória).

## Premissas

- Cada cliente pertence a um único vendedor.
- Preços e disponibilidade de produtos não mudam entre a sincronização e o envio.
- O primeiro acesso é online e com login (o app, a sessão e os dados precisam estar guardados).

## Deixado de lado (de propósito)

| O quê | Por quê |
|---|---|
| TanStack Query | Resolveria cache, refetch e invalidação das leituras. A coordenação foi feita à mão (`watch` no fim da sincronização) para manter o escopo; é a evolução natural |
| Crédito projetado, editar ou descartar pendentes | Desnecessários com a regra de um pendente por cliente |
| Login offline | Não existe com autenticação real; por isso o Sair fica bloqueado offline |
| Versão do formato no IndexedDB | Uma mudança de formato entre deploys exigiria migração ou descarte do cache |

## Como testar

```bash
pnpm --filter web build && pnpm --filter web preview   # http://localhost:4173
```

1. Faça login online e espere a sincronização (DevTools → Application → IndexedDB → `om-offline`).
2. DevTools → Network → Offline. Dê F5, navegue, busque e envie um pedido.
3. Volte para online: o pendente some e o crédito na Carteira é atualizado.
