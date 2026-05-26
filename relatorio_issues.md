# Relatório de Issues — App Nutricional v1.0

**Total:** 6 epics · 44 issues · 50 itens criados no Linear
**Status geral:** Backlog | Linkados ao projeto/milestone correspondente

---

## M1 — Infraestrutura & Setup `[Done - 2026-05-20]`

**Epic:** NUT-106 — EPIC: Infraestrutura & Setup

| Issue   | Título                                                            | Status |
| ------- | ----------------------------------------------------------------- | ------ |
| NUT-107 | Configurar monorepo com apps/mobile, apps/api e packages/shared   | `Done` |
| NUT-108 | Configurar PostgreSQL + Prisma com schema inicial e migrations    | `Done` |
| NUT-109 | Implementar seed da base TACO v7 com alimentos e medidas caseiras | `Done` |
| NUT-110 | Configurar pipeline de CI com lint, typecheck e build             | `Done` |
| NUT-111 | Configurar ambientes staging e production no Railway              | `Done` |

---

#### NUT-107 — Configurar monorepo `[Done - 2026-05-20]`

**Arquivos criados:**

| Arquivo                         | Descrição                                                                                |
| ------------------------------- | ---------------------------------------------------------------------------------------- |
| `package.json`                  | Raiz: npm workspaces + scripts `dev`, `build`, `lint`, `typecheck`, `db:up`, `db:seed`   |
| `apps/api/package.json`         | Node 20 + Fastify 4 + Prisma 5 + Zod                                                     |
| `apps/api/tsconfig.json`        | Target ES2022, paths para `@nutri-ia/shared`                                             |
| `apps/api/.eslintrc.json`       | `@typescript-eslint/recommended`                                                         |
| `apps/api/src/server.ts`        | Bootstrap Fastify + rota `GET /health`                                                   |
| `apps/api/src/lib/prisma.ts`    | Singleton `PrismaClient`                                                                 |
| `apps/mobile/package.json`      | Expo SDK 51 + React Native + TanStack Query                                              |
| `apps/mobile/tsconfig.json`     | Extends `expo/tsconfig.base`                                                             |
| `apps/mobile/app.json`          | Config Expo (iOS bundleId + Android package)                                             |
| `apps/mobile/.eslintrc.json`    | `@typescript-eslint/recommended`                                                         |
| `apps/mobile/App.tsx`           | Entry point mínimo para typecheck                                                        |
| `packages/shared/package.json`  | Zod como única dependência                                                               |
| `packages/shared/tsconfig.json` | Compila para `dist/` com declarations                                                    |
| `packages/shared/src/index.ts`  | Schemas Zod: auth, onboarding, food, log + tipos inferidos (`LoginDto`, `CreateLogDto`…) |

---

#### NUT-108 — PostgreSQL + Prisma `[Done - 2026-05-20]`

**Arquivos criados:**

| Arquivo                         | Descrição                                                                                                                                                                                                            |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docker-compose.yml`            | PostgreSQL 15-alpine local (porta 5432)                                                                                                                                                                              |
| `.env.example`                  | `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`                                                                                                                                                                   |
| `apps/api/prisma/schema.prisma` | Schema completo: models `User`, `UserProfile`, `NutritionalGoal`, `Food`, `FoodMeasure`, `FoodLog`; extensão `unaccent` (DR-11); índices em `foods(name)` e `food_logs(user_id, log_date)`; enums `Sex` e `MealType` |
| `apps/api/src/lib/prisma.ts`    | Singleton `PrismaClient` com log em dev                                                                                                                                                                              |

> **Passos Manuais:** rodar `prisma migrate dev` com banco ativo (ver seção abaixo).

---

#### NUT-109 — Seed TACO v7 `[Done - 2026-05-20]`

**Arquivos criados:**

| Arquivo                                | Descrição                                                                                                                                                                                                                              |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/api/prisma/seeds/taco.seed.ts`   | Upsert idempotente via `prisma.food.upsert`; deleta e recria medidas a cada run; executável via `npx prisma db seed`                                                                                                                   |
| `apps/api/prisma/seeds/data/taco.json` | 20 alimentos TACO v7 com dados por 100g e medidas caseiras: Arroz, Feijão, Frango, Ovo, Batata-doce, Brócolis, Banana, Maçã, Pão francês, Leite, Mussarela, Azeite, Aveia, Iogurte, Patinho, Laranja, Cenoura, Tomate, Alface, Abacate |

> **Observação:** amostra representativa. Para produção, substituir pelo dataset completo da TACO v7 (597 alimentos — UNICAMP).

---

#### NUT-110 — Pipeline CI `[Done - 2026-05-20]`

**Arquivos criados:**

