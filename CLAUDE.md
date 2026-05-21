# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Projeto

**Nutri IA** — aplicativo mobile de rastreamento nutricional com cálculo preciso de calorias e macronutrientes. Stack: React Native + Expo (mobile), Fastify + Node.js + TypeScript (API), PostgreSQL + Prisma (banco), Zod para contratos compartilhados.

O código do projeto fica em `app-nutricional/`. Toda documentação de produto e engenharia está em `docs/`.

---

## Comandos

Todos os comandos abaixo devem ser rodados a partir de `app-nutricional/`.

### Monorepo (raiz)

```bash
npm run dev          # Sobe API + mobile em modo watch
npm run build        # Compila todos os workspaces
npm run lint         # Lint em todos os workspaces
npm run typecheck    # Type check em todos os workspaces
```

### Banco de dados

```bash
npm run db:up        # Sobe container PostgreSQL (Docker)
npm run db:down      # Para container
npm run db:migrate   # Roda migrações Prisma (apps/api)
npm run db:seed      # Popula dados TACO (apps/api)
```

### API (`apps/api`)

```bash
npm run dev          # Fastify com tsx watch
npm run db:generate  # Gera Prisma Client após mudança de schema
npm run db:studio    # Abre Prisma Studio (UI do banco)
```

### Mobile (`apps/mobile`)

```bash
npm run android      # Expo no simulador Android
npm run ios          # Expo no simulador iOS
```

---

## Arquitetura

```
Mobile (React Native + Expo)
  └── TanStack Query + Axios  →  REST JSON
        ↓
API (Fastify + Node.js + TypeScript)
  └── Routes → Middleware (Auth/Validation) → Services → Repositories → PostgreSQL
        └── Calculators (TMB, Macros) chamados pelos Services
              ↓
packages/shared  →  Schemas Zod compartilhados (contratos de tipo entre front e back)
```

**Regra:** toda lógica de negócio (cálculo de TMB, metas, conversão de medidas, macros) fica exclusivamente no backend. O mobile envia parâmetros e exibe resultados.

**Monorepo (npm workspaces):**

| Workspace | Propósito |
|-----------|-----------|
| `apps/api` | Fastify REST API |
| `apps/mobile` | React Native + Expo |
| `packages/shared` | Schemas Zod e tipos exportados |

---

## Decisões arquiteturais importantes

| ID | Decisão |
|----|---------|
| DA-01 | Expo (managed workflow) — gerencia builds nativos e permissões |
| DA-02 | TACO v7 como seed estático — dados nutricionais brasileiros, sem API externa |
| DA-03 | Macros calculados apenas no backend — consistência garantida |
| DA-04 | Macros desnormalizados no `FoodLog` — histórico preservado mesmo se dados do alimento mudarem |
| DA-05 | Camadas: Routes → Services → Repositories — Services sem acesso direto ao banco |

---

## Padrões de código

- TypeScript obrigatório. Sem `any` explícito; use `unknown` quando o tipo for incerto.
- Validação de entrada com Zod nas rotas; schemas definidos em `packages/shared`.
- Tokens armazenados em `SecureStore` (Expo) no mobile; acesso (15min) + refresh (30d).
- Extensão PostgreSQL `unaccent` ativada — usada em buscas de alimentos.

### Nomenclatura

| Contexto | Convenção | Exemplo |
|----------|-----------|---------|
| Variáveis e funções | `camelCase` | `getUserData` |
| Componentes React/RN | `PascalCase` | `DailyLogScreen` |
| Arquivos de componentes | `PascalCase.tsx` | `FoodDetailScreen.tsx` |
| Hooks customizados | `use` + `PascalCase` | `useDailyLog` |
| Constantes globais | `UPPER_SNAKE_CASE` | `MAX_RETRY_COUNT` |
| Tipos e interfaces | `PascalCase` | `AuthStore` |
| Branches Git | `tipo/descricao-curta` | `feat/food-search-debounce` |

---

## Variáveis de ambiente

Copie `.env.example` para `.env` em `app-nutricional/`. Variáveis obrigatórias:

```
DATABASE_URL
JWT_ACCESS_SECRET      # mínimo 32 chars
JWT_REFRESH_SECRET     # mínimo 32 chars
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=30d
BCRYPT_ROUNDS=12
APP_URL
```

---

## Deploy

