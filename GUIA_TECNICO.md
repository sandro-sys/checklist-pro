# Guia Técnico — CheckList Pro
> Documento vivo de análise, bugs, segurança e roadmap do projeto.
> Atualizar sempre que um item for resolvido ou novo problema encontrado.

---

## Visão Geral do Projeto

**Nome:** CheckList Pro  
**Domínio:** checklist-pro.rhumarh.com  
**Stack:** Node.js + Express (backend) · React 18 + Vite (frontend) · PostgreSQL (produção) · SQLite (dev)  
**Deploy:** Render.com  
**Pagamentos:** Mercado Pago (assinaturas recorrentes)  
**Estado:** Em produção

---

## Status Atual dos Trabalhos

| # | Item | Prioridade | Status |
|---|------|-----------|--------|
| S1 | CORS aberto para qualquer origem | 🔴 Crítico | ✅ Corrigido |
| S2 | Secret hardcoded no endpoint create-master | 🔴 Crítico | ✅ Corrigido |
| S3 | Fallback JWT `'default_secret'` | 🔴 Crítico | ✅ Corrigido |
| S4 | `force-password-change-all` sem isolamento de empresa | 🔴 Crítico | ✅ Corrigido |
| S5 | `company_id` aceito do body do cliente nos checklists | 🔴 Crítico | ✅ Corrigido |
| S6 | Sem verificação de propriedade em GET/PUT/DELETE checklist | 🔴 Crítico | ✅ Corrigido |
| S7 | Execuções sem verificação de propriedade | 🔴 Crítico | ✅ Corrigido |
| B1 | Atualização de itens de checklist sem transação (risco de perda de dados) | 🔴 Crítico | ✅ Corrigido |
| B2 | Criação de itens de checklist sem transação | 🔴 Crítico | ✅ Corrigido |
| M1 | Migração: todos usuários forçados a trocar senha (exceto sandro@rhumarh.com) | 🔴 Crítico | ✅ Corrigido |
| B3 | `NOW()` no SQLite — refresh token sempre falha em dev | 🟡 Médio | ⬜ Pendente |
| B4 | Campo `role` vs `role_type` no JWT — role sempre undefined | 🟡 Médio | ⬜ Pendente |
| B5 | Login não atualiza `last_login` | 🟡 Médio | ⬜ Pendente |
| B6 | JOIN ambíguo no login pode retornar usuário errado | 🟡 Médio | ⬜ Pendente |
| B7 | Refresh token sem rotação | 🟡 Médio | ⬜ Pendente |
| UX1 | Senha temporária retornada em texto na API | 🟠 Baixo | ⬜ Pendente |
| UX2 | Sem paginação em listagens | 🟠 Baixo | ⬜ Pendente |
| F1 | Módulo de Controle de Estoque | 🟢 Feature | ⬜ Pendente |

---

## Detalhamento dos Problemas

### 🔴 S1 — CORS aberto para qualquer origem
**Arquivo:** `server/index.js:56`
```js
return callback(null, true); // Temporariamente permitir todos
```
**Problema:** Apesar de ter uma lista de origens permitidas, o fallback final aceita qualquer origem. O CORS não protege nada.  
**Correção:** Remover o `return callback(null, true)` final, retornar erro para origens não autorizadas.

---

### 🔴 S2 — Secrets hardcoded nos endpoints de admin
**Arquivo:** `server/index.js:83` e `server/index.js:191`
```js
if (secret !== process.env.ADMIN_SECRET && secret !== 'create-master-2024') { ... }
if (secret !== process.env.ADMIN_SECRET && secret !== 'migrate-passwords-2024') { ... }
```
**Problema:** Se `ADMIN_SECRET` não estiver definido, qualquer pessoa com o secret `'create-master-2024'` pode promover qualquer usuário a master admin. Esses secrets estão expostos no código fonte.  
**Correção:** Remover os fallbacks hardcoded. Exigir `ADMIN_SECRET` definido via variável de ambiente. Considerar remover esses endpoints após uso único.

---