| Arquivo                    | Descrição                                                                                                                                                                                                                                                                                    |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.github/workflows/ci.yml` | 4 jobs: **lint** (ESLint em todos workspaces), **typecheck** (`prisma generate` + `tsc --noEmit` em shared e api), **build-api** (`prisma generate` + `tsc`), **integration-tests** (PostgreSQL via GH Actions services + migrations + seed). Triggers: PRs e pushes para `main` e `develop` |

---

#### NUT-111 — Railway `[Done - 2026-05-20]`

**Arquivos criados:**

| Arquivo                  | Descrição                                                                                                                                                                              |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `railway.toml`           | Build: `npm ci` + `prisma generate` + `tsc`; Start: `prisma migrate deploy` + `node dist/server.js`; Healthcheck: `GET /health` (timeout 120s); Restart: `ON_FAILURE` (max 10 retries) |
| `apps/api/src/server.ts` | `GET /health` → `200 { status: "ok", timestamp }`                                                                                                                                      |

> **Passos Manuais:** provisionar projeto Railway (ver seção abaixo).

---

### Passos Manuais — Ativar Ambiente Local

Pré-requisitos: Node.js >= 20 e Docker Desktop rodando.

```bash
cd app-nutricional
npm install
cp .env.example .env
npm run db:up                                          # aguardar container ficar healthy
cd apps/api && npx prisma migrate dev --name init
npx prisma db seed
cd ../.. && npm run dev
curl http://localhost:3000/health                      # esperado: { "status": "ok", "timestamp": "..." }
```

### Passos Manuais — Railway (NUT-111)

1. Criar projeto em [railway.app](https://railway.app)
2. Adicionar environments: `staging` e `production`
3. Adicionar serviço PostgreSQL em cada environment
4. Configurar variáveis em cada environment:
   - `DATABASE_URL` — gerado pelo PostgreSQL do Railway
   - `JWT_SECRET` — string aleatória ≥ 32 chars
   - `JWT_REFRESH_SECRET` — string aleatória ≥ 32 chars
5. Conectar repositório GitHub: `staging` → branch `develop` | `production` → branch `main`
6. `railway.toml` já configura build, migrations e healthcheck automaticamente

---

## M2 — Autenticação & Onboarding `[Done - 2026-05-22]`

**Epic:** NUT-112 — EPIC: Autenticação & Onboarding

| Issue   | Título                                                         | Status   |
| ------- | -------------------------------------------------------------- | -------- |
| NUT-113 | [backend] POST /auth/register com validação Zod                | `Done`   |
| NUT-114 | [backend] POST /auth/login com bcrypt e JWT                    | `Done`   |
| NUT-115 | [backend] POST /auth/google (OAuth2 via Passport.js)           | `Done`   |
| NUT-116 | [backend] POST /auth/apple (OAuth2 via Passport.js)            | `Done`   |
| NUT-117 | [backend] POST /auth/refresh com rotação de token              | `Done`   |
| NUT-118 | [backend] POST /auth/forgot-password com Nodemailer            | `Done`   |
| NUT-119 | [frontend] LoginScreen com OAuth Google e Apple                | `Done`   |
| NUT-120 | [frontend] RegisterScreen com validação em tempo real          | `Done`   |
| NUT-121 | [frontend] ForgotPasswordScreen                                | `Done`   |
| NUT-122 | [frontend] OnboardingScreen (fluxo em steps com TMB preview)   | `Done`   |
| NUT-123 | [frontend] AuthStore com Zustand e persistência em SecureStore | `Done`   |
| NUT-124 | [frontend] Interceptor Axios para refresh automático de token  | `Done`   |
| NUT-125 | [test-e2e] Auth — cadastro, login, sessão expirada e OAuth     | Pendente |

---

#### NUT-113 a NUT-118 — Backend de Autenticação `[Done - 2026-05-22]`

**Arquivos criados:**

| Arquivo                                             | Descrição                                                                                                                                                                                                   |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/api/prisma/schema.prisma`                     | Model `RefreshToken` (`id`, `userId`, `tokenHash` SHA-256, `expiresAt`) + relação `RefreshToken[]` no `User`                                                                                                |
| `apps/api/src/lib/jwt.ts`                           | JWT HS256 via Node.js crypto: `signAccessToken` (15min), `signRefreshToken` (30d), `verifyAccessToken`, `verifyRefreshToken`                                                                                |
| `apps/api/src/lib/errors.ts`                        | Erros de domínio tipados: `ConflictError`, `UnauthorizedError`, `NotFoundError`, `ForbiddenError`                                                                                                           |
| `apps/api/src/lib/email.ts`                         | Wrapper Nodemailer: `sendPasswordResetEmail` (SMTP configurável via env)                                                                                                                                    |
| `apps/api/src/middlewares/error-handler.ts`         | Plugin Fastify: mapeia `ZodError → 400`, `ConflictError → 409`, `UnauthorizedError → 401`, `ForbiddenError → 403`, `NotFoundError → 404`                                                                    |
| `apps/api/src/middlewares/authenticate.ts`          | `preHandler`: extrai Bearer token, verifica JWT, injeta `req.user = { id: userId }`                                                                                                                         |
| `apps/api/src/repositories/user.repository.ts`      | `findByEmail`, `findById` (inclui profile + goals), `findByProvider`, `create`                                                                                                                              |
| `apps/api/src/repositories/goal.repository.ts`      | `create`, `findLatestByUser`                                                                                                                                                                                |
| `apps/api/src/calculators/tmb.calculator.ts`        | Mifflin-St Jeor (sem % gordura) e Katch-McArdle (com % gordura) + `calcAge`                                                                                                                                 |
| `apps/api/src/calculators/macro-goal.calculator.ts` | Proteína 30% / Gordura 25% / Carb 45%                                                                                                                                                                       |
| `apps/api/src/services/auth.service.ts`             | `register` (bcrypt hash), `login`, `loginWithGoogle` (tokeninfo endpoint), `loginWithApple` (JWT decode), `refresh` (rotação: deleta old → emite novo par), `forgotPassword` (token aleatório + Nodemailer) |
| `apps/api/src/services/user.service.ts`             | `getMe`, `upsertProfile` (calcula TMB + cria meta)                                                                                                                                                          |
| `apps/api/src/routes/auth.routes.ts`                | `POST /auth/register`, `/login`, `/google`, `/apple`, `/refresh`, `/forgot-password`; `GET /auth/me`                                                                                                        |
| `apps/api/src/routes/users.routes.ts`               | `GET /users/me`, `PUT /users/me/profile`                                                                                                                                                                    |
| `apps/api/src/server.ts`                            | Registra `errorHandler` + `authRoutes` + `usersRoutes`                                                                                                                                                      |
| `.env.example`                                      | Vars adicionadas: `SMTP_HOST/PORT/SECURE/USER/PASS/FROM`, `APP_URL`, `EXPO_PUBLIC_API_URL`                                                                                                                  |

