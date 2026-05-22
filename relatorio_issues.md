# Resumo de Issues Criadas no Linear — App Nutricional v1.0

**Total:** 6 epics + 44 issues = 50 itens criados no Linear  
**Status geral:** Backlog | Linkados ao projeto/milestone correspondente

---

## M1 — Infraestrutura & Setup `[EXECUTADO — 2026-05-20]`

- **Epic:** NUT-106 — EPIC: Infraestrutura & Setup
- **Issues:**
  - NUT-107 — Configurar monorepo com apps/mobile, apps/api e packages/shared
  - NUT-108 — Configurar PostgreSQL + Prisma com schema inicial e migrations
  - NUT-109 — Implementar seed da base TACO v7 com alimentos e medidas caseiras
  - NUT-110 — Configurar pipeline de CI com lint, typecheck e build
  - NUT-111 — Configurar ambientes staging e production no Railway

### Relatório de Execução — M1

#### NUT-107 — Monorepo `[Done]`

**Arquivos criados:**

| Arquivo                         | Descrição                                                                            |
| ------------------------------- | ------------------------------------------------------------------------------------ |
| `package.json`                  | Raiz: npm workspaces + scripts dev, build, lint, typecheck, db:up, db:seed           |
| `apps/api/package.json`         | Node 20 + Fastify 4 + Prisma 5 + Zod                                                 |
| `apps/api/tsconfig.json`        | Target ES2022, paths para @nutri-ia/shared                                           |
| `apps/api/.eslintrc.json`       | @typescript-eslint/recommended                                                       |
| `apps/api/src/server.ts`        | Bootstrap Fastify + rota GET /health                                                 |
| `apps/api/src/lib/prisma.ts`    | Singleton PrismaClient                                                               |
| `apps/mobile/package.json`      | Expo SDK 51 + React Native + TanStack Query                                          |
| `apps/mobile/tsconfig.json`     | Extends expo/tsconfig.base                                                           |
| `apps/mobile/app.json`          | Config Expo (iOS bundleId + Android package)                                         |
| `apps/mobile/.eslintrc.json`    | @typescript-eslint/recommended                                                       |
| `apps/mobile/App.tsx`           | Entry point mínimo para typecheck                                                    |
| `packages/shared/package.json`  | Zod como única dependência                                                           |
| `packages/shared/tsconfig.json` | Compila para dist/ com declarations                                                  |
| `packages/shared/src/index.ts`  | Schemas Zod: auth, onboarding, food, log + tipos inferidos (LoginDto, CreateLogDto…) |

#### NUT-108 — PostgreSQL + Prisma `[Done]`

**Arquivos criados:**

| Arquivo                         | Descrição                                                                                                                                                                                                                                    |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docker-compose.yml`            | PostgreSQL 15-alpine local (porta 5432)                                                                                                                                                                                                      |
| `.env.example`                  | DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET                                                                                                                                                                                                 |
| `apps/api/prisma/schema.prisma` | Schema completo: Models User, UserProfile, NutritionalGoal, Food, FoodMeasure, FoodLog. Extensão unaccent (DR-11). Índices: foods(name), food_logs(user_id, log_date). Enums: Sex (male\|female), MealType (breakfast\|lunch\|dinner\|snack) |
| `apps/api/src/lib/prisma.ts`    | Singleton PrismaClient com log em dev                                                                                                                                                                                                        |

> **Passos manuais:** rodar `prisma migrate dev` com banco ativo (ver seção abaixo)

#### NUT-109 — Seed TACO v7 `[Done]`

**Arquivos criados:**

| Arquivo                                | Descrição                                                                                                                                                                                                                              |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/api/prisma/seeds/taco.seed.ts`   | Upsert idempotente via `prisma.food.upsert`. Deleta e recria medidas a cada run. Executável via `npx prisma db seed`                                                                                                                   |
| `apps/api/prisma/seeds/data/taco.json` | 20 alimentos TACO v7 com dados por 100g e medidas caseiras: Arroz, Feijão, Frango, Ovo, Batata-doce, Brócolis, Banana, Maçã, Pão francês, Leite, Mussarela, Azeite, Aveia, Iogurte, Patinho, Laranja, Cenoura, Tomate, Alface, Abacate |

> **Observação:** amostra representativa. Para produção, substituir pelo dataset completo da TACO v7 (597 alimentos — UNICAMP).

#### NUT-110 — Pipeline CI `[Done]`

**Arquivos criados:**