### 🔴 S3 — Fallback de segredo JWT
**Arquivo:** `server/middleware/auth.js:12`, `server/routes/auth.js:88,94,462`
```js
jwt.verify(token, process.env.JWT_SECRET || 'default_secret', ...)
jwt.sign({ ... }, process.env.JWT_SECRET || 'default_secret', ...)
```
**Problema:** Se `JWT_SECRET` não carregar (erro de env no Render), todos os tokens assinados com `'default_secret'` ficam válidos. Alguém com o código pode forjar tokens.  
**Correção:** Se a variável não existir, derrubar o servidor (`process.exit(1)`) em vez de usar fallback.

---

### 🔴 S4 — `force-password-change-all` sem isolamento de empresa
**Arquivo:** `server/routes/auth.js:263`
```js
await dbRunAsync(`UPDATE users SET must_change_password = 1`);
```
**Problema:** Qualquer `owner` de qualquer empresa marca TODOS os usuários de TODA a plataforma para trocar senha.  
**Correção:** Adicionar `WHERE company_id = ?` com `req.user.company_id`, ou restringir ao `is_master`.

---

### 🔴 S5 — `company_id` aceito do body do cliente
**Arquivo:** `server/routes/checklists.js:157`
```js
const { ..., company_id, ... } = req.body;
```
**Problema:** Um usuário mal-intencionado pode criar checklists em outras empresas passando um `company_id` diferente no body.  
**Correção:** Ignorar `company_id` do body. Usar sempre `req.user.company_id`.

---

### 🔴 S6 — Sem verificação de propriedade em checklists
**Arquivo:** `server/routes/checklists.js:288, 355, 421`  
**Problema:** `GET /:id`, `PUT /:id` e `DELETE /:id` não verificam se o checklist pertence à empresa do usuário logado. UUID não é segurança.  
**Correção:** Após buscar o checklist, verificar: `if (checklist.company_id !== req.user.company_id && !req.user.is_master)` → 403.

---

### 🔴 S7 — Execuções sem verificação de propriedade
**Arquivo:** `server/routes/executions.js:68`  
**Problema:** `POST /:executionId/responses` não valida se a execução pertence ao usuário logado. Qualquer usuário autenticado pode modificar respostas de qualquer execução.  
**Correção:** Verificar `execution.executed_by === req.user.id || req.user.is_master`.

---

### 🔴 B1 — Atualização de itens sem transação (risco real de perda de dados)
**Arquivo:** `server/routes/checklists.js:384-404`
```js
await dbRunAsync('DELETE FROM checklist_items WHERE checklist_id = ?', [id]);
// ← Se o servidor cair aqui, checklist fica sem itens
for (let index = 0; index < items.length; index++) {
  await dbRunAsync('INSERT INTO checklist_items ...');
}
```
**Problema:** DELETE executado antes de todos os INSERTs. Se qualquer falha ocorrer no meio, o checklist perde todos os itens permanentemente.  
**Correção:** Envolver em transação (`BEGIN TRANSACTION` / `COMMIT` / `ROLLBACK`). Compatível com PostgreSQL e SQLite.

---

### 🔴 B2 — Criação de itens sem transação
**Arquivo:** `server/routes/checklists.js:206-223`  
**Problema:** Criação do checklist e inserção dos itens não estão em transação. Falha parcial deixa checklist sem itens.  
**Correção:** Mesma abordagem — transação englobando INSERT do checklist + INSERTs dos itens.

---

### 🟡 B3 — `NOW()` no SQLite
**Arquivo:** `server/routes/auth.js:455`
```js
WHERE token = ? AND expires_at > NOW()
```
**Problema:** `NOW()` é função PostgreSQL. No SQLite usa-se `datetime('now')`. Em dev, o refresh token sempre retorna null.  
**Correção:** Usar a flag `isProduction` já existente para branch a query, ou usar comparação via string ISO no lado JS.

---

### 🟡 B4 — Campo `role` vs `role_type` no JWT
**Arquivo:** `server/routes/auth.js:150`
```js
{ id: user.id, role: user.role, ... }  // user.role é undefined — coluna é role_type
```
**Problema:** O token JWT tem `role: undefined`. O middleware `requireRole` nunca funciona.  
**Correção:** Mudar para `role: user.role_type`.

---

### 🟡 B5 — `last_login` nunca atualizado
**Arquivo:** `server/routes/auth.js:120` (rota de login)  
**Problema:** A coluna `last_login` existe na tabela mas nunca é gravada. O dado exibido na tela de time está sempre vazio ou desatualizado.  
**Correção:** Adicionar `UPDATE users SET last_login = ? WHERE id = ?` no fluxo de login.