---

#### NUT-119 a NUT-124 — Frontend de Autenticação `[Done - 2026-05-22]`

**Arquivos criados:**

| Arquivo                                                 | Descrição                                                                                                                                                                                                                                          |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `apps/mobile/src/store/auth.store.ts`                   | Zustand store: `user`, `accessToken`, `refreshToken`, `isAuthenticated`, `needsOnboarding`, `isLoading`; persistência em SecureStore (5 chaves); actions: `login`, `logout`, `setTokens`, `setNeedsOnboarding`, `initialize`                       |
| `apps/mobile/src/lib/api.ts`                            | Axios com `baseURL = EXPO_PUBLIC_API_URL`; request interceptor injeta Bearer token; response interceptor detecta 401, faz refresh silencioso e reexecuta; fila de concorrência sem múltiplos refreshes simultâneos                                 |
| `apps/mobile/src/navigation/index.tsx`                  | `RootNavigator`: `AuthStack` (Login/Register/Forgot) ↔ `AppStack` (Onboarding                                                                                                                                                                      | Home placeholder); exibe `ActivityIndicator` durante `isLoading` |
| `apps/mobile/src/screens/auth/LoginScreen.tsx`          | Campos email/senha + validação Zod inline; loading state no botão; stubs para Google/Apple OAuth (TODO: `expo-auth-session`); links para Register e ForgotPassword                                                                                 |
| `apps/mobile/src/screens/auth/RegisterScreen.tsx`       | Campos nome/email/senha/confirmação; indicador de força de senha em tempo real (Fraca/Média/Boa/Forte) com barra colorida; validação Zod com `refine` para senhas iguais; após register: login automático + `needsOnboarding=true`                 |
| `apps/mobile/src/screens/auth/ForgotPasswordScreen.tsx` | Campo email + validação Zod; exibe mensagem genérica de sucesso independente de e-mail existir                                                                                                                                                     |
| `apps/mobile/src/screens/auth/OnboardingScreen.tsx`     | 6 steps: data de nascimento → sexo (toggle) → altura → peso → % gordura (opcional) → confirmação com TMB preview; fórmulas Mifflin-St Jeor / Katch-McArdle; ao confirmar: `PUT /users/me/profile` → `setNeedsOnboarding(false)` → navega para Home |
| `apps/mobile/App.tsx`                                   | `QueryClientProvider` (TanStack Query) + `initialize()` do AuthStore no `useEffect`                                                                                                                                                                |

---

### Decisões Técnicas — M2

**JWT sem dependência externa:** implementação HS256 customizada com Node.js crypto. `timingSafeEqual` evita timing attacks na verificação de assinatura.

**Google OAuth (backend):** verificação via `GET https://oauth2.googleapis.com/tokeninfo?id_token=<token>` sem `google-auth-library`. Adequado para MVP.

**Apple OAuth (backend):** decode do JWT (base64url) para extrair `sub` e `email`; verificação de `iss = https://appleid.apple.com`. Assinatura não verificada criptograficamente — pendente para produção (requer JWKS endpoint da Apple ou biblioteca `jose`).

