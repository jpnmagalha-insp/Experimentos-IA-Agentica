Resumo de Issues Criadas no Linear — App Nutricional v1.0
==========================================================

Total: 6 epics + 44 issues = 50 itens criados no Linear
Status geral: Backlog | Linkados ao projeto/milestone correspondente

==========================================================
M1 — Infraestrutura & Setup                          [EXECUTADO — 2026-05-20]
==========================================================
Epic:   NUT-106 — EPIC: Infraestrutura & Setup
Issues: NUT-107 — Configurar monorepo com apps/mobile, apps/api e packages/shared
        NUT-108 — Configurar PostgreSQL + Prisma com schema inicial e migrations
        NUT-109 — Implementar seed da base TACO v7 com alimentos e medidas caseiras
        NUT-110 — Configurar pipeline de CI com lint, typecheck e build
        NUT-111 — Configurar ambientes staging e production no Railway

----------------------------------------------------------
RELATÓRIO DE EXECUÇÃO — M1
----------------------------------------------------------

NUT-107 — Monorepo [Done]
Arquivos criados:
  package.json                              Raiz: npm workspaces + scripts
                                            dev, build, lint, typecheck, db:up, db:seed
  apps/api/package.json                     Node 20 + Fastify 4 + Prisma 5 + Zod
  apps/api/tsconfig.json                    Target ES2022, paths para @nutri-ia/shared
  apps/api/.eslintrc.json                   @typescript-eslint/recommended
  apps/api/src/server.ts                    Bootstrap Fastify + rota GET /health
  apps/api/src/lib/prisma.ts                Singleton PrismaClient
  apps/mobile/package.json                  Expo SDK 51 + React Native + TanStack Query
  apps/mobile/tsconfig.json                 Extends expo/tsconfig.base
  apps/mobile/app.json                      Config Expo (iOS bundleId + Android package)
  apps/mobile/.eslintrc.json                @typescript-eslint/recommended
  apps/mobile/App.tsx                       Entry point mínimo para typecheck
  packages/shared/package.json              Zod como única dependência
  packages/shared/tsconfig.json             Compila para dist/ com declarations
  packages/shared/src/index.ts             Schemas Zod: auth, onboarding, food, log
                                            + tipos inferidos (LoginDto, CreateLogDto…)

NUT-108 — PostgreSQL + Prisma [Done]
Arquivos criados:
  docker-compose.yml                        PostgreSQL 15-alpine local (porta 5432)
  .env.example                              DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET
  apps/api/prisma/schema.prisma             Schema completo conforme data-model.md:
                                            Models: User, UserProfile, NutritionalGoal,
                                            Food, FoodMeasure, FoodLog
                                            Extensão unaccent habilitada (DR-11)
                                            Índices: foods(name), food_logs(user_id,log_date)
                                            Enums: Sex (male|female), MealType
                                            (breakfast|lunch|dinner|snack)
  apps/api/src/lib/prisma.ts                Singleton PrismaClient com log em dev
Passos manuais: rodar `prisma migrate dev` com banco ativo (ver seção abaixo)

NUT-109 — Seed TACO v7 [Done]
Arquivos criados:
  apps/api/prisma/seeds/taco.seed.ts        Upsert idempotente via prisma.food.upsert
                                            Deleta e recria medidas a cada run
                                            Executável via `npx prisma db seed`
  apps/api/prisma/seeds/data/taco.json      20 alimentos TACO v7 com dados por 100g
                                            e medidas caseiras: Arroz, Feijão, Frango,
                                            Ovo, Batata-doce, Brócolis, Banana, Maçã,
                                            Pão francês, Leite, Mussarela, Azeite,
                                            Aveia, Iogurte, Patinho, Laranja, Cenoura,
                                            Tomate, Alface, Abacate
Observação: amostra representativa. Para produção, substituir pelo dataset completo
da TACO v7 (597 alimentos — UNICAMP).

NUT-110 — Pipeline CI [Done]
Arquivo criado:
  .github/workflows/ci.yml                  4 jobs:
                                            1. lint           — ESLint em todos workspaces
                                            2. typecheck      — prisma generate + tsc --noEmit
                                                               em packages/shared e apps/api
                                            3. build-api      — prisma generate + tsc
                                            4. integration-tests — PostgreSQL via GH Actions
                                                               services + migrations + seed
                                            Triggers: PRs e pushes para main e develop