---

### 🟡 B6 — JOIN ambíguo no login
**Arquivo:** `server/routes/auth.js:128`
```sql
LEFT JOIN companies c ON u.company_id = c.id OR c.owner_id = u.id
```
**Problema:** Se o usuário tiver `company_id` preenchido E for `owner_id` em outra empresa, o resultado pode ser duplicado ou incorreto.  
**Correção:** Separar em dois SELECTs ou usar subquery com prioridade explícita.

---

### 🟡 B7 — Refresh token sem rotação
**Arquivo:** `server/routes/auth.js:446`  
**Problema:** O mesmo refresh token pode ser reutilizado indefinidamente até expirar. Se vazado, é válido por 7 dias.  
**Correção:** A cada renovação, deletar o token antigo e emitir um novo (token rotation).

---

### 🟠 UX1 — Senha temporária em texto na resposta da API
**Arquivo:** `server/routes/users.js:111`
```js
temporary_password: password ? null : userPassword
```
**Problema:** A senha gerada automaticamente trafega em texto no JSON de resposta.  
**Correção:** Enviar por email. Não retornar na API.

---

### 🟠 UX2 — Sem paginação
**Arquivos:** `server/routes/users.js:11`, `server/routes/checklists.js:247`  
**Problema:** Com crescimento de dados, essas rotas carregam tudo de uma vez. Risco de timeout e lentidão.  
**Correção:** Adicionar `LIMIT` e `OFFSET` com parâmetros `page` e `limit` na query string.

---

## Feature: Módulo de Controle de Estoque

### Tabelas (a adicionar via migração)

```sql
-- Produtos/ingredientes cadastrados
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  name TEXT NOT NULL,              -- sempre CAIXA ALTA (normalizado no backend)
  unit TEXT NOT NULL,              -- UN, KG, L, CX, G, ML, SC
  current_stock DECIMAL(10,3) DEFAULT 0,
  min_stock DECIMAL(10,3) DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Listas de contagem/compras/inventário
CREATE TABLE IF NOT EXISTS stock_lists (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  name TEXT NOT NULL,              -- ex: "CONTAGEM 17/06/2026"
  type TEXT NOT NULL,              -- contagem | compras | inventario
  status TEXT DEFAULT 'editing',   -- editing | finalizada
  notes TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  finalized_at TIMESTAMP,
  finalized_by TEXT
);

-- Itens de cada lista (editáveis enquanto status = 'editing')
CREATE TABLE IF NOT EXISTS stock_list_items (
  id TEXT PRIMARY KEY,
  list_id TEXT NOT NULL,
  product_id TEXT,                 -- nullable: produto pode não existir no cadastro ainda
  name TEXT NOT NULL,              -- sempre CAIXA ALTA
  unit TEXT,
  quantity DECIMAL(10,3),
  notes TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Histórico imutável de movimentos (append-only)
CREATE TABLE IF NOT EXISTS stock_movements (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  company_id TEXT NOT NULL,
  type TEXT NOT NULL,              -- entrada | saida | ajuste | contagem
  quantity DECIMAL(10,3) NOT NULL,
  previous_stock DECIMAL(10,3),
  new_stock DECIMAL(10,3),
  reason TEXT,
  list_id TEXT,                    -- referência à lista que gerou o movimento
  user_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Rotas da API (a criar em `server/routes/stock.js`)

```
GET    /api/stock/products              → listar produtos da empresa
POST   /api/stock/products              → criar produto
PUT    /api/stock/products/:id          → editar produto
DELETE /api/stock/products/:id          → desativar produto (soft delete)

GET    /api/stock/lists                 → listar listas da empresa
POST   /api/stock/lists                 → criar nova lista
GET    /api/stock/lists/:id             → detalhe da lista com itens
PUT    /api/stock/lists/:id             → editar cabeçalho da lista
POST   /api/stock/lists/:id/items       → adicionar item à lista
PUT    /api/stock/lists/:id/items/:itemId  → editar item
DELETE /api/stock/lists/:id/items/:itemId → remover item
POST   /api/stock/lists/:id/finalize    → finalizar lista → gera movimentos
GET    /api/stock/lists/:id/export-txt  → exportar lista em TXT