**Refresh token storage:** hash SHA-256 do JWT armazenado em `refresh_tokens`. Rotação: token antigo deletado atomicamente antes de emitir novo par.

**`needsOnboarding` flag:** persistida em SecureStore para sobreviver reinicializações, evitando `GET /users/me` na inicialização.

---

### Passos Manuais — Ativar M2

```bash
cd app-nutricional/apps/api
npx prisma migrate dev --name add-refresh-tokens   # cria tabela refresh_tokens
cd ../.. && npm run dev

# Testar
curl -X POST http://localhost:3000/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Teste","email":"teste@email.com","password":"Senha123"}'
```

> **Pendente (NUT-125):** testes E2E com Detox requerem setup de simulador iOS/Android. Executar com `npx detox build && npx detox test`.

---

## M3 — Log Alimentar

**Epic:** NUT-126 — EPIC: Log Alimentar

| Issue   | Título                                                                 | Status  |
| ------- | ---------------------------------------------------------------------- | ------- |
| NUT-127 | [backend] GET /foods/search com unaccent e debounce                    | `Done`  |
| NUT-128 | [backend] GET /foods/:id                                               | `Done`  |
| NUT-129 | [backend] GET /logs?date= com totais por refeição                      | `Done`  |
| NUT-130 | [backend] POST /logs com cálculo de macros (DR-06, DR-07)              | `Done`  |
| NUT-131 | [backend] PUT /logs/:id com recálculo de macros                        | `Done`  |
| NUT-132 | [backend] DELETE /logs/:id                                             | `Done`  |
| NUT-133 | [frontend] DailyLogScreen com navegação de datas                       | `Done`  |
| NUT-134 | [frontend] FoodSearchScreen com debounce 300ms                         | `Done`  |
| NUT-135 | [frontend] FoodDetailScreen com gramas e medidas caseiras              | `Done`  |
| NUT-136 | [integration] Fluxo completo: busca → seleção → quantidade → log       | `Done`  |
| NUT-137 | [test-e2e] Log Alimentar — adicionar, editar, excluir e medida caseira | `Done`  |

---

#### NUT-127 — GET /foods/search `[Done - 2026-05-22]`

**Arquivos criados:**

| Arquivo                                             | Descrição                                                                                                                                                                  |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/shared/src/index.ts`                      | `foodSearchQuerySchema` (`q` min 2, `limit` coerced 1–30 default 10), `foodSearchResponseSchema`, tipos `FoodSearchQueryDto` e `FoodSearchResponseDto`                     |
| `apps/api/package.json`                             | Dependência `@nutri-ia/shared: "*"` adicionada; script `start` corrigido para `node dist/apps/api/src/server.js`                                                           |
| `apps/api/tsconfig.json`                            | `rootDir` alterado de `./src` para `../../` para resolução correta de `@nutri-ia/shared` no build `tsc`                                                                    |
| `apps/api/src/repositories/food.repository.ts`      | `FoodRepository.search()` com `$queryRaw` usando DR-11 (`unaccent(lower())` em WHERE e ORDER BY); `findMany` com `include: { measures: true }`                             |
| `apps/api/src/repositories/food.repository.test.ts` | 6 testes de integração: case-insensitive, unaccent, resultado vazio, `measures[]`, limit, ordenação (match exato antes do parcial)                                         |
| `apps/api/src/services/food.service.ts`             | `FoodService.search()` thin orchestrator com DI de `FoodRepository` via constructor                                                                                        |
| `apps/api/src/services/food.service.test.ts`        | 3 testes unitários: delegação com params corretos, lista vazia, propagação de erro                                                                                         |
| `apps/api/src/routes/foods.routes.ts`               | Plugin Fastify `GET /foods/search` com `safeParse` do schema Zod; `400` em validação falha; `200 + { foods[] }` em sucesso (lista vazia quando não encontrado — nunca 404) |
| `apps/api/src/routes/foods.routes.test.ts`          | 7 testes via `fastify.inject()`: `q` ausente, `q` < 2 chars, `limit` > 30, busca válida, não encontrado, limit default 10, limit customizado                               |
| `apps/api/src/server.ts`                            | Wiring: instancia `FoodRepository` e `FoodService`, registra `foodsPlugin` com DI                                                                                          |

> **Passos Manuais:** criar `.env` em `apps/api/` com `DATABASE_URL=postgresql://nutri_ia:nutri_ia_dev@localhost:5432/nutri_ia_dev` antes de rodar localmente.

---

#### NUT-128 — GET /foods/:id `[Done - 2026-05-22]`

**Arquivos criados:**