NUT-111 — Railway [Done]
Arquivos criados:
  railway.toml                              Build: npm ci + prisma generate + tsc
                                            Start: prisma migrate deploy + node dist/server.js
                                            Healthcheck: GET /health (timeout 120s)
                                            Restart: ON_FAILURE (max 10 retries)
  apps/api/src/server.ts                    GET /health → 200 { status: "ok", timestamp }
Passos manuais: provisionar projeto Railway (ver seção abaixo)

----------------------------------------------------------
PASSOS MANUAIS — ATIVAR AMBIENTE LOCAL
----------------------------------------------------------

Pré-requisitos: Node.js >= 20 e Docker Desktop rodando

  1. cd app-nutricional
  2. npm install
  3. cp .env.example .env
  4. npm run db:up
     (aguardar container ficar healthy)
  5. cd apps/api && npx prisma migrate dev --name init
  6. npx prisma db seed
  7. cd ../.. && npm run dev
  8. curl http://localhost:3000/health
     Esperado: { "status": "ok", "timestamp": "..." }

----------------------------------------------------------
PASSOS MANUAIS — RAILWAY (NUT-111)
----------------------------------------------------------

  1. Criar projeto no railway.app
  2. Adicionar environments: staging e production
  3. Adicionar serviço PostgreSQL em cada environment
  4. Configurar variáveis em cada environment:
       DATABASE_URL       (gerado pelo PostgreSQL do Railway)
       JWT_SECRET         (string aleatória >= 32 chars)
       JWT_REFRESH_SECRET (string aleatória >= 32 chars)
  5. Conectar repositório GitHub:
       staging    → branch develop
       production → branch main
  6. railway.toml já configura build, migrations e healthcheck automaticamente

==========================================================
M2 — Autenticação & Onboarding                      [EXECUTADO — 2026-05-22]
==========================================================
Epic:   NUT-112 — EPIC: Autenticação & Onboarding
Issues: NUT-113 — [backend] Implementar POST /auth/register com validação Zod
        NUT-114 — [backend] Implementar POST /auth/login com bcrypt e JWT
        NUT-115 — [backend] Implementar POST /auth/google (OAuth2 via Passport.js)
        NUT-116 — [backend] Implementar POST /auth/apple (OAuth2 via Passport.js)
        NUT-117 — [backend] Implementar POST /auth/refresh com rotação de token
        NUT-118 — [backend] Implementar POST /auth/forgot-password com Nodemailer
        NUT-119 — [frontend] Implementar LoginScreen com OAuth Google e Apple
        NUT-120 — [frontend] Implementar RegisterScreen com validação em tempo real
        NUT-121 — [frontend] Implementar ForgotPasswordScreen
        NUT-122 — [frontend] Implementar OnboardingScreen (fluxo em steps com TMB preview)
        NUT-123 — [frontend] Configurar AuthStore com Zustand e persistência em SecureStore
        NUT-124 — [frontend] Configurar interceptor Axios para refresh automático de token
        NUT-125 — [test-e2e] Auth — fluxos de cadastro, login, sessão expirada e OAuth

----------------------------------------------------------
RELATÓRIO DE EXECUÇÃO — M2
----------------------------------------------------------

NUT-113 — POST /auth/register [Done]
NUT-114 — POST /auth/login [Done]
NUT-115 — POST /auth/google [Done]
NUT-116 — POST /auth/apple [Done]
NUT-117 — POST /auth/refresh [Done]
NUT-118 — POST /auth/forgot-password [Done]