| Ambiente | Trigger | Banco |
|----------|---------|-------|
| `development` | manual (Docker Compose) | localhost:5432 |
| `staging` | push em `develop` | Railway Postgres |
| `production` | push em `main` | Railway Postgres |

Railway roda `prisma migrate deploy` automaticamente antes de subir o servidor.

---

## Fluxo de trabalho — Issue a Issue

Siga **sempre** este fluxo ao trabalhar em qualquer issue. Não pule etapas nem agrupe fases sem aprovação explícita.

---

### Fase 1 — Planejamento

1. Leia a issue no Linear, entenda o contexto e critérios de aceite, e **mova a issue para "In Progress"** via MCP do Linear.
2. Identifique os arquivos afetados, riscos e a abordagem de implementação.
3. **Apresente o plano detalhado e aguarde aprovação antes de codar.**

> ⚠️ Não avance para a Fase 2 sem confirmação explícita do usuário.

---

### Fase 2 — Implementação

4. Implemente apenas as **interfaces e assinaturas** dos módulos afetados, sem lógica de negócio.

5. Acione o **sub-agente de testes** (`.claude/agents/test-writer.md`) passando o plano aprovado + as interfaces criadas como contexto. O sub-agente deve:
   - Escrever testes **unitários e de integração** para cada comportamento descrito no plano
   - Garantir que os testes **falhem** neste momento (red phase do TDD)
   - Cobrir casos de sucesso, erro e edge cases relevantes
   - **Não escrever testes E2E** — esses são issues separadas com escopo próprio (Detox)

6. Implemente a lógica de negócio até todos os testes passarem (green phase).

7. Rode os **quality gates** na ordem abaixo e corrija qualquer falha antes de continuar. **Se após 5 tentativas algum gate continuar falhando, pare e peça auxílio humano** — não tente corrigir indefinidamente.

```bash
npm run lint         # Lint em todos os workspaces
npm run typecheck    # Type check em todos os workspaces
npm test             # Testes unitários
```

8. Acione o **sub-agente code reviewer** (`.claude/agents/code-reviewer.md`) para revisar o diff completo das alterações. Corrija todos os pontos levantados antes de prosseguir. **Se após 5 ciclos de correção ainda houver bloqueantes, pare e peça auxílio humano** com um resumo do impasse.

---

### Fase 3 — Fechamento

9. Se a issue envolver passos que não podem ser automatizados (ex: provisionar serviço externo, rodar migration com banco ativo), documente-os em uma seção **"Passos Manuais"** no resumo.
10. Produza um **resumo do que foi feito**: o que mudou, por quê, e qualquer decisão técnica relevante.
11. Atualize a documentação afetada: `docs/`, comentários de código, ADRs se aplicável.
12. **Verifique os critérios de aceite** da issue no Linear um a um. Confirme explicitamente quais foram atendidos. Se algum não foi coberto, volte para a Fase 2 antes de prosseguir.
13. **Apresente o resumo e aguarde aprovação para commitar.**

> ⚠️ Não commite sem confirmação explícita do usuário.

14. Faça o commit seguindo o padrão:

```
<tipo>(<escopo>): <descrição no imperativo>

- detalhe relevante 1
- detalhe relevante 2

Refs: NUT-<número>
```

Tipos: `feat`, `fix`, `refactor`, `chore`, `test`, `docs`, `perf`, `style`.

O número da issue é o ID do Linear no formato `NUT-XXX`. Exemplos de escopo: `api`, `mobile`, `shared`, `infra`, `auth`, `log`, `report`, `profile`.

15. **Mova a issue para "Done"** no Linear via MCP.

---

## Proibições explícitas

- **Nunca use `any` explícito** — use `unknown` e faça narrowing.
- **Nunca coloque lógica de negócio no mobile** — cálculos de TMB, macros e metas ficam exclusivamente na API.
- **Nunca acesse o banco diretamente nos Services** — use sempre a camada de Repositories.
- **Nunca altere o schema do Prisma sem criar uma migration** — rode `db:migrate` após qualquer mudança em `schema.prisma`.
- **Nunca commite arquivos `.env`** — use `.env.example` para documentar novas variáveis.
- **Nunca pule o sub-agente de testes nem o code reviewer**, mesmo em mudanças pequenas.
- **Nunca commite com quality gates falhando.**