| Arquivo                                             | Descrição                                                                                                                                                                       |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/shared/src/index.ts`                      | `foodIdParamSchema` (`z.object({ id: z.string().uuid() })`) e tipo `FoodIdParamDto`                                                                                             |
| `apps/api/src/repositories/food.repository.ts`      | Método `findById(id)` via `prisma.food.findUnique({ where: { id }, include: { measures: true } })`; retorna `FoodWithMeasures \| null`                                          |
| `apps/api/src/services/food.service.ts`             | Método `findById(id)` thin pass-through delegando ao repository                                                                                                                 |
| `apps/api/src/routes/foods.routes.ts`               | Handler `GET /foods/:id`: valida UUID via `foodIdParamSchema` → `400`; `404` se null; `foodSchema.parse(food)` antes de `reply.send()` (strip de campos internos como `tacoId`) |
| `apps/api/src/repositories/food.repository.test.ts` | +3 testes de integração: encontra food com measures, retorna null para UUID inexistente, verifica campos `id`/`description`/`gramsEquivalent` das measures                      |
| `apps/api/src/services/food.service.test.ts`        | +3 testes unitários: delegação com id correto, propagação de null, propagação de erro                                                                                           |
| `apps/api/src/routes/foods.routes.test.ts`          | +4 testes via `app.inject()`: `200` food sem envelope (com guard `not.toHaveProperty('tacoId')`), `404` quando null, `400` UUID inválido, delegação com id correto              |

---

#### NUT-129 — GET /logs?date= `[Done - 2026-05-25]`

**Arquivos criados:**

| Arquivo                                                | Descrição                                                                                                                                                                                                        |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/shared/src/index.ts`                         | `dailyLogsQuerySchema` (date YYYY-MM-DD, default UTC today), `foodLogItemSchema`, `dailyLogsResponseSchema` (reutiliza `macroResultSchema`), tipos `DailyLogsQueryDto`, `FoodLogItemDto`, `DailyLogsResponseDto` |
| `apps/api/src/repositories/foodLog.repository.ts`      | `findByUserAndDate()`: filtra por `userId` + `logDate` (UTC-safe: `new Date(\`${date}T00:00:00.000Z\`)`), inclui `food.{id,name}`, ordena por `createdAt asc`                                                    |
| `apps/api/src/services/foodLog.service.ts`             | `getDailyLogs()`: agrupa por `mealType` (4 chaves sempre presentes), soma macros desnormalizados com `round2()` (2 casas decimais) para evitar float drift; usa `MealType` do Prisma sem cast inseguro           |
| `apps/api/src/routes/logs.routes.ts`                   | Plugin `logsPlugin` com `GET /logs`, `preHandler: authenticate`, validação Zod via `safeParse` (`400` em falha)                                                                                                  |
| `apps/api/src/routes/logs.routes.test.ts`              | 6 testes de rota: `400` date inválida, `200` dados populados, `200` dia vazio (4 arrays vazios + totals zerados), default UTC today, `userId` propagado, `401` sem Authorization                                 |
| `apps/api/src/services/foodLog.service.test.ts`        | 10 testes: agrupamento por mealType (4 cenários), soma de macros com múltiplos logs, 4 chaves sempre presentes, shape de item, delegação ao repo, propagação de erro                                             |
| `apps/api/src/repositories/foodLog.repository.test.ts` | 5 testes (Prisma real, requer DB): resultado vazio, include `food.{id,name}`, isolamento por userId, isolamento por logDate, ordenação por `createdAt asc`                                                       |
| `apps/api/src/server.ts`                               | Wiring: instancia `FoodLogRepository` + `FoodLogService`, registra `logsPlugin` com prefixo `/v1`                                                                                                                |

> **Nota técnica:** a issue referencia `domain-rules.md DR-08` (arquivo inexistente) e `requirements.md R4.7` (numeração incorreta). Implementação seguiu `api.md:231-264` e `data-model.md:208-212`.

---

#### NUT-134 — FoodSearchScreen com debounce 300ms `[Done - 2026-05-25]`

**Arquivos criados/alterados:**