| Arquivo                    | Descrição                                                                                                                                                                                                                                                                                      |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.github/workflows/ci.yml` | 4 jobs: **lint** (ESLint em todos workspaces), **typecheck** (prisma generate + tsc --noEmit em packages/shared e apps/api), **build-api** (prisma generate + tsc), **integration-tests** (PostgreSQL via GH Actions services + migrations + seed). Triggers: PRs e pushes para main e develop |

#### NUT-111 — Railway `[Done]`

**Arquivos criados:**

| Arquivo                  | Descrição                                                                                                                                                                    |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `railway.toml`           | Build: `npm ci + prisma generate + tsc`. Start: `prisma migrate deploy + node dist/server.js`. Healthcheck: GET /health (timeout 120s). Restart: ON_FAILURE (max 10 retries) |
| `apps/api/src/server.ts` | `GET /health` → 200 `{ status: "ok", timestamp }`                                                                                                                            |

> **Passos manuais:** provisionar projeto Railway (ver seção abaixo)

---

### Passos Manuais — Ativar Ambiente Local

**Pré-requisitos:** Node.js >= 20 e Docker Desktop rodando

```bash
cd app-nutricional
npm install
cp .env.example .env
npm run db:up
# aguardar container ficar healthy
cd apps/api && npx prisma migrate dev --name init
npx prisma db seed
cd ../.. && npm run dev
curl http://localhost:3000/health
# Esperado: { "status": "ok", "timestamp": "..." }
```

### Passos Manuais — Railway (NUT-111)

1. Criar projeto no [railway.app](https://railway.app)
2. Adicionar environments: `staging` e `production`
3. Adicionar serviço PostgreSQL em cada environment
4. Configurar variáveis em cada environment:
   - `DATABASE_URL` — gerado pelo PostgreSQL do Railway
   - `JWT_SECRET` — string aleatória >= 32 chars
   - `JWT_REFRESH_SECRET` — string aleatória >= 32 chars
5. Conectar repositório GitHub:
   - `staging` → branch `develop`
   - `production` → branch `main`
6. `railway.toml` já configura build, migrations e healthcheck automaticamente

---

## M2 — Autenticação & Onboarding

- **Epic:** NUT-112 — EPIC: Autenticação & Onboarding
- **Issues:**
  - NUT-113 — [backend] Implementar POST /auth/register com validação Zod
  - NUT-114 — [backend] Implementar POST /auth/login com bcrypt e JWT
  - NUT-115 — [backend] Implementar POST /auth/google (OAuth2 via Passport.js)
  - NUT-116 — [backend] Implementar POST /auth/apple (OAuth2 via Passport.js)
  - NUT-117 — [backend] Implementar POST /auth/refresh com rotação de token
  - NUT-118 — [backend] Implementar POST /auth/forgot-password com Nodemailer
  - NUT-119 — [frontend] Implementar LoginScreen com OAuth Google e Apple
  - NUT-120 — [frontend] Implementar RegisterScreen com validação em tempo real
  - NUT-121 — [frontend] Implementar ForgotPasswordScreen
  - NUT-122 — [frontend] Implementar OnboardingScreen (fluxo em steps com TMB preview)
  - NUT-123 — [frontend] Configurar AuthStore com Zustand e persistência em SecureStore
  - NUT-124 — [frontend] Configurar interceptor Axios para refresh automático de token
  - NUT-125 — [test-e2e] Auth — fluxos de cadastro, login, sessão expirada e OAuth

---

## M3 — Log Alimentar

- **Epic:** NUT-126 — EPIC: Log Alimentar
- **Issues:**
  - NUT-127 — [backend] Implementar GET /foods/search com unaccent e debounce `[Done]`
  - NUT-128 — [backend] Implementar GET /foods/:id `[Done]`
  - NUT-129 — [backend] Implementar GET /logs?date= com totais por refeição
  - NUT-130 — [backend] Implementar POST /logs com cálculo de macros (DR-06, DR-07)
  - NUT-131 — [backend] Implementar PUT /logs/:id com recálculo de macros
  - NUT-132 — [backend] Implementar DELETE /logs/:id
  - NUT-133 — [frontend] Implementar DailyLogScreen com navegação de datas
  - NUT-134 — [frontend] Implementar FoodSearchScreen com debounce 300ms
  - NUT-135 — [frontend] Implementar FoodDetailScreen com gramas e medidas caseiras
  - NUT-136 — [integration] Fluxo completo: busca -> seleção -> quantidade -> log
  - NUT-137 — [test-e2e] Log Alimentar — cenários adicionar, editar, excluir e medida caseira

### Relatório de Execução — M3 (parcial)

#### NUT-127 — [backend] Implementar GET /foods/search com unaccent e debounce `[Done - 2026-05-22]`

**Arquivos criados:**

| Arquivo                                             | Descrição                                                                                                                                                                        |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/shared/src/index.ts`                      | Adicionados `foodSearchQuerySchema` (q min 2, limit coerced 1–30 default 10), `foodSearchResponseSchema` e tipos `FoodSearchQueryDto`, `FoodSearchResponseDto`                   |
| `apps/api/package.json`                             | Adicionada dependência `@nutri-ia/shared: "*"` e `start` script corrigido para `node dist/apps/api/src/server.js` (ajuste do rootDir do monorepo)                                |
| `apps/api/tsconfig.json`                            | `rootDir` alterado de `./src` para `../../` para permitir resolução de `@nutri-ia/shared` fora de `src/` no build `tsc`                                                          |
| `apps/api/src/repositories/food.repository.ts`      | `FoodRepository.search()` com `$queryRaw` usando DR-11 (`unaccent(lower())` em WHERE e ORDER BY); `findMany` com `include: { measures: true }` para hidratar relações tipadas    |
| `apps/api/src/repositories/food.repository.test.ts` | 6 testes de integração: case-insensitive, unaccent, resultado vazio, measures[], limit e ordenação (match exato antes do parcial)                                                |
| `apps/api/src/services/food.service.ts`             | `FoodService.search()` thin orchestrator com constructor DI de `FoodRepository`                                                                                                  |
| `apps/api/src/services/food.service.test.ts`        | 3 testes unitários: delegação com params corretos, lista vazia, propagação de erro                                                                                               |
| `apps/api/src/routes/foods.routes.ts`               | Plugin Fastify `GET /foods/search` com `safeParse` do schema Zod; retorna 400 em validação falha, 200 + `{ foods[] }` em sucesso (lista vazia quando não encontrado — nunca 404) |
| `apps/api/src/routes/foods.routes.test.ts`          | 7 testes de rota via `fastify.inject()`: q ausente, q < 2 chars, limit > 30, busca válida, não encontrado, limit default 10, limit customizado                                   |
| `apps/api/src/server.ts`                            | Wiring: instancia `FoodRepository` e `FoodService`, registra `foodsPlugin` com DI                                                                                                |