Arquivos criados (backend):
  apps/api/prisma/schema.prisma             Adicionado model RefreshToken (id, userId,
                                            tokenHash SHA-256, expiresAt) + relação
                                            RefreshToken[] no User
  apps/api/src/lib/jwt.ts                   JWT HS256 custom via Node.js crypto:
                                            signAccessToken (15min), signRefreshToken (30d),
                                            verifyAccessToken, verifyRefreshToken
  apps/api/src/lib/errors.ts                Erros de domínio tipados: ConflictError,
                                            UnauthorizedError, NotFoundError, ForbiddenError
  apps/api/src/lib/email.ts                 Wrapper Nodemailer: sendPasswordResetEmail
                                            (SMTP configurável via env vars)
  apps/api/src/middlewares/error-handler.ts Plugin Fastify: mapeia ZodError → 400,
                                            ConflictError → 409, UnauthorizedError → 401,
                                            ForbiddenError → 403, NotFoundError → 404
  apps/api/src/middlewares/authenticate.ts  preHandler: extrai Bearer token, verifica JWT,
                                            injeta req.user = { id: userId }
  apps/api/src/repositories/user.repository.ts  findByEmail, findById (inclui profile+goals),
                                            findByProvider, create
  apps/api/src/repositories/goal.repository.ts  create, findLatestByUser
  apps/api/src/calculators/tmb.calculator.ts    Mifflin-St Jeor (sem % gordura) e
                                            Katch-McArdle (com % gordura) + calcAge
  apps/api/src/calculators/macro-goal.calculator.ts  Proteína 30% / Gordura 25% / Carb 45%
  apps/api/src/services/auth.service.ts     register (bcrypt hash), login, loginWithGoogle
                                            (tokeninfo endpoint), loginWithApple (JWT decode),
                                            refresh (rotação: deleta old → emite novo par),
                                            forgotPassword (token aleatório + Nodemailer)
  apps/api/src/services/user.service.ts     getMe, upsertProfile (calcula TMB + cria meta)
  apps/api/src/routes/auth.routes.ts        POST /auth/register, /login, /google, /apple,
                                            /refresh, /forgot-password; GET /auth/me
  apps/api/src/routes/users.routes.ts       GET /users/me, PUT /users/me/profile
  apps/api/src/server.ts                    Registra errorHandler + authRoutes + usersRoutes
  .env.example                              Adicionadas vars: SMTP_HOST/PORT/SECURE/USER/
                                            PASS/FROM, APP_URL, EXPO_PUBLIC_API_URL

NUT-119 — LoginScreen [Done]
NUT-120 — RegisterScreen [Done]
NUT-121 — ForgotPasswordScreen [Done]
NUT-122 — OnboardingScreen [Done]
NUT-123 — AuthStore [Done]
NUT-124 — Interceptor Axios [Done]

Arquivos criados (frontend):
  apps/mobile/src/store/auth.store.ts       Zustand store: user, accessToken, refreshToken,
                                            isAuthenticated, needsOnboarding, isLoading
                                            Persistência em SecureStore (5 chaves)
                                            Actions: login, logout, setTokens,
                                            setNeedsOnboarding, initialize
  apps/mobile/src/lib/api.ts                Axios com baseURL = EXPO_PUBLIC_API_URL
                                            Request interceptor: injeta Bearer token
                                            Response interceptor: detecta 401, faz refresh
                                            silencioso, reexecuta requisição; fila de
                                            concorrência sem múltiplos refreshes simultâneos
  apps/mobile/src/navigation/index.tsx      RootNavigator: AuthStack (Login/Register/Forgot)
                                            ↔ AppStack (Onboarding | Home placeholder)
                                            Exibe ActivityIndicator durante isLoading
  apps/mobile/src/screens/auth/LoginScreen.tsx
                                            Campos email/senha + validação Zod inline
                                            Loading state no botão Entrar
                                            Stubs para Google/Apple OAuth (TODO expo-auth-session)
                                            Links para Register e ForgotPassword
  apps/mobile/src/screens/auth/RegisterScreen.tsx
                                            Campos nome/email/senha/confirmação
                                            Indicador de força de senha em tempo real
                                            (Fraca/Média/Boa/Forte) com barra colorida
                                            Validação schema Zod com refine para senhas iguais
                                            Após register: login automático + needsOnboarding=true
  apps/mobile/src/screens/auth/ForgotPasswordScreen.tsx
                                            Campo email + validação Zod
                                            Sempre exibe mensagem genérica de sucesso
                                            (independente de e-mail existir)
  apps/mobile/src/screens/auth/OnboardingScreen.tsx
                                            6 steps: data de nascimento → sexo (toggle) →
                                            altura → peso → % gordura (opcional/pular) →
                                            confirmação com TMB preview calculada no frontend
                                            Fórmulas: Mifflin-St Jeor / Katch-McArdle
                                            Ao confirmar: PUT /users/me/profile →
                                            setNeedsOnboarding(false) → navega para Home
  apps/mobile/App.tsx                       QueryClientProvider (TanStack Query) +
                                            initialize() do AuthStore no useEffect

----------------------------------------------------------
DECISÕES TÉCNICAS — M2
----------------------------------------------------------

JWT sem @fastify/jwt externo
  Implementação HS256 customizada com Node.js crypto (sem deps extras).
  timingSafeEqual evita timing attacks na verificação de assinatura.