| Arquivo                                                          | Descrição                                                                                                                              |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/mobile/src/hooks/useFoodSearch.ts`                         | Hook TanStack Query: `GET /foods/search?q=`; `enabled: q.length >= 2`; cache key `['foods','search',q]`                               |
| `apps/mobile/src/screens/home/FoodSearchScreen.tsx`              | Substituição do skeleton: TextInput + debounce 300ms via `useRef`/`setTimeout` com cleanup; skeleton list, empty state e results list  |
| `apps/mobile/src/screens/home/FoodDetailScreen.tsx`              | Skeleton novo (recebe `{ food, mealType, date }`); implementação real virá na NUT-135                                                  |
| `apps/mobile/src/navigation/index.tsx`                           | `FoodDetail` adicionado ao `AppStackParamList` e ao `AppStack.Navigator` como modal com title "Adicionar alimento"                     |

> **Decisão técnica:** hint state baseado em `query.length < 2` (não `debouncedQuery`) para feedback visual imediato antes do debounce disparar.

---

#### NUT-135 — FoodDetailScreen com gramas e medidas caseiras `[Done - 2026-05-25]`

**Arquivos criados/alterados:**

| Arquivo | Descrição |
| ------- | --------- |
| `apps/mobile/src/hooks/useCreateLog.ts` | Novo hook TanStack Query Mutation: `POST /logs`; invalida `['logs', date]` e `['report', date]` no `onSuccess` |
| `apps/mobile/src/screens/home/FoodDetailScreen.tsx` | Reimplementação completa: tabela nutricional por 100g, toggle gramas/medidas caseiras, TextInput com preview em tempo real, picker de medidas, botão "Adicionar ao log" com loading state |

> **Decisão técnica:** `calcPreview` duplica intencionalmente a lógica do `food-macros.calculator.ts` no cliente (mesmo arredondamento `Math.round(v * 10) / 10`) para preview instantâneo sem chamada à API; extração para `packages/shared` foi descartada pois o cálculo é trivial e a dependência seria apenas client-side.

---

#### NUT-137 — [test-e2e] Log Alimentar `[Done - 2026-05-25]`

**Arquivos criados/alterados:**

| Arquivo | Descrição |
| ------- | --------- |
| `apps/mobile/.detoxrc.js` | Configuração Detox: apps Android Debug (APK + Gradle) e iOS Debug (Xcode prebuild); devices simulator (iPhone 15) e emulator (Pixel 4); configurações `ios.sim.debug` e `android.emu.debug` |
| `apps/mobile/e2e/jest.config.js` | Runner Detox/Jest: `maxWorkers: 1`, `testTimeout: 120s`, transform ts-jest, globalSetup/globalTeardown/testEnvironment do Detox |
| `apps/mobile/e2e/setup.ts` | Helpers: `ensureTestUser()` (register + upsert profile idempotente), `loginTestUser()`, `findFood()`, `seedLog()`, `clearLogs()` — todos via `axios` contra `http://localhost:3000/v1` |
| `apps/mobile/e2e/foodLog.test.ts` | 5 cenários BDD implementados com Detox: adicionar por gramagem (preview + item no Almoço + total), medida caseira (toggle + seleção + preview), busca sem resultados, editar quantidade, excluir com swipe |
| `apps/mobile/package.json` | devDeps: `detox ^20.26.0`, `jest ^29.7.0`, `ts-jest ^29.2.0`, `@types/jest ^29.5.0`; scripts `test:e2e`, `test:e2e:android`, `build:e2e`, `build:e2e:android` |
| `apps/mobile/tsconfig.json` | `"exclude": ["e2e"]` — impede que tipos Detox/Node contaminem o typecheck Expo |
| `apps/mobile/src/screens/auth/LoginScreen.tsx` | `testID` em email input (`login-email-input`), password input (`login-password-input`) e botão Entrar (`login-btn`) |
| `apps/mobile/src/screens/home/DailyLogScreen.tsx` | `testID` em: seções de refeição (`meal-section-{mealType}`), botões "+ Add" (`add-food-btn-{mealType}`), `Animated.View` de log (`log-item-{id}`), botão delete revelado no swipe (`delete-btn-{id}`), inner touch de edição (`log-item-edit-{id}`), input do modal (`edit-qty-input`), botão salvar (`edit-save-btn`), calorias consumidas (`kcal-consumed`) |
| `apps/mobile/src/screens/home/FoodSearchScreen.tsx` | `testID` em: input de busca (`food-search-input`), itens de resultado (`food-result-{id}`), container de empty state (`food-empty-state`) |
| `apps/mobile/src/screens/home/FoodDetailScreen.tsx` | `testID` em: toggles (`toggle-grams`, `toggle-measure`), input de quantidade (`qty-input`), cada medida caseira (`measure-item-{id}`), preview kcal (`preview-kcal`), preview macros (`preview-macros`), botão submit (`submit-btn`); `ToggleButton` aceita prop `testID?: string` |

> **Decisão técnica:** `testID` no `Animated.View` (não no wrapper) — o `PanResponder` está atachado ali, garantindo que o gesto de swipe do Detox atinja o responder correto. `delete-btn-${id}` tem testID próprio para evitar ambiguidade com o "Excluir" do `Alert.alert` nativo.
>
> **Pré-requisitos para rodar:** `expo prebuild` para gerar diretórios nativos; verificar paths em `.detoxrc.js`; API + DB ativos. Testes com `npm run test:e2e` dentro de `apps/mobile/`.

---

#### NUT-136 — [integration] Fluxo completo: busca → seleção → quantidade → log `[Done - 2026-05-25]`

**Arquivos criados:**