GET    /api/stock/movements             → histórico de movimentos
POST   /api/stock/movements             → lançar entrada ou saída manual
```

### Páginas do Frontend (a criar)

| Rota | Página | Descrição |
|------|--------|-----------|
| `/estoque/produtos` | `StockProducts.jsx` | Cadastro de produtos — nome CAIXA ALTA, unidade, saldo atual/mínimo |
| `/estoque/listas` | `StockLists.jsx` | Listar listas — criar, editar, finalizar, exportar |
| `/estoque/listas/:id` | `StockListEdit.jsx` | Edição da lista — adicionar/remover/editar itens, inserir produto novo |
| `/estoque/historico` | `StockHistory.jsx` | Histórico de movimentos com filtros |

### Regras de negócio

- Nome de produto **sempre normalizado para CAIXA ALTA** no backend antes de salvar
- Lista em status `editing` → totalmente editável
- Lista `finalizada` → imutável, gera movimentos no histórico e atualiza `current_stock`
- Produto novo pode ser inserido diretamente na lista (sem cadastro prévio)
- `stock_movements` é append-only — nunca se edita
- Alerta visual quando `current_stock < min_stock`
- Ao finalizar lista do tipo `contagem`: lança movimentos de `ajuste` (diferença entre estoque atual e contado)
- Ao finalizar lista do tipo `compras`: lança movimentos de `entrada`

### Formato do TXT exportado

```
================================================
EMPRESA: [NOME DA EMPRESA]
TIPO: [CONTAGEM DE ESTOQUE / LISTA DE COMPRAS]
DATA: [DD/MM/AAAA HH:MM]
RESPONSAVEL: [NOME DO USUARIO]
================================================

PRODUTO                  QTD    UNID   OBS
------------------------------------------------
ARROZ AGULHINHA          12,5   KG
FEIJAO CARIOCA            8,0   KG     VERIFICAR VALIDADE
OLEO DE SOJA              3     CX
FARINHA DE TRIGO          0,5   KG     ABAIXO DO MINIMO
------------------------------------------------
TOTAL DE ITENS: 4

ALERTAS:
[ ] FARINHA DE TRIGO → estoque: 0,5 KG | minimo: 2,0 KG
================================================
Gerado por CheckList Pro
```

---

## Ordem de Execução dos Trabalhos

### Fase 1 — Correções Críticas de Segurança e Dados (fazer primeiro)
1. [S3] Remover fallback JWT hardcoded
2. [S2] Remover secrets hardcoded nos endpoints admin
3. [S1] Fechar CORS para origens não autorizadas
4. [B1] Adicionar transação na atualização de itens do checklist
5. [B2] Adicionar transação na criação de checklist
6. [S5] Usar `req.user.company_id` em vez de `body.company_id`
7. [S6] Verificar propriedade do checklist em GET/PUT/DELETE
8. [S7] Verificar propriedade da execução ao salvar respostas
9. [S4] Isolar `force-password-change-all` por empresa

### Fase 2 — Bugs Médios
10. [B4] Corrigir `role` vs `role_type` no JWT
11. [B5] Atualizar `last_login` no login
12. [B3] Corrigir `NOW()` para SQLite no refresh token
13. [B6] Corrigir JOIN ambíguo no login
14. [B7] Implementar rotação de refresh token

### Fase 3 — Feature Estoque
15. [F1] Migração de banco — criar 4 tabelas
16. [F1] Rotas da API (`server/routes/stock.js`)
17. [F1] Páginas do frontend (4 páginas)
18. [F1] Exportação TXT

### Fase 4 — Qualidade
19. [UX1] Não retornar senha temporária na API
20. [UX2] Paginação nas listagens

---

## Referências Rápidas

| O que | Onde |
|-------|------|
| Middleware de auth | `server/middleware/auth.js` |
| Init do banco (schema) | `server/database/init.js` |
| Rotas de autenticação | `server/routes/auth.js` |
| Rotas de checklists | `server/routes/checklists.js` |
| Rotas de execuções | `server/routes/executions.js` |
| Rotas de usuários | `server/routes/users.js` |
| Entry point do servidor | `server/index.js` |
| State do auth (frontend) | `client/src/store/authStore.js` |
| API client (frontend) | `client/src/services/api.js` |
| Deploy config | `render.yaml` |