> **Passos Manuais:** criar `.env` em `apps/api/` com `DATABASE_URL=postgresql://nutri_ia:nutri_ia_dev@localhost:5432/nutri_ia_dev` antes de rodar localmente (não commitado por segurança).

#### NUT-128 — [backend] Implementar GET /foods/:id `[Done - 2026-05-22]`

**Arquivos criados:**

| Arquivo                                             | Descrição                                                                                                                                                                  |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/shared/src/index.ts`                      | Adicionados `foodIdParamSchema` (`z.object({ id: z.string().uuid() })`) e tipo `FoodIdParamDto`                                                                            |
| `apps/api/src/repositories/food.repository.ts`      | Novo método `findById(id)` usando `prisma.food.findUnique({ where: { id }, include: { measures: true } })`; retorna `FoodWithMeasures \| null`                             |
| `apps/api/src/services/food.service.ts`             | Novo método `findById(id)` thin pass-through delegando ao repository                                                                                                       |
| `apps/api/src/routes/foods.routes.ts`               | Handler `GET /foods/:id`: valida UUID via `foodIdParamSchema` → 400; chama service → 404 se null; `foodSchema.parse(food)` antes de `reply.send()` (strip de campos internos como `tacoId`) |
| `apps/api/src/repositories/food.repository.test.ts` | +3 testes de integração para `findById`: encontra food com measures, retorna null para UUID inexistente, verifica campos id/description/gramsEquivalent das measures         |
| `apps/api/src/services/food.service.test.ts`        | +3 testes unitários para `findById`: delegação com id correto, propagação de null, propagação de erro                                                                       |
| `apps/api/src/routes/foods.routes.test.ts`          | +4 testes via `app.inject`: 200 food sem envelope (com guard `not.toHaveProperty('tacoId')`), 404 quando null, 400 UUID inválido, delegação com id correto                 |

---

## M4 — Relatório Nutricional

- **Epic:** NUT-138 — EPIC: Relatório Nutricional
- **Issues:**
  - NUT-139 — [backend] Implementar GET /reports/daily com balanço calórico (DR-09)
  - NUT-140 — [frontend] Implementar DailyReportScreen com barras de progresso
  - NUT-141 — [frontend] Compartilhar selectedDate entre DailyLog e DailyReport via AppStore
  - NUT-142 — [test-e2e] Relatório — cenários de déficit, superávit, on_target e histórico

---

## M5 — Perfil do Usuário

- **Epic:** NUT-143 — EPIC: Perfil do Usuário
- **Issues:**
  - NUT-144 — [backend] Implementar GET /users/me com perfil e meta atual
  - NUT-145 — [backend] Implementar PUT /users/me/profile com recálculo de TMB e metas
  - NUT-146 — [frontend] Implementar ProfileScreen com idade calculada e modo visualização
  - NUT-147 — [frontend] Implementar EditProfileScreen com preview de nova TMB
  - NUT-148 — [test-e2e] Perfil — editar peso recalcula meta e data de nascimento no modo edição

---

## M6 — Testes E2E & Release 1.0

- **Epic:** NUT-149 — EPIC: Testes E2E & Release 1.0
- **Issues:**
  - NUT-150 — Configurar Detox para testes E2E em iOS e Android
  - NUT-151 — [test-e2e] Fluxo E2E: cadastro -> onboarding -> log refeição -> ver relatório
  - NUT-152 — [test-e2e] Fluxo E2E: login -> log café + almoço + jantar -> verificar totais
  - NUT-153 — [test-e2e] Fluxo E2E: editar perfil -> confirmar recálculo de meta
  - NUT-154 — [test-e2e] Fluxo E2E: offline -> modo somente-leitura de cache
  - NUT-155 — Checklist de release: acessibilidade, contraste e toque mínimo