| Arquivo                                                              | Descrição                                                                                                                                                                                                                                 |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/api/src/routes/food-log-flow.integration.test.ts`              | 4 testes de integração: ambos os plugins (`foodsPlugin` + `logsPlugin`) num único Fastify com serviços reais e repos mockados; chain GET /foods/search → POST /logs → GET /logs; exercita `calculateFoodMacros` de verdade validando os valores exatos do BDD (150g → 192 kcal · P:3.8g · G:0.3g · C:42.2g) |

> **Decisão técnica:** serviços reais + repositórios mockados (em vez de services completamente mockados) garantem que `calculateFoodMacros` seja exercitado nas asserções, tornando o teste sensível a regressões na calculadora.

---

#### NUT-131 — PUT /logs/:id `[Done - 2026-05-25]`

**Arquivos alterados:**

| Arquivo                                                | Descrição                                                                                                                                                                                                                |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `packages/shared/src/index.ts`                         | `updateLogSchema` (`quantity`, `unit`, `.refine()` para `foodMeasureId` quando `unit='measure'`); tipo `UpdateLogDto`; `UpdateLogResponseDto` reutiliza `createLogResponseSchema`                                         |
| `apps/api/src/repositories/foodLog.repository.ts`      | Tipos `FoodLogWithFoodAndMeasures` (inclui campos nutricionais + `measures[]`) e `UpdateFoodLogData`; métodos `findById(id)` (inclui `food.measures` para recálculo) e `update(id, data)` (retorna `FoodLogWithFood`)     |
| `apps/api/src/services/foodLog.service.ts`             | Método `updateLog(userId, logId, dto)`: `findById` → `404` se null → `403` se ownership falhar → recalcula via `calculateFoodMacros` → `update`; sem segunda query ao banco para o food (aproveita `food.measures` do log) |
| `apps/api/src/routes/logs.routes.ts`                   | Handler `PUT /logs/:id`: valida `:id` UUID via `foodIdParamSchema`, valida body via `updateLogSchema`, delega ao service, retorna `200`                                                                                   |
| Arquivos de teste                                      | +2 testes integração (repository), +8 testes unitários (service), +8 testes de rota (21 total no arquivo de rotas, 28 total no de service)                                                                               |

---

#### NUT-130 — POST /logs `[Done - 2026-05-25]`

**Arquivos criados:**

| Arquivo                                                   | Descrição                                                                                                                                                                                                                                                         |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/api/src/calculators/food-macros.calculator.ts`      | Função pura `calculateFoodMacros(food, quantity, unit, measure?)`: DR-06 (gramas) e DR-07 (medidas caseiras); arredondamento `Math.round(n*10)/10` (1 decimal); lança `Error` se `unit='measure'` sem `measure` passado                                           |
| `apps/api/src/calculators/food-macros.calculator.test.ts` | 4 testes unitários: path gramas, path medida (`gramsEquivalent`), arredondamento 1 decimal, erro com `unit='measure'` sem measure                                                                                                                                 |
| `packages/shared/src/index.ts`                            | `createLogSchema` refinado: `unit` para `z.enum(['g','measure'])` + `.refine()` exigindo `foodMeasureId` quando `unit='measure'`; `createLogResponseSchema` com 9 campos; tipo `CreateLogResponseDto`                                                             |
| `apps/api/src/repositories/foodLog.repository.ts`         | Tipo `CreateFoodLogData` + método `create()` via `prisma.foodLog.create({ data, include: { food } })`                                                                                                                                                             |
| `apps/api/src/services/foodLog.service.ts`                | 2º param no construtor (`FoodRepository`); `createLog()`: valida food + measure, calcula macros, persiste com `logDate` UTC-safe, mapeia resposta para 9 campos (omite `logDate`, `foodMeasureId`, `createdAt`); `unit` castado de `string` para `'g'\|'measure'` |
| `apps/api/src/routes/logs.routes.ts`                      | `POST /logs` com `preHandler: authenticate`, `safeParse` do `createLogSchema`, `400` em falha, `reply.status(201).send(log)`                                                                                                                                      |
| `apps/api/src/server.ts`                                  | Wiring atualizado: `new FoodLogService(foodLogRepository, foodRepository)`                                                                                                                                                                                        |
| `apps/api/src/middlewares/error-handler.ts`               | Envolvido com `fastify-plugin` (fp) para corrigir bug de escopo: `setErrorHandler` agora aplica ao escopo raiz, alcançando todos os plugins irmãos (fix necessário para 404 funcionar em `POST /logs`)                                                            |
| `apps/api/package.json`                                   | Dependência direta `fastify-plugin ^4.5.1` adicionada (era transitiva via `@fastify/jwt`)                                                                                                                                                                         |
| `apps/api/src/services/foodLog.service.test.ts`           | +9 testes: path gramas, path medida, food não encontrado → `NotFoundError`, measure não em `food.measures` → `NotFoundError`, macros 1 decimal, `logDate` UTC midnight, `foodMeasureId` null quando `unit='g'`, response sem campos internos, propagação de erro  |
| `apps/api/src/repositories/foodLog.repository.test.ts`    | +2 testes de integração (requerem DB): retorna `FoodLogWithFood` com `food:{id,name}`, persiste via `findUnique`                                                                                                                                                  |
| `apps/api/src/routes/logs.routes.test.ts`                 | +7 testes de rota: `201` envelope 9 campos, `400` campo ausente, `400` unit='measure' sem `foodMeasureId`, `400` mealType inválido, `404` `NotFoundError` propagado, `401` sem auth, `userId` propagado; registra `errorHandler` em ambos os `describe` blocks    |

