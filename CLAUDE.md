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

| Workspace         | Propósito                      |
| ----------------- | ------------------------------ |
| `apps/api`        | Fastify REST API               |
| `apps/mobile`     | React Native + Expo            |
| `packages/shared` | Schemas Zod e tipos exportados |

---

## Decisões arquiteturais importantes

| ID    | Decisão                                                                                       |
| ----- | --------------------------------------------------------------------------------------------- |
| DA-01 | Expo (managed workflow) — gerencia builds nativos e permissões                                |
| DA-02 | TACO v7 como seed estático — dados nutricionais brasileiros, sem API externa                  |
| DA-03 | Macros calculados apenas no backend — consistência garantida                                  |
| DA-04 | Macros desnormalizados no `FoodLog` — histórico preservado mesmo se dados do alimento mudarem |
| DA-05 | Camadas: Routes → Services → Repositories — Services sem acesso direto ao banco               |

---

## Padrões de código

- TypeScript obrigatório. Sem `any` explícito; use `unknown` quando o tipo for incerto.
- Validação de entrada com Zod nas rotas; schemas definidos em `packages/shared`.
- Tokens armazenados em `SecureStore` (Expo) no mobile; acesso (15min) + refresh (30d).
- Extensão PostgreSQL `unaccent` ativada — usada em buscas de alimentos.

### Nomenclatura

| Contexto                | Convenção              | Exemplo                     |
| ----------------------- | ---------------------- | --------------------------- |
| Variáveis e funções     | `camelCase`            | `getUserData`               |
| Componentes React/RN    | `PascalCase`           | `DailyLogScreen`            |
| Arquivos de componentes | `PascalCase.tsx`       | `FoodDetailScreen.tsx`      |
| Hooks customizados      | `use` + `PascalCase`   | `useDailyLog`               |
| Constantes globais      | `UPPER_SNAKE_CASE`     | `MAX_RETRY_COUNT`           |
| Tipos e interfaces      | `PascalCase`           | `AuthStore`                 |
| Branches Git            | `tipo/descricao-curta` | `feat/food-search-debounce` |

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

| Ambiente      | Trigger                 | Banco            |
| ------------- | ----------------------- | ---------------- |
| `development` | manual (Docker Compose) | localhost:5432   |
| `staging`     | push em `develop`       | Railway Postgres |
| `production`  | push em `main`          | Railway Postgres |

Railway roda `prisma migrate deploy` automaticamente antes de subir o servidor.

---

## Fluxo de trabalho — Issue a Issue

---

### Fase 1 — Planejamento + Aprovação (1 mensagem)

1. Leia a issue no Linear e mova para "In Progress".
2. Produza **em uma única mensagem**:
   - Arquivos afetados
   - Abordagem de implementação (3-5 linhas)
   - Riscos identificados
3. Aguarde aprovação. ⚠️ Não avance sem confirmação.

---

### Fase 2 — Implementação

4. Implemente interfaces + lógica de negócio diretamente.
   - Não separe em duas etapas — interfaces sem lógica geram contexto inútil.

5. Escreva os testes **no mesmo passo** da implementação:
   - Unitários e de integração por comportamento descrito no plano
   - Casos de sucesso, erro e edge cases
   - Sem E2E

6. Rode os quality gates **silenciosamente** — reporte apenas falhas:

```bash
npm run lint && npm run typecheck && npm test
```

- Se após 3 tentativas ainda falhar: pare e peça ajuda humana.

7. Auto-revisão inline: antes de fechar, releia o diff e corrija
   problemas óbvios (complexidade, nomes, duplicação).
   - Reserve o sub-agente `code-reviewer` apenas para issues
     de alto risco (ex: auth, dados financeiros, APIs públicas).

---

### Fase 3 — Fechamento (1 mensagem)

8. Produza **em uma única mensagem**:
   - Checklist dos critérios de aceite (✅ / ❌)
   - Decisões técnicas relevantes (só o não-óbvio)
   - Passos manuais, se houver

9. Aguarde aprovação para commitar. ⚠️

10. Execute em sequência (sem reportar cada passo):
    - Atualiza `relatorio_issues.md`
    - Faz o commit no padrão estabelecido
    - Move issue para "Done" no Linear

---

## Proibições explícitas

- **Nunca use `any` explícito** — use `unknown` e faça narrowing.
- **Nunca coloque lógica de negócio no mobile** — cálculos de TMB, macros e metas ficam exclusivamente na API.
- **Nunca acesse o banco diretamente nos Services** — use sempre a camada de Repositories.
- **Nunca altere o schema do Prisma sem criar uma migration** — rode `db:migrate` após qualquer mudança em `schema.prisma`.
- **Nunca commite arquivos `.env`** — use `.env.example` para documentar novas variáveis.
- **Nunca pule o sub-agente de testes nem o code reviewer**, mesmo em mudanças pequenas.
- **Nunca commite com quality gates falhando.**