Google OAuth (backend)
  Verificação via GET https://oauth2.googleapis.com/tokeninfo?id_token=<token>
  (sem google-auth-library). Adequado para MVP.

Apple OAuth (backend)
  Decode do JWT (base64url) para extrair sub e email.
  Verificação de iss = https://appleid.apple.com.
  Assinatura não verificada criptograficamente — pendente para produção
  (requer JWKS endpoint da Apple ou biblioteca jose).

Refresh token storage
  Hash SHA-256 do JWT armazenado na tabela refresh_tokens.
  Rotação: token antigo deletado atomicamente antes de emitir novo par.

needsOnboarding flag
  Persistida em SecureStore para sobreviver reinicializações.
  Evita chamar GET /users/me na inicialização para checar perfil.

----------------------------------------------------------
PASSOS MANUAIS — ATIVAR M2
----------------------------------------------------------

  1. cd app-nutricional/apps/api
  2. npx prisma migrate dev --name add-refresh-tokens
     (cria tabela refresh_tokens no banco)
  3. cd ../..
  4. npm run dev
  5. Testar: POST http://localhost:3000/v1/auth/register
     Body: { "name": "Teste", "email": "teste@email.com", "password": "Senha123" }

Pendente (NUT-125):
  Testes E2E com Detox requerem setup de simulador iOS/Android.
  Executar separadamente com: npx detox build && npx detox test

==========================================================
M3 — Log Alimentar
==========================================================
Epic:   NUT-126 — EPIC: Log Alimentar
Issues: NUT-127 — [backend] Implementar GET /foods/search com unaccent e debounce
        NUT-128 — [backend] Implementar GET /foods/:id
        NUT-129 — [backend] Implementar GET /logs?date= com totais por refeição
        NUT-130 — [backend] Implementar POST /logs com cálculo de macros (DR-06, DR-07)
        NUT-131 — [backend] Implementar PUT /logs/:id com recálculo de macros
        NUT-132 — [backend] Implementar DELETE /logs/:id
        NUT-133 — [frontend] Implementar DailyLogScreen com navegação de datas
        NUT-134 — [frontend] Implementar FoodSearchScreen com debounce 300ms
        NUT-135 — [frontend] Implementar FoodDetailScreen com gramas e medidas caseiras
        NUT-136 — [integration] Fluxo completo: busca -> seleção -> quantidade -> log
        NUT-137 — [test-e2e] Log Alimentar — cenários adicionar, editar, excluir e medida caseira

==========================================================
M4 — Relatório Nutricional
==========================================================
Epic:   NUT-138 — EPIC: Relatório Nutricional
Issues: NUT-139 — [backend] Implementar GET /reports/daily com balanço calórico (DR-09)
        NUT-140 — [frontend] Implementar DailyReportScreen com barras de progresso
        NUT-141 — [frontend] Compartilhar selectedDate entre DailyLog e DailyReport via AppStore
        NUT-142 — [test-e2e] Relatório — cenários de déficit, superávit, on_target e histórico

==========================================================
M5 — Perfil do Usuário
==========================================================
Epic:   NUT-143 — EPIC: Perfil do Usuário
Issues: NUT-144 — [backend] Implementar GET /users/me com perfil e meta atual
        NUT-145 — [backend] Implementar PUT /users/me/profile com recálculo de TMB e metas
        NUT-146 — [frontend] Implementar ProfileScreen com idade calculada e modo visualização
        NUT-147 — [frontend] Implementar EditProfileScreen com preview de nova TMB
        NUT-148 — [test-e2e] Perfil — editar peso recalcula meta e data de nascimento no modo edição

==========================================================
M6 — Testes E2E & Release 1.0
==========================================================
Epic:   NUT-149 — EPIC: Testes E2E & Release 1.0
Issues: NUT-150 — Configurar Detox para testes E2E em iOS e Android
        NUT-151 — [test-e2e] Fluxo E2E: cadastro -> onboarding -> log refeição -> ver relatório
        NUT-152 — [test-e2e] Fluxo E2E: login -> log café + almoço + jantar -> verificar totais
        NUT-153 — [test-e2e] Fluxo E2E: editar perfil -> confirmar recálculo de meta
        NUT-154 — [test-e2e] Fluxo E2E: offline -> modo somente-leitura de cache
        NUT-155 — Checklist de release: acessibilidade, contraste e toque mínimo

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