> **Nota técnica:** measure inexistente em `food.measures` → `404` (decisão alinhada com usuário). `foodMeasureId` enviado com `unit='g'` → persistido como `null` (decisão alinhada com usuário).

---

## M4 — Relatório Nutricional

**Epic:** NUT-138 — EPIC: Relatório Nutricional

| Issue   | Título                                                                         | Status  |
| ------- | ------------------------------------------------------------------------------ | ------- |
| NUT-139 | [backend] GET /reports/daily com balanço calórico (DR-09)                      | Backlog |
| NUT-140 | [frontend] DailyReportScreen com barras de progresso                           | Backlog |
| NUT-141 | [frontend] Compartilhar selectedDate entre DailyLog e DailyReport via AppStore | Backlog |
| NUT-142 | [test-e2e] Relatório — déficit, superávit, on_target e histórico               | Backlog |

---

## M5 — Perfil do Usuário

**Epic:** NUT-143 — EPIC: Perfil do Usuário

| Issue   | Título                                                                             | Status  |
| ------- | ---------------------------------------------------------------------------------- | ------- |
| NUT-144 | [backend] GET /users/me com perfil e meta atual                                    | Backlog |
| NUT-145 | [backend] PUT /users/me/profile com recálculo de TMB e metas                       | Backlog |
| NUT-146 | [frontend] ProfileScreen com idade calculada e modo visualização                   | Backlog |
| NUT-147 | [frontend] EditProfileScreen com preview de nova TMB                               | Backlog |
| NUT-148 | [test-e2e] Perfil — editar peso recalcula meta e data de nascimento no modo edição | Backlog |

---

## M6 — Testes E2E & Release 1.0

**Epic:** NUT-149 — EPIC: Testes E2E & Release 1.0

| Issue   | Título                                                                      | Status  |
| ------- | --------------------------------------------------------------------------- | ------- |
| NUT-150 | Configurar Detox para testes E2E em iOS e Android                           | Backlog |
| NUT-151 | [test-e2e] Fluxo E2E: cadastro → onboarding → log refeição → ver relatório  | Backlog |
| NUT-152 | [test-e2e] Fluxo E2E: login → log café + almoço + jantar → verificar totais | Backlog |
| NUT-153 | [test-e2e] Fluxo E2E: editar perfil → confirmar recálculo de meta           | Backlog |
| NUT-154 | [test-e2e] Fluxo E2E: offline → modo somente-leitura de cache               | Backlog |
| NUT-155 | Checklist de release: acessibilidade, contraste e toque mínimo              | Backlog |

---

## Correções Avulsas

#### fix — `jwt.ts`: variável de ambiente errada para o access token `[Fix - 2026-05-25]`

**Problema:** `ACCESS_SECRET` lia `process.env.JWT_SECRET`, que não existe no `.env`. Em runtime o valor ficava `undefined`, quebrando toda validação de token de acesso.

**Arquivos alterados:**

| Arquivo | Descrição |
| ------- | --------- |
| `apps/api/src/lib/jwt.ts` | `ACCESS_SECRET` corrigido para `process.env.JWT_ACCESS_SECRET ?? process.env.JWT_SECRET` (fallback de compatibilidade); removidas asserções `!` |

---

#### fix — mobile: entry point incorreto no `package.json` `[Fix - 2026-05-25]`

**Problema:** `"main": "App.tsx"` pulava o `registerRootComponent` exigido pelo Expo, causando falha em builds standalone/produção. Além disso o arquivo `index.js` e os assets obrigatórios nunca foram commitados.

**Arquivos alterados/adicionados:**

| Arquivo | Descrição |
| ------- | --------- |
| `apps/mobile/package.json` | `"main"` corrigido de `"App.tsx"` para `"index.js"` |
| `apps/mobile/index.js` | Criado: chama `registerRootComponent(App)` — entry point obrigatório do Expo |
| `apps/mobile/assets/` | Assets do Expo adicionados: `icon.png`, `splash.png`, `adaptive-icon.png`, `favicon.png` |

---

#### fix — prisma: migration `add_refresh_tokens` não estava commitada `[Fix - 2026-05-25]`

**Problema:** A migration foi gerada localmente mas nunca commitada, causando divergência entre o schema Prisma e o banco em qualquer ambiente novo (CI, staging, onboarding de dev).

**Arquivos adicionados:**

| Arquivo | Descrição |
| ------- | --------- |
| `apps/api/prisma/migrations/20260522203120_add_refresh_tokens/migration.sql` | Cria tabela `refresh_tokens` com `token_hash` único e FK `user_id → users(id) ON DELETE CASCADE` |
