/**
 * Script para criação de issues no Linear — App Nutricional v1.0
 * Uso: node linear-create-issues.mjs [milestone_number]
 * Sem argumento: cria apenas labels e projetos
 */

const API_KEY = process.env.LINEAR_API_KEY;
if (!API_KEY) { console.error("Erro: variável LINEAR_API_KEY não definida."); process.exit(1); }
const TEAM_ID = "a7ed0576-0816-4ac9-8284-e6961e1ebbad";              // team: NUT
const BACKLOG_STATE_ID = "eee15839-2c7e-4185-ad27-1b074d066fb0";     // Backlog

async function gql(query, variables = {}) {
  const res = await fetch("https://api.linear.app/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": API_KEY,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors, null, 2));
  return json.data;
}

// ─── Labels ────────────────────────────────────────────────────────────────

const LABEL_DEFS = [
  { name: "frontend",    color: "#0066CC" },
  { name: "backend",     color: "#E8501A" },
  { name: "integration", color: "#7B2FBE" },
  { name: "test-unit",   color: "#DEAB09" },
  { name: "test-e2e",    color: "#18794E" },
  { name: "epic",        color: "#CC2222" },
];

async function createLabels() {
  console.log("\n📌 Criando labels...");
  const labels = {};

  // Get existing labels first
  const existing = await gql(`{ issueLabels { nodes { id name } } }`);
  for (const l of existing.issueLabels.nodes) {
    labels[l.name] = l.id;
  }

  for (const def of LABEL_DEFS) {
    if (labels[def.name]) {
      console.log(`  ✓ Label "${def.name}" já existe (${labels[def.name]})`);
      continue;
    }
    const data = await gql(`
      mutation($input: IssueLabelCreateInput!) {
        issueLabelCreate(input: $input) {
          success
          issueLabel { id name }
        }
      }
    `, { input: { name: def.name, color: def.color, teamId: TEAM_ID } });

    if (data.issueLabelCreate.success) {
      labels[def.name] = data.issueLabelCreate.issueLabel.id;
      console.log(`  ✓ Criada label "${def.name}"`);
    }
  }

  return labels;
}

// ─── Projects ──────────────────────────────────────────────────────────────

const MILESTONE_DEFS = [
  {
    name: "M1 — Infraestrutura & Setup",
    description: "Configuração do monorepo, banco de dados, CI e ambientes. Base técnica necessária para todos os milestones seguintes.",
  },
  {
    name: "M2 — Autenticação & Onboarding",
    description: "Cadastro, login (email/Google/Apple), recuperação de senha, fluxo de onboarding com dados corporais e cálculo inicial de TMB.",
  },
  {
    name: "M3 — Log Alimentar",
    description: "Busca de alimentos na base TACO, registro de refeições com cálculo automático de macros (gramas e medidas caseiras), edição e exclusão.",
  },
  {
    name: "M4 — Relatório Nutricional",
    description: "Dashboard diário com meta calórica, total consumido, déficit/superávit e barras de progresso por macro.",
  },
  {
    name: "M5 — Perfil do Usuário",
    description: "Visualização e edição de dados corporais com recálculo automático de TMB e metas nutricionais.",
  },
  {
    name: "M6 — Testes E2E & Release 1.0",
    description: "Configuração do Detox, suite de testes E2E cobrindo os fluxos principais, checklist de acessibilidade e release para App Store / Google Play.",
  },
];

async function createProjects() {
  console.log("\n📁 Criando projetos (milestones)...");
  const projects = {};

  for (const def of MILESTONE_DEFS) {
    const data = await gql(`
      mutation($input: ProjectCreateInput!) {
        projectCreate(input: $input) {
          success
          project { id name }
        }
      }
    `, {
      input: {
        name: def.name,
        description: def.description,
        teamIds: [TEAM_ID],
      },
    });

    if (data.projectCreate.success) {
      const p = data.projectCreate.project;
      projects[def.name] = p.id;
      console.log(`  ✓ Projeto "${p.name}" criado (${p.id})`);
    }
  }

  return projects;
}

// ─── Issue helpers ─────────────────────────────────────────────────────────

async function createIssue({ title, description, labelIds, projectId, parentId }) {
  const input = {
    title,
    description,
    teamId: TEAM_ID,
    stateId: BACKLOG_STATE_ID,
    labelIds: labelIds || [],
  };
  if (projectId) input.projectId = projectId;
  if (parentId) input.parentId = parentId;

  const data = await gql(`
    mutation($input: IssueCreateInput!) {
      issueCreate(input: $input) {
        success
        issue { id title identifier }
      }
    }
  `, { input });

  if (!data.issueCreate.success) throw new Error(`Falha ao criar issue: ${title}`);
  return data.issueCreate.issue;
}

// ─── Milestone 1: Infraestrutura & Setup ──────────────────────────────────

async function createMilestone1(projects, labels) {
  const projectId = projects["M1 — Infraestrutura & Setup"];
  console.log(`\n🏗️  Milestone 1: Infraestrutura & Setup (projeto ${projectId})`);

  // Epic
  const epic = await createIssue({
    title: "EPIC: Infraestrutura & Setup",
    description: `### Contexto
Configurar toda a base técnica do projeto antes de qualquer desenvolvimento de funcionalidade. Inclui monorepo, banco de dados com schema Prisma, seed da TACO, pipeline de CI e ambientes de deploy.

### Critérios de aceite (epic)
- [ ] Monorepo funcional com apps/mobile, apps/api e packages/shared
- [ ] PostgreSQL rodando localmente via Docker e no Railway (staging/prod)
- [ ] Schema Prisma com todas as models do data-model.md aplicadas
- [ ] Base TACO v7 importada com alimentos e medidas caseiras
- [ ] CI passando lint, typecheck e build em cada PR
- [ ] Ambientes staging e production deployados no Railway

### Referências técnicas
- Estrutura: app-nutricional.md (Estrutura de Diretórios)
- Schema: data-model.md (Schema Prisma completo)
- Stack: app-nutricional.md (Stack Tecnológica)
- Ambientes: app-nutricional.md (Ambientes)`,
    labelIds: [labels["epic"]],
    projectId,
  });
  console.log(`  ✓ Epic: ${epic.identifier} — ${epic.title}`);

  // Child issues
  const issues = [
    {
      title: "Configurar monorepo com apps/mobile, apps/api e packages/shared",
      description: `### Contexto
Estruturar o repositório como monorepo com workspaces npm. O frontend (React Native + Expo), o backend (Fastify) e o pacote compartilhado de tipos Zod ficam em pastas separadas mas no mesmo repositório.

### Critérios de aceite
- [ ] \`apps/mobile\` inicializado com Expo SDK 51 + TypeScript
- [ ] \`apps/api\` inicializado com Node.js 20 + Fastify 4 + TypeScript
- [ ] \`packages/shared\` com schemas Zod e tipos TS compartilhados
- [ ] Workspaces npm configurados em \`package.json\` raiz
- [ ] Scripts de \`dev\`, \`build\` e \`lint\` funcionando a partir da raiz

### Referências técnicas
- Estrutura: app-nutricional.md (Estrutura de Diretórios)
- Stack: app-nutricional.md (Stack Tecnológica)`,
      labelIds: [],
      projectId,
      parentId: epic.id,
    },
    {
      title: "Configurar PostgreSQL + Prisma com schema inicial e migrations",
      description: `### Contexto
Configurar o banco de dados PostgreSQL via Docker Compose para desenvolvimento local e provisionar no Railway para staging/prod. Implementar o schema Prisma completo conforme data-model.md e rodar a migration inicial.

### Critérios de aceite
- [ ] \`docker-compose.yml\` com serviço PostgreSQL 15 para desenvolvimento local
- [ ] Schema Prisma implementado conforme data-model.md: User, UserProfile, NutritionalGoal, Food, FoodMeasure, FoodLog
- [ ] Extensão \`unaccent\` habilitada no PostgreSQL (necessária para DR-11)
- [ ] Migration inicial aplicada com sucesso (\`npx prisma migrate dev\`)
- [ ] Índices criados: \`foods(name)\`, \`food_logs(user_id, log_date)\`
- [ ] Singleton do PrismaClient em \`apps/api/src/lib/prisma.ts\`

### Referências técnicas
- Schema: data-model.md (Schema Prisma)
- Diagrama ER: data-model.md (Diagrama ER)
- Backend: backend.md (Estrutura de Diretórios)
- Domain rule: domain-rules.md (DR-11 — extensão unaccent)`,
      labelIds: [labels["backend"]],
      projectId,
      parentId: epic.id,
    },
    {
      title: "Implementar seed da base TACO v7 com alimentos e medidas caseiras",
      description: `### Contexto
A base TACO (Tabela Brasileira de Composição de Alimentos, UNICAMP v7) deve ser importada como seed estático no banco. É a fonte de dados nutricional do app — sem ela, o log alimentar não funciona.

### Critérios de aceite
- [ ] Script \`prisma/seeds/taco.seed.ts\` implementado
- [ ] Lê \`prisma/seeds/data/taco.json\` com dados da TACO v7
- [ ] Faz upsert via \`prisma.food.upsert({ where: { tacoId } })\` (idempotente)
- [ ] Importa medidas caseiras em \`food_measures\` para cada alimento
- [ ] Seed executável via \`npx prisma db seed\`
- [ ] Executado no CI antes dos testes de integração

### Referências técnicas
- DA-02: app-nutricional.md (Decisão Arquitetural — TACO como seed estático)
- Schema: data-model.md (Food, FoodMeasure)
- Backend: backend.md (Seed da Base TACO)`,
      labelIds: [labels["backend"]],
      projectId,
      parentId: epic.id,
    },
    {
      title: "Configurar pipeline de CI com lint, typecheck e build",
      description: `### Contexto
Garantir qualidade de código a cada pull request através de pipeline automatizado. O CI deve bloquear merges com erros de tipo ou lint.

### Critérios de aceite
- [ ] CI configurado (GitHub Actions ou equivalente)
- [ ] Job de lint (ESLint) para \`apps/api\` e \`apps/mobile\`
- [ ] Job de typecheck (\`tsc --noEmit\`) para \`apps/api\` e \`packages/shared\`
- [ ] Job de build para \`apps/api\`
- [ ] Seed da TACO executado antes dos testes de integração
- [ ] Pipeline executa em PRs para \`main\` e \`develop\`

### Referências técnicas
- Ambientes: app-nutricional.md (Ambientes)
- Testes: backend.md (Testes)`,
      labelIds: [],
      projectId,
      parentId: epic.id,
    },
    {
      title: "Configurar ambientes staging e production no Railway",
      description: `### Contexto
Provisionar a infraestrutura de deploy no Railway para que o backend fique acessível externamente. Dois ambientes: staging (branch develop) e production (branch main).

### Critérios de aceite
- [ ] Projeto Railway criado com dois environments: staging e production
- [ ] Serviço PostgreSQL provisionado em cada environment
- [ ] Variável \`DATABASE_URL\` configurada nos environments
- [ ] Deploy automático no push para \`develop\` (staging) e \`main\` (production)
- [ ] Migrations rodadas automaticamente no deploy (\`prisma migrate deploy\`)
- [ ] Health check endpoint \`GET /health\` retornando 200

### Referências técnicas
- Ambientes: app-nutricional.md (Ambientes — tabela staging/production)`,
      labelIds: [],
      projectId,
      parentId: epic.id,
    },
  ];

  const created = [];
  for (const issue of issues) {
    const i = await createIssue(issue);
    created.push(i);
    console.log(`  ✓ ${i.identifier} — ${i.title}`);
  }

  return { epic, issues: created };
}

// ─── Milestone 2: Autenticação & Onboarding ───────────────────────────────

async function createMilestone2(projects, labels) {
  const projectId = projects["M2 — Autenticação & Onboarding"];
  console.log(`\n🔐  Milestone 2: Autenticação & Onboarding (projeto ${projectId})`);

  const epic = await createIssue({
    title: "EPIC: Autenticação & Onboarding",
    description: `### Contexto
Implementar o fluxo completo de autenticação (email/senha, Google, Apple) e o onboarding de coleta de dados corporais para cálculo da TMB inicial. Cobre os Requirements 1 e 2 do requirements.md.

### Critérios de aceite (epic)
- [ ] Todos os critérios de R1 (Autenticação) cobertos
- [ ] Todos os critérios de R2 (Onboarding) cobertos
- [ ] AuthStore configurado com persistência em SecureStore
- [ ] Refresh automático de token sem interrupção para o usuário
- [ ] Testes E2E passando para cadastro, login e sessão expirada

### Referências técnicas
- Requirements: requirements.md (R1 — Autenticação, R2 — Onboarding)
- API: api.md (Endpoints /auth/*)
- Frontend: frontend.md (Auth Stack, AuthStore)
- Backend: backend.md (Autenticação JWT, Middleware authenticate.ts)`,
    labelIds: [labels["epic"]],
    projectId,
  });
  console.log(`  ✓ Epic: ${epic.identifier} — ${epic.title}`);

  const issues = [
    {
      title: "[backend] Implementar POST /auth/register com validação Zod",
      description: `### Contexto
Endpoint de cadastro de novos usuários com e-mail e senha. Deve validar o payload, criar o hash da senha com bcrypt e retornar tokens JWT.

### Critérios de aceite
- [ ] WHEN nome, e-mail e senha válidos THEN cria conta e retorna \`{ accessToken, refreshToken, user }\` (201) (ref: requirements.md R1.1)
- [ ] WHEN e-mail já cadastrado THEN retorna 409 com "E-mail já cadastrado" sem revelar dados (ref: requirements.md R1.2)
- [ ] Validação Zod: nome ≥ 2 chars, e-mail válido, senha ≥ 8 chars com maiúscula e número
- [ ] Senha armazenada como hash bcrypt (nunca em texto plano)
- [ ] E-mail de verificação enviado via Nodemailer

### Referências técnicas
- Endpoint: \`POST /auth/register\` (api.md)
- Prisma model: \`User\` (data-model.md)
- Backend: \`auth.routes.ts\`, \`auth.service.ts\` (backend.md)`,
      labelIds: [labels["backend"]],
      projectId,
      parentId: epic.id,
    },
    {
      title: "[backend] Implementar POST /auth/login com bcrypt e JWT",
      description: `### Contexto
Endpoint de autenticação de usuários existentes. Compara senha informada com o hash armazenado via bcrypt e emite par de tokens JWT (access + refresh).

### Critérios de aceite
- [ ] WHEN credenciais corretas THEN retorna \`{ accessToken (15min), refreshToken (30d), user }\` (200)
- [ ] WHEN credenciais inválidas THEN retorna 401 (sem revelar qual campo está errado)
- [ ] Refresh token armazenado como hash na tabela \`refresh_tokens\`
- [ ] Access token payload: \`{ sub: userId, iat, exp }\`

### Referências técnicas
- Endpoint: \`POST /auth/login\` (api.md)
- Backend: backend.md (Autenticação JWT)
- Fluxo: app-nutricional.md (Fluxo de Autenticação — diagrama)`,
      labelIds: [labels["backend"]],
      projectId,
      parentId: epic.id,
    },
    {
      title: "[backend] Implementar POST /auth/google (OAuth2 via Passport.js)",
      description: `### Contexto
Autenticação via Google OAuth2. O app mobile obtém um \`idToken\` via Expo Auth Session e envia ao backend para validação e criação/autenticação da conta.

### Critérios de aceite
- [ ] WHEN token Google válido recebido THEN valida com Google e cria/autentica conta (ref: requirements.md R1.3)
- [ ] WHEN usuário novo THEN cria User com \`provider: "google"\` e retorna \`isNewUser: true\`
- [ ] WHEN usuário existente THEN autentica e retorna \`isNewUser: false\`
- [ ] Retorna mesmo formato de \`/auth/login\` (\`{ accessToken, refreshToken, user }\`)

### Referências técnicas
- Endpoint: \`POST /auth/google\` (api.md)
- DA-01: app-nutricional.md (Expo para Sign in with Apple/Google)
- Prisma: \`User.provider, User.providerId\` (data-model.md)`,
      labelIds: [labels["backend"]],
      projectId,
      parentId: epic.id,
    },
    {
      title: "[backend] Implementar POST /auth/apple (OAuth2 via Passport.js)",
      description: `### Contexto
Autenticação via Apple OAuth2. Obrigatório pela App Store para apps que oferecem outros métodos de login social. O backend recebe \`identityToken\`, \`authorizationCode\` e nome do usuário.

### Critérios de aceite
- [ ] WHEN token Apple válido recebido THEN valida e cria/autentica conta (ref: requirements.md R1.4)
- [ ] Suporta o fluxo onde Apple só envia o nome no primeiro login
- [ ] Retorna mesmo formato de \`/auth/google\`
- [ ] \`provider: "apple"\` gravado no User

### Referências técnicas
- Endpoint: \`POST /auth/apple\` (api.md)
- PRD: PRD-app-nutricional-cliente.md (F0 — Login social via Apple obrigatório pela App Store)`,
      labelIds: [labels["backend"]],
      projectId,
      parentId: epic.id,
    },
    {
      title: "[backend] Implementar POST /auth/refresh com rotação de token",
      description: `### Contexto
Renovação do access token usando o refresh token. Implementar rotação: cada refresh invalida o token antigo e emite um novo par, evitando reutilização de tokens roubados.

### Critérios de aceite
- [ ] WHEN refresh token válido THEN retorna novo par \`{ accessToken, refreshToken }\`
- [ ] Token antigo invalidado no banco após uso (rotação)
- [ ] WHEN refresh token inválido/expirado THEN retorna 401 (ref: requirements.md R1.7)
- [ ] Refresh token armazenado como hash (nunca texto plano)

### Referências técnicas
- Endpoint: \`POST /auth/refresh\` (api.md)
- Fluxo: app-nutricional.md (Fluxo de Autenticação — diagrama sequencial)
- Backend: backend.md (Autenticação JWT — refresh 30d)`,
      labelIds: [labels["backend"]],
      projectId,
      parentId: epic.id,
    },
    {
      title: "[backend] Implementar POST /auth/forgot-password com Nodemailer",
      description: `### Contexto
Fluxo de recuperação de senha por e-mail. Por segurança, a resposta deve ser sempre genérica independente de o e-mail existir ou não.

### Critérios de aceite
- [ ] WHEN e-mail cadastrado THEN envia link de redefinição por e-mail (ref: requirements.md R1.5)
- [ ] WHEN e-mail não cadastrado THEN retorna a mesma mensagem genérica (ref: requirements.md R1.6)
- [ ] Link de redefinição com token temporário (expira em 1h)
- [ ] Resposta: 200 com \`{ message: "Se o e-mail estiver cadastrado, você receberá as instruções." }\`

### Referências técnicas
- Endpoint: \`POST /auth/forgot-password\` (api.md)
- Backend: backend.md (lib/email.ts — wrapper Nodemailer)`,
      labelIds: [labels["backend"]],
      projectId,
      parentId: epic.id,
    },
    {
      title: "[frontend] Implementar LoginScreen com OAuth Google e Apple",
      description: `### Contexto
Tela de login com e-mail/senha e botões de login social. Primeiro ponto de contato do usuário com o app após a WelcomeScreen.

### Critérios de aceite
- [ ] Campos e-mail e senha com validação inline
- [ ] Estado de loading no botão "Entrar" durante autenticação
- [ ] Botão "Entrar com Google" inicia fluxo OAuth2 via expo-auth-session
- [ ] Botão "Entrar com Apple" inicia fluxo OAuth2 via expo-auth-session
- [ ] Link "Esqueci minha senha" navega para ForgotPasswordScreen
- [ ] Link "Criar conta" navega para RegisterScreen
- [ ] Tokens salvos no AuthStore (Zustand) após login bem-sucedido

### Referências técnicas
- Screen: frontend.md (LoginScreen)
- AuthStore: frontend.md (Estado Global — AuthStore)
- Navegação: frontend.md (Mapa de Navegação — Auth Stack)`,
      labelIds: [labels["frontend"]],
      projectId,
      parentId: epic.id,
    },
    {
      title: "[frontend] Implementar RegisterScreen com validação em tempo real",
      description: `### Contexto
Tela de cadastro com validação em tempo real usando React Hook Form + Zod. Feedback visual de força de senha.

### Critérios de aceite
- [ ] Campos: nome, e-mail, senha, confirmação de senha
- [ ] Validação Zod em tempo real (onChangeText) — sem aguardar submit
- [ ] Indicador de força da senha (fraca/média/forte)
- [ ] Botão "Criar conta" desabilitado enquanto há erros de validação (ref: e2e-bdd.md — Cadastro com senha fraca)
- [ ] Após cadastro bem-sucedido, redireciona para OnboardingScreen

### Referências técnicas
- Screen: frontend.md (RegisterScreen)
- Stack: frontend.md (React Hook Form + Zod)
- Critério: requirements.md R1.1`,
      labelIds: [labels["frontend"]],
      projectId,
      parentId: epic.id,
    },
    {
      title: "[frontend] Implementar ForgotPasswordScreen",
      description: `### Contexto
Tela simples com campo de e-mail para solicitar recuperação de senha. Exibe mensagem genérica de sucesso independente do resultado.

### Critérios de aceite
- [ ] Campo de e-mail com validação de formato
- [ ] Após submit, exibe sempre a mensagem genérica de sucesso
- [ ] Botão "Voltar ao login" navega para LoginScreen

### Referências técnicas
- Screen: frontend.md (ForgotPasswordScreen)
- Endpoint: \`POST /auth/forgot-password\` (api.md)
- Critérios: requirements.md R1.5, R1.6`,
      labelIds: [labels["frontend"]],
      projectId,
      parentId: epic.id,
    },
    {
      title: "[frontend] Implementar OnboardingScreen (fluxo em steps com TMB preview)",
      description: `### Contexto
Fluxo em steps coletando dados corporais obrigatórios (data de nascimento, sexo, altura, peso) e opcionais (% gordura). Exibe a TMB calculada antes do usuário confirmar.

### Critérios de aceite
- [ ] Fluxo em 5 steps: data de nascimento → sexo → altura → peso → % gordura (opcional)
- [ ] Botão "Continuar" desabilitado até campos obrigatórios preenchidos (ref: requirements.md R2.2)
- [ ] Step de % gordura tem botão "Pular" (campo opcional)
- [ ] Tela de confirmação exibe TMB calculada antes de salvar (ref: requirements.md R2.3, R2.4)
- [ ] Após confirmar, chama \`POST /onboarding/profile\` e redireciona para tela principal (ref: requirements.md R2.5)
- [ ] Usuário que já completou onboarding não vê esse fluxo (ref: requirements.md R2.6)

### Referências técnicas
- Screen: frontend.md (OnboardingScreen)
- Domain rules: domain-rules.md (DR-01 Mifflin-St Jeor, DR-02 Katch-McArdle)
- Critérios: requirements.md R2`,
      labelIds: [labels["frontend"]],
      projectId,
      parentId: epic.id,
    },
    {
      title: "[frontend] Configurar AuthStore com Zustand e persistência em SecureStore",
      description: `### Contexto
Store global de autenticação usando Zustand. Tokens JWT armazenados em Expo SecureStore (criptografado). Na inicialização do app, tenta validar o refresh token antes de redirecionar.

### Critérios de aceite
- [ ] AuthStore implementado conforme interface em frontend.md
- [ ] Tokens persistidos em SecureStore na inicialização e ao fazer login
- [ ] Na inicialização: lê tokens do SecureStore, tenta refresh se access token expirado
- [ ] \`logout()\` limpa tokens do SecureStore e redireciona para Login
- [ ] \`isAuthenticated\` derivado de \`accessToken !== null\`

### Referências técnicas
- Estado Global: frontend.md (AuthStore — interface TypeScript)
- Stack: frontend.md (Expo SecureStore)
- Fluxo: app-nutricional.md (Fluxo de Autenticação)`,
      labelIds: [labels["frontend"]],
      projectId,
      parentId: epic.id,
    },
    {
      title: "[frontend] Configurar interceptor Axios para refresh automático de token",
      description: `### Contexto
Interceptor no Axios que detecta respostas 401, tenta renovar o token via \`POST /auth/refresh\` e reexecuta a requisição original. Se o refresh falhar, faz logout.

### Critérios de aceite
- [ ] Interceptor de resposta configurado na instância Axios
- [ ] WHEN 401 recebido THEN tenta \`POST /auth/refresh\` silenciosamente
- [ ] WHEN refresh bem-sucedido THEN reexecuta a requisição original com novo token (ref: requirements.md R1.7)
- [ ] WHEN refresh falha THEN chama \`AuthStore.logout()\`
- [ ] Fila de requisições concorrentes aguarda o refresh em andamento (sem múltiplos refreshes simultâneos)

### Referências técnicas
- Tratamento de Erros: frontend.md (401 → interceptor Axios)
- AuthStore: frontend.md (setTokens)
- Fluxo: app-nutricional.md (Fluxo de Autenticação — diagrama sequencial)`,
      labelIds: [labels["frontend"]],
      projectId,
      parentId: epic.id,
    },
    {
      title: "[test-e2e] Auth — fluxos de cadastro, login, sessão expirada e OAuth",
      description: `### Contexto
Suite de testes E2E cobrindo todos os cenários de autenticação definidos no e2e-bdd.md. Implementados com Detox.

### Critérios de aceite
Os cenários Gherkin abaixo devem estar implementados e passando:

\`\`\`gherkin
Scenario: Cadastro bem-sucedido
  Given o usuário está na tela de cadastro
  When ele preenche nome, e-mail e senha válidos e toca "Criar conta"
  Then ele deve ser redirecionado para o onboarding
  And um e-mail de verificação deve ser enviado

Scenario: Cadastro com e-mail já existente
  Given existe uma conta com o e-mail "joao@email.com"
  When o usuário tenta cadastrar com o mesmo e-mail
  Then deve ver a mensagem "E-mail já cadastrado"

Scenario: Cadastro com senha fraca
  Given o usuário está na tela de cadastro
  When ele preenche a senha "123"
  Then o botão "Criar conta" deve estar desabilitado

Scenario: Login bem-sucedido
  Given existe uma conta com e-mail e senha válidos
  When o usuário preenche as credenciais corretas e toca "Entrar"
  Then deve ser redirecionado para a tela principal (DailyLog)

Scenario: Sessão expirada
  Given o access token expirou
  When ele tenta acessar qualquer tela protegida
  Then o app deve silenciosamente renovar o token via refresh token
\`\`\`

### Referências técnicas
- Cenários: e2e-bdd.md (Feature: Autenticação, Feature: Onboarding)
- Ferramenta: Detox (backend.md — Testes E2E)
- Critérios: requirements.md R1, R2`,
      labelIds: [labels["test-e2e"]],
      projectId,
      parentId: epic.id,
    },
  ];

  const created = [];
  for (const issue of issues) {
    const i = await createIssue(issue);
    created.push(i);
    console.log(`  ✓ ${i.identifier} — ${i.title}`);
  }

  return { epic, issues: created };
}

// ─── Milestone 3: Log Alimentar ───────────────────────────────────────────

async function createMilestone3(projects, labels) {
  const projectId = projects["M3 — Log Alimentar"];
  console.log(`\n🥗  Milestone 3: Log Alimentar (projeto ${projectId})`);

  const epic = await createIssue({
    title: "EPIC: Log Alimentar",
    description: `### Contexto
Funcionalidade principal do app: busca de alimentos na base TACO, seleção de quantidade (gramas ou medidas caseiras), cálculo automático de macros e registro no log diário. Cobre o Requirement 4 do requirements.md.

### Critérios de aceite (epic)
- [ ] Todos os critérios de R4 (Log Alimentar) cobertos
- [ ] Busca com unaccent + debounce 300ms funcionando (DR-11)
- [ ] Cálculo de macros por gramagem (DR-06) e medidas caseiras (DR-07)
- [ ] Log organizado por refeição (breakfast, lunch, dinner, snack)
- [ ] Edição e exclusão de itens com recálculo em tempo real (R4.5, R4.6)

### Referências técnicas
- Requirements: requirements.md (R4 — Log Alimentar)
- API: api.md (/foods/*, /logs)
- Frontend: frontend.md (DailyLogScreen, FoodSearchScreen, FoodDetailScreen)
- Domain rules: domain-rules.md (DR-06, DR-07, DR-08, DR-11)
- Prisma: data-model.md (Food, FoodMeasure, FoodLog)`,
    labelIds: [labels["epic"]],
    projectId,
  });
  console.log(`  ✓ Epic: ${epic.identifier} — ${epic.title}`);

  const issues = [
    {
      title: "[backend] Implementar GET /foods/search com unaccent e debounce",
      description: `### Contexto
Endpoint de busca de alimentos na base TACO. Deve ser insensível a maiúsculas e acentos (ex: buscar "arroz" encontra "Arroz branco cozido").

### Critérios de aceite
- [ ] Query param \`q\` obrigatório (mínimo 2 caracteres)
- [ ] Busca insensível a maiúsculas e acentos usando extensão \`unaccent\` (ref: domain-rules.md DR-11)
- [ ] Resultados ordenados: match exato primeiro, depois por nome
- [ ] Query param \`limit\` (default 10, máx 30)
- [ ] Resposta inclui \`measures[]\` com medidas caseiras de cada alimento
- [ ] WHEN alimento não encontrado THEN retorna lista vazia (não 404) (ref: requirements.md R4.8)

### Referências técnicas
- Endpoint: \`GET /foods/search\` (api.md)
- Domain rule: domain-rules.md (DR-11 — SQL com unaccent)
- Prisma: data-model.md (Food, FoodMeasure)
- Frontend: frontend.md (useFoodSearch — debounce 300ms no hook)`,
      labelIds: [labels["backend"]],
      projectId,
      parentId: epic.id,
    },
    {
      title: "[backend] Implementar GET /foods/:id",
      description: `### Contexto
Endpoint para buscar os detalhes completos de um alimento pelo ID, incluindo todas as medidas caseiras. Usado quando o usuário seleciona um item na FoodSearchScreen.

### Critérios de aceite
- [ ] Retorna todos os campos nutricionais do alimento (caloriesPer100g, proteinPer100g, fatPer100g, carbPer100g)
- [ ] Retorna array \`measures[]\` com todas as medidas caseiras
- [ ] WHEN alimento não existe THEN retorna 404

### Referências técnicas
- Endpoint: \`GET /foods/:id\` (api.md)
- Prisma: data-model.md (Food, FoodMeasure)`,
      labelIds: [labels["backend"]],
      projectId,
      parentId: epic.id,
    },
    {
      title: "[backend] Implementar GET /logs?date= com totais por refeição",
      description: `### Contexto
Endpoint que retorna os logs do usuário para um dia específico, organizados por refeição, com totais do dia. Usado na DailyLogScreen.

### Critérios de aceite
- [ ] Query param \`date\` no formato YYYY-MM-DD (default: hoje)
- [ ] Resposta organizada por refeição: breakfast, lunch, dinner, snack
- [ ] Totais do dia calculados via SUM dos macros desnormalizados (ref: domain-rules.md DR-08)
- [ ] Filtra apenas logs do usuário autenticado (req.user.id)
- [ ] WHEN dia sem registros THEN retorna estrutura vazia com totais zerados (ref: requirements.md R4.7)

### Referências técnicas
- Endpoint: \`GET /logs\` (api.md — response completo)
- Domain rule: domain-rules.md (DR-08 — totais por refeição e dia)
- Prisma: data-model.md (FoodLog — índice user_id + log_date)`,
      labelIds: [labels["backend"]],
      projectId,
      parentId: epic.id,
    },
    {
      title: "[backend] Implementar POST /logs com cálculo de macros (DR-06, DR-07)",
      description: `### Contexto
Endpoint central do app: registra um alimento no log do usuário com cálculo automático de macros. Suporta gramas (DR-06) e medidas caseiras (DR-07). Macros são desnormalizados no food_log (DA-04).

### Critérios de aceite
- [ ] Body: \`{ foodId, mealType, quantity, unit, foodMeasureId?, date }\`
- [ ] WHEN unit = "g" THEN calcula macros proporcionalmente (ref: domain-rules.md DR-06)
- [ ] WHEN unit = "measure" THEN converte para gramas via foodMeasure.gramsEquivalent e aplica DR-06 (ref: domain-rules.md DR-07)
- [ ] Macros salvos desnormalizados no food_log (calories, protein_g, fat_g, carb_g) (ref: app-nutricional.md DA-04)
- [ ] WHEN foodId não existe THEN retorna 404 com FoodNotFoundError
- [ ] Valores arredondados para 1 casa decimal (ref: domain-rules.md DR-06)
- [ ] Retorna 201 com o log criado incluindo macros calculados

### Referências técnicas
- Endpoint: \`POST /logs\` (api.md)
- Calculator: backend.md (food-macro.calculator.ts — código completo)
- Domain rules: domain-rules.md (DR-06, DR-07)
- Fluxo: app-nutricional.md (Fluxo de Dados — Registro de Alimento)`,
      labelIds: [labels["backend"]],
      projectId,
      parentId: epic.id,
    },
    {
      title: "[backend] Implementar PUT /logs/:id com recálculo de macros",
      description: `### Contexto
Permite ao usuário editar a quantidade de um item já registrado no log. Recalcula os macros com base na nova quantidade.

### Critérios de aceite
- [ ] Body: \`{ quantity, unit }\`
- [ ] Recalcula macros com nova quantidade usando food-macro.calculator (ref: requirements.md R4.5)
- [ ] WHEN log pertence a outro usuário THEN retorna 403
- [ ] WHEN log não existe THEN retorna 404
- [ ] Retorna 200 com item atualizado e macros recalculados

### Referências técnicas
- Endpoint: \`PUT /logs/:id\` (api.md)
- Domain rule: domain-rules.md (DR-06, DR-07)`,
      labelIds: [labels["backend"]],
      projectId,
      parentId: epic.id,
    },
    {
      title: "[backend] Implementar DELETE /logs/:id",
      description: `### Contexto
Remove um item do log alimentar. Verificação de ownership para evitar que usuários deletem logs de outros.

### Critérios de aceite
- [ ] WHEN log pertence ao usuário autenticado THEN deleta e retorna 204 (ref: requirements.md R4.6)
- [ ] WHEN log pertence a outro usuário THEN retorna 403
- [ ] WHEN log não existe THEN retorna 404

### Referências técnicas
- Endpoint: \`DELETE /logs/:id\` (api.md)
- Middleware: backend.md (authenticate.ts — req.user.id)`,
      labelIds: [labels["backend"]],
      projectId,
      parentId: epic.id,
    },
    {
      title: "[frontend] Implementar DailyLogScreen com navegação de datas",
      description: `### Contexto
Tela principal do app (tab Home). Exibe o log do dia atual organizado por refeição com navegação temporal. Mini-card de resumo calórico com atalho para o Relatório.

### Critérios de aceite
- [ ] Navegação de datas no header (← data anterior | hoje | data seguinte →)
- [ ] Data selecionada compartilhada via AppStore (Zustand) com DailyReportScreen
- [ ] Mini-card de resumo calórico (total/meta) com toque navegando para Report
- [ ] Seções por refeição: Café da Manhã, Almoço, Jantar, Lanche — cada uma com botão "+ Add"
- [ ] Swipe-to-delete em itens do log (ref: e2e-bdd.md — Excluir item do log)
- [ ] Toque em item abre bottom sheet para edição de quantidade (ref: requirements.md R4.5)
- [ ] "+ Add" abre FoodSearchScreen como modal com refeição pré-selecionada
- [ ] WHEN data anterior THEN exibe logs daquele dia (ref: requirements.md R4.7)

### Referências técnicas
- Screen: frontend.md (DailyLogScreen — layout ASCII)
- Estado: frontend.md (AppStore — selectedDate)
- Query: frontend.md (useDailyLog — GET /logs?date=)`,
      labelIds: [labels["frontend"]],
      projectId,
      parentId: epic.id,
    },
    {
      title: "[frontend] Implementar FoodSearchScreen com debounce 300ms",
      description: `### Contexto
Modal de busca de alimentos. Exibe sugestões em tempo real com debounce de 300ms para evitar requisições excessivas. Estados de loading (skeleton) e vazio.

### Critérios de aceite
- [ ] Input de busca com debounce de 300ms (ref: requirements.md R4.1, domain-rules.md DR-11)
- [ ] Busca só dispara com ≥ 2 caracteres
- [ ] Loading state: skeleton list enquanto a API responde
- [ ] Estado vazio: "Nenhum alimento encontrado" (ref: requirements.md R4.8, e2e-bdd.md — Busca sem resultados)
- [ ] Lista com nome, calorias/100g e categoria de cada alimento
- [ ] Seleção de alimento navega para FoodDetailScreen

### Referências técnicas
- Screen: frontend.md (FoodSearchScreen)
- Query: frontend.md (useFoodSearch — GET /foods/search)
- Cenário E2E: e2e-bdd.md (Busca de alimento com debounce)`,
      labelIds: [labels["frontend"]],
      projectId,
      parentId: epic.id,
    },
    {
      title: "[frontend] Implementar FoodDetailScreen com gramas e medidas caseiras",
      description: `### Contexto
Modal de seleção de quantidade após escolher um alimento. Suporta dois modos: gramas (input numérico) ou medidas caseiras (dropdown). Preview em tempo real dos macros calculados.

### Critérios de aceite
- [ ] Exibe nome do alimento e tabela nutricional por 100g
- [ ] Toggle entre modo "gramas" (input numérico) e "medidas caseiras" (dropdown) (ref: requirements.md R4.3)
- [ ] Dropdown de medidas caseiras carregado da API (food.measures[])
- [ ] Preview em tempo real dos macros calculados conforme quantidade muda (ref: e2e-bdd.md — preview 192 kcal)
- [ ] Botão "Adicionar ao log" chama \`POST /logs\` com foodId, quantity, unit, foodMeasureId e mealType
- [ ] WHEN registro confirmado THEN invalida queries \`['logs', date]\` e \`['report', date]\`

### Referências técnicas
- Screen: frontend.md (FoodDetailScreen)
- Endpoint: \`POST /logs\` (api.md)
- Domain rules: domain-rules.md (DR-06, DR-07)
- Cenário E2E: e2e-bdd.md (Adicionar alimento por gramagem, Adicionar por medida caseira)`,
      labelIds: [labels["frontend"]],
      projectId,
      parentId: epic.id,
    },
    {
      title: "[integration] Fluxo completo: busca → seleção → quantidade → log",
      description: `### Contexto
Teste de integração end-to-end do fluxo principal do Log Alimentar: desde a busca do alimento na API até o registro no banco e a atualização do relatório no frontend.

### Critérios de aceite
- [ ] Usuário autenticado busca "arroz branco" → recebe sugestões da TACO
- [ ] Seleciona "Arroz, branco, cozido" → navega para FoodDetailScreen com dados corretos
- [ ] Informa 150g → preview exibe "192 kcal · P: 3.8g · G: 0.3g · C: 42.2g" (ref: e2e-bdd.md)
- [ ] Confirma → POST /logs retorna 201 com macros calculados
- [ ] DailyLogScreen atualiza lista da refeição imediatamente (invalidação de cache)
- [ ] Mini-card de resumo atualiza total de calorias do dia

### Referências técnicas
- Fluxo: app-nutricional.md (Fluxo de Dados — Registro de Alimento — diagrama)
- Queries: frontend.md (useDailyLog, useDailyReport — invalidação)
- Cenário: e2e-bdd.md (Adicionar alimento por gramagem)`,
      labelIds: [labels["integration"]],
      projectId,
      parentId: epic.id,
    },
    {
      title: "[test-e2e] Log Alimentar — cenários adicionar, editar, excluir e medida caseira",
      description: `### Contexto
Suite de testes E2E cobrindo todos os cenários do Log Alimentar definidos em e2e-bdd.md. Implementados com Detox.

### Critérios de aceite
Os cenários Gherkin abaixo devem estar implementados e passando:

\`\`\`gherkin
Scenario: Adicionar alimento por gramagem
  Given o usuário está na tela principal do dia atual
  When ele toca "+ Add" na seção "Almoço"
  And digita "arroz branco" no campo de busca
  Then deve ver sugestões contendo "Arroz, branco, cozido"
  When seleciona e informa "150" gramas
  Then deve ver o preview "192 kcal · P: 3.8g · G: 0.3g · C: 42.2g"
  When toca "Adicionar ao log"
  Then o item deve aparecer no Almoço com os macros corretos
  And o total de calorias do dia deve ser atualizado

Scenario: Adicionar alimento por medida caseira
  Given o usuário está adicionando "Azeite de oliva"
  When ele seleciona "colher de sopa" (13g) e informa quantidade "2"
  Then o preview deve mostrar os macros equivalentes a 26g de azeite

Scenario: Busca sem resultados
  When o usuário digita "xyzabc123"
  Then deve ver "Nenhum alimento encontrado"

Scenario: Editar quantidade de item registrado
  Given existe um log de "Ovo frito 60g" no café da manhã
  When o usuário altera a quantidade para "90g" e confirma
  Then os macros do item devem ser recalculados para 90g
  And o total do dia deve ser atualizado

Scenario: Excluir item do log
  Given existe um log de "Pão francês 50g" no café da manhã
  When o usuário faz swipe-to-delete e confirma
  Then o item deve ser removido e o total de calorias diminuir
\`\`\`

### Referências técnicas
- Cenários: e2e-bdd.md (Feature: Log Alimentar)
- Requirements: requirements.md (R4.1 a R4.8)`,
      labelIds: [labels["test-e2e"]],
      projectId,
      parentId: epic.id,
    },
  ];

  const created = [];
  for (const issue of issues) {
    const i = await createIssue(issue);
    created.push(i);
    console.log(`  ✓ ${i.identifier} — ${i.title}`);
  }

  return { epic, issues: created };
}

// ─── Milestone 4: Relatório Nutricional ───────────────────────────────────

async function createMilestone4(projects, labels) {
  const projectId = projects["M4 — Relatório Nutricional"];
  console.log(`\n📊  Milestone 4: Relatório Nutricional (projeto ${projectId})`);

  const epic = await createIssue({
    title: "EPIC: Relatório Nutricional",
    description: `### Contexto
Dashboard diário com comparação entre consumo e meta calórica. Exibe déficit/superávit com indicação visual por cor e barras de progresso por macro. Cobre o Requirement 5 do requirements.md.

### Critérios de aceite (epic)
- [ ] Todos os critérios de R5 (Relatório Nutricional) cobertos
- [ ] Balanço calórico calculado conforme DR-09
- [ ] Atualização em tempo real após mutações no log (R5.2)
- [ ] Histórico consultável por data (R5.5)
- [ ] Data compartilhada com DailyLogScreen via AppStore

### Referências técnicas
- Requirements: requirements.md (R5 — Relatório Nutricional)
- API: api.md (GET /reports/daily)
- Domain rule: domain-rules.md (DR-09 — Déficit e superávit)
- Frontend: frontend.md (DailyReportScreen, AppStore)`,
    labelIds: [labels["epic"]],
    projectId,
  });
  console.log(`  ✓ Epic: ${epic.identifier} — ${epic.title}`);

  const issues = [
    {
      title: "[backend] Implementar GET /reports/daily com balanço calórico (DR-09)",
      description: `### Contexto
Endpoint que agrega os logs do dia e compara com a meta do usuário. Calcula balanço calórico com status semântico (deficit/surplus/on_target).

### Critérios de aceite
- [ ] Query param \`date\` em YYYY-MM-DD (default: hoje)
- [ ] Retorna \`goal\` (meta atual do usuário), \`consumed\` (soma dos logs do dia) e \`balance\`
- [ ] Balanço: \`calorias_consumidas − meta_calorica\` (ref: domain-rules.md DR-09)
- [ ] Status: "deficit" (<-50), "surplus" (>+50), "on_target" (±50) (ref: domain-rules.md DR-09)
- [ ] Retorna \`progress\` com percentual por macro (consumed/goal)
- [ ] WHEN dia sem registros THEN consumed = zeros e balance = -meta (ref: e2e-bdd.md — Relatório de dia sem registros)
- [ ] Utiliza macros desnormalizados do food_log (apenas SUM, sem cálculo dinâmico) (ref: app-nutricional.md DA-04)

### Referências técnicas
- Endpoint: \`GET /reports/daily\` (api.md — response completo com progress)
- Domain rule: domain-rules.md (DR-09, DR-08)
- Prisma: data-model.md (FoodLog — índice user_id + log_date, NutritionalGoal)`,
      labelIds: [labels["backend"]],
      projectId,
      parentId: epic.id,
    },
    {
      title: "[frontend] Implementar DailyReportScreen com barras de progresso",
      description: `### Contexto
Tela de relatório (tab Relatório) com card central de calorias e barras de progresso por macro. Cores refletem o status do balanço calórico.

### Critérios de aceite
- [ ] Card central: total consumido / meta + percentual + balanço em kcal
- [ ] Cor do card: verde (déficit), vermelho (superávit), azul (on_target) (ref: requirements.md R5.3, R5.4)
- [ ] Barras de progresso para Proteína, Gordura e Carboidrato com valores em gramas (ref: requirements.md R5.6)
- [ ] Mesma navegação de datas da DailyLogScreen via AppStore.selectedDate
- [ ] Atualiza automaticamente quando logs são adicionados/editados/removidos (ref: requirements.md R5.2)
- [ ] WHEN data anterior THEN exibe relatório histórico daquele dia (ref: requirements.md R5.5)

### Referências técnicas
- Screen: frontend.md (DailyReportScreen — layout ASCII)
- Query: frontend.md (useDailyReport — GET /reports/daily)
- Estado: frontend.md (AppStore — selectedDate compartilhado)
- Domain rule: domain-rules.md (DR-09)`,
      labelIds: [labels["frontend"]],
      projectId,
      parentId: epic.id,
    },
    {
      title: "[frontend] Compartilhar selectedDate entre DailyLog e DailyReport via AppStore",
      description: `### Contexto
A navegação de datas deve ser sincronizada entre as duas abas (Home e Relatório). Quando o usuário muda a data na DailyLogScreen, a DailyReportScreen deve refletir a mesma data e vice-versa.

### Critérios de aceite
- [ ] AppStore implementado com \`selectedDate: string\` e \`setSelectedDate()\` (ref: frontend.md)
- [ ] DailyLogScreen lê e escreve em AppStore.selectedDate
- [ ] DailyReportScreen lê AppStore.selectedDate para suas queries
- [ ] Mudança de data em qualquer tela reflete na outra
- [ ] Data inicial: dia de hoje no formato YYYY-MM-DD

### Referências técnicas
- Estado Global: frontend.md (AppStore — interface TypeScript)
- Screens: frontend.md (DailyLogScreen, DailyReportScreen)`,
      labelIds: [labels["frontend"]],
      projectId,
      parentId: epic.id,
    },
    {
      title: "[test-e2e] Relatório — cenários de déficit, superávit, on_target e histórico",
      description: `### Contexto
Suite de testes E2E cobrindo os cenários do Relatório Nutricional definidos em e2e-bdd.md.

### Critérios de aceite
Os cenários Gherkin abaixo devem estar implementados e passando:

\`\`\`gherkin
Scenario: Relatório com déficit calórico
  Given o usuário tem meta de 2300 kcal
  And registrou alimentos totalizando 1450 kcal
  When ele acessa a aba "Relatório"
  Then deve ver "1450 / 2300 kcal"
  And a indicação "-850 kcal (déficit)" em verde
  And barras de progresso para proteína, gordura e carboidrato

Scenario: Relatório com superávit calórico
  Given o usuário registrou 2600 kcal com meta de 2300
  When ele acessa a aba "Relatório"
  Then deve ver "+300 kcal (superávit)" em vermelho

Scenario: Consulta de relatório histórico
  Given o usuário tem logs em "2025-01-10"
  When ele navega para essa data no relatório
  Then deve ver o resumo correto daquele dia

Scenario: Relatório de dia sem registros
  Given o usuário não tem logs em "2025-01-01"
  When ele navega para essa data
  Then deve ver "0 / 2300 kcal" e macros zerados
\`\`\`

### Referências técnicas
- Cenários: e2e-bdd.md (Feature: Relatório Nutricional)
- Requirements: requirements.md (R5.1 a R5.6)
- Domain rule: domain-rules.md (DR-09)`,
      labelIds: [labels["test-e2e"]],
      projectId,
      parentId: epic.id,
    },
  ];

  const created = [];
  for (const issue of issues) {
    const i = await createIssue(issue);
    created.push(i);
    console.log(`  ✓ ${i.identifier} — ${i.title}`);
  }

  return { epic, issues: created };
}

// ─── Milestone 5: Perfil do Usuário ───────────────────────────────────────

async function createMilestone5(projects, labels) {
  const projectId = projects["M5 — Perfil do Usuário"];
  console.log(`\n👤  Milestone 5: Perfil do Usuário (projeto ${projectId})`);

  const epic = await createIssue({
    title: "EPIC: Perfil do Usuário",
    description: `### Contexto
Telas de visualização e edição dos dados corporais do usuário. Edições recalculam automaticamente a TMB e as metas nutricionais. Cobre o Requirement 3 do requirements.md.

### Critérios de aceite (epic)
- [ ] Todos os critérios de R3 (Perfil do Usuário) cobertos
- [ ] Idade calculada dinamicamente (DR-03) — não armazenada
- [ ] Data de nascimento visível apenas no modo de edição (R3.2, R3.3)
- [ ] Recálculo automático de TMB e metas ao salvar (R3.4, DR-05)
- [ ] Preview da nova TMB antes de confirmar alterações

### Referências técnicas
- Requirements: requirements.md (R3 — Perfil do Usuário)
- API: api.md (/users/me, PUT /users/me/profile)
- Frontend: frontend.md (ProfileScreen, EditProfileScreen)
- Domain rules: domain-rules.md (DR-01 a DR-05)`,
    labelIds: [labels["epic"]],
    projectId,
  });
  console.log(`  ✓ Epic: ${epic.identifier} — ${epic.title}`);

  const issues = [
    {
      title: "[backend] Implementar GET /users/me com perfil e meta atual",
      description: `### Contexto
Retorna os dados completos do usuário autenticado: informações de conta, perfil corporal e meta nutricional atual. A idade é calculada no servidor, não armazenada.

### Critérios de aceite
- [ ] Retorna \`{ id, name, email, emailVerified, profile, currentGoal }\`
- [ ] \`profile.age\` calculado dinamicamente a partir de \`birth_date\` (ref: domain-rules.md DR-03)
- [ ] \`currentGoal\` = registro mais recente em \`nutritional_goals\` (ORDER BY calculated_at DESC LIMIT 1)
- [ ] WHEN usuário não tem perfil (onboarding incompleto) THEN \`profile: null\`
- [ ] Requer autenticação (middleware authenticate)

### Referências técnicas
- Endpoint: \`GET /users/me\` (api.md — response completo)
- Domain rule: domain-rules.md (DR-03 — cálculo de idade)
- Prisma: data-model.md (User, UserProfile, NutritionalGoal)`,
      labelIds: [labels["backend"]],
      projectId,
      parentId: epic.id,
    },
    {
      title: "[backend] Implementar PUT /users/me/profile com recálculo de TMB e metas",
      description: `### Contexto
Endpoint de atualização dos dados corporais. Recalcula TMB e metas nutricionais imediatamente após salvar. Gera um novo registro em NutritionalGoal (histórico preservado).

### Critérios de aceite
- [ ] Campos aceitos: birthDate, sex, heightCm, weightKg, bodyFatPercent (nullable)
- [ ] Validação de ranges conforme DR-10: peso (30-300kg), altura (100-250cm), % gordura (3-70%), data nascimento (10-120 anos atrás)
- [ ] Recalcula TMB: Mifflin-St Jeor (sem % gordura) ou Katch-McArdle (com % gordura) (ref: DR-01, DR-02)
- [ ] Recalcula metas com distribuição fixa (ref: domain-rules.md DR-04)
- [ ] Gera novo registro em NutritionalGoal (não sobrescreve) (ref: domain-rules.md DR-05)
- [ ] Retorna perfil atualizado + nova meta

### Referências técnicas
- Endpoint: \`PUT /users/me/profile\` (api.md)
- Calculator: backend.md (tmb.calculator.ts, macro-goal.calculator.ts — código completo)
- Domain rules: domain-rules.md (DR-01 a DR-05, DR-10)`,
      labelIds: [labels["backend"]],
      projectId,
      parentId: epic.id,
    },
    {
      title: "[frontend] Implementar ProfileScreen com idade calculada e modo visualização",
      description: `### Contexto
Tela de visualização do perfil (tab Perfil). Exibe dados corporais com idade calculada a partir da data de nascimento. A data de nascimento em si fica oculta nesse modo.

### Critérios de aceite
- [ ] Exibe: nome, e-mail, idade calculada, sexo, altura, peso, % gordura, TMB (ref: requirements.md R3.1)
- [ ] WHEN modo visualização THEN exibe idade calculada (sem data de nascimento) (ref: requirements.md R3.2)
- [ ] Botão "Editar" navega para EditProfileScreen
- [ ] Botão "Sair" com dialog de confirmação → chama AuthStore.logout()
- [ ] Query \`useCurrentUser\` (GET /users/me) com cache key \`['user', 'me']\`

### Referências técnicas
- Screen: frontend.md (ProfileScreen)
- Query: frontend.md (useCurrentUser)
- Domain rule: domain-rules.md (DR-03 — idade calculada)
- Critérios: requirements.md R3.1, R3.2, R3.5`,
      labelIds: [labels["frontend"]],
      projectId,
      parentId: epic.id,
    },
    {
      title: "[frontend] Implementar EditProfileScreen com preview de nova TMB",
      description: `### Contexto
Tela de edição com formulário pré-preenchido. Exibe preview da nova TMB em tempo real conforme o usuário altera os campos, antes de salvar.

### Critérios de aceite
- [ ] Formulário com todos os campos do perfil pré-preenchidos
- [ ] WHEN modo edição THEN campo "Data de nascimento" visível e editável (ref: requirements.md R3.3)
- [ ] Preview da nova TMB calculado localmente em tempo real (sem chamar API ainda)
- [ ] Validação de ranges antes de habilitar o botão "Salvar" (ref: domain-rules.md DR-10)
- [ ] Após salvar (\`PUT /users/me/profile\`): invalida query \`['user', 'me']\` e navega de volta
- [ ] WHEN salvo THEN DailyReportScreen reflete nova meta no próximo relatório (ref: requirements.md R3.4)

### Referências técnicas
- Screen: frontend.md (EditProfileScreen)
- Endpoint: \`PUT /users/me/profile\` (api.md)
- Domain rules: domain-rules.md (DR-01, DR-02, DR-04 — para preview local)
- Critérios: requirements.md R3.3, R3.4`,
      labelIds: [labels["frontend"]],
      projectId,
      parentId: epic.id,
    },
    {
      title: "[test-e2e] Perfil — editar peso recalcula meta e data de nascimento no modo edição",
      description: `### Contexto
Suite de testes E2E cobrindo os cenários de Perfil do Usuário definidos em e2e-bdd.md.

### Critérios de aceite
Os cenários Gherkin abaixo devem estar implementados e passando:

\`\`\`gherkin
Scenario: Atualizar peso recalcula metas
  Given o usuário está na tela de edição de perfil
  And o perfil atual tem peso "82kg"
  When ele altera o peso para "80kg" e salva
  Then a TMB deve ser recalculada
  And a meta calórica na tela principal deve refletir o novo valor

Scenario: Visualização de idade calculada
  Given o usuário nasceu em "1990-05-15"
  When ele acessa a tela de perfil (modo visualização)
  Then deve ver "35 anos" (calculado da data de nascimento)
  And não deve ver a data de nascimento diretamente

Scenario: Data de nascimento visível apenas no modo de edição
  Given o usuário está no modo de visualização do perfil
  When ele toca em "Editar"
  Then o campo "Data de nascimento" deve se tornar visível e editável
\`\`\`

### Referências técnicas
- Cenários: e2e-bdd.md (Feature: Perfil do Usuário)
- Requirements: requirements.md (R3.1 a R3.5)
- Domain rules: domain-rules.md (DR-01 a DR-05)`,
      labelIds: [labels["test-e2e"]],
      projectId,
      parentId: epic.id,
    },
  ];

  const created = [];
  for (const issue of issues) {
    const i = await createIssue(issue);
    created.push(i);
    console.log(`  ✓ ${i.identifier} — ${i.title}`);
  }

  return { epic, issues: created };
}

// ─── Milestone 6: Testes E2E & Release 1.0 ────────────────────────────────

async function createMilestone6(projects, labels) {
  const projectId = projects["M6 — Testes E2E & Release 1.0"];
  console.log(`\n🚀  Milestone 6: Testes E2E & Release 1.0 (projeto ${projectId})`);

  const epic = await createIssue({
    title: "EPIC: Testes E2E & Release 1.0",
    description: `### Contexto
Configuração do framework E2E Detox, implementação dos fluxos integrados de teste e checklist de qualidade para release nas lojas. Garante que os fluxos mais críticos funcionam de ponta a ponta em dispositivos reais/simuladores.

### Critérios de aceite (epic)
- [ ] Detox configurado para iOS e Android
- [ ] Fluxos críticos de E2E passando (cadastro → uso → relatório)
- [ ] Checklist de acessibilidade verificado (contraste 4.5:1, toque 44pt)
- [ ] App pronto para submissão à App Store e Google Play

### Referências técnicas
- Testes: backend.md (Testes — tabela Detox)
- Acessibilidade: frontend.md (Acessibilidade)
- Cenários: e2e-bdd.md (todos os features)`,
    labelIds: [labels["epic"]],
    projectId,
  });
  console.log(`  ✓ Epic: ${epic.identifier} — ${epic.title}`);

  const issues = [
    {
      title: "Configurar Detox para testes E2E em iOS e Android",
      description: `### Contexto
Instalar e configurar o Detox como framework de testes E2E para React Native. Deve rodar em simuladores/emuladores no CI e em dispositivos reais localmente.

### Critérios de aceite
- [ ] Detox instalado e configurado no \`apps/mobile\`
- [ ] Configuração para iOS Simulator (ci e debug builds)
- [ ] Configuração para Android Emulator (ci e debug builds)
- [ ] Comando \`npx detox test\` executando a suite
- [ ] Detox integrado ao pipeline de CI (roda no push para \`main\`)
- [ ] Variáveis de ambiente para credenciais de teste configuradas no CI

### Referências técnicas
- Backend: backend.md (Testes — Detox)
- Stack: app-nutricional.md (Stack — React Native + Expo)`,
      labelIds: [labels["test-e2e"]],
      projectId,
      parentId: epic.id,
    },
    {
      title: "[test-e2e] Fluxo E2E: cadastro → onboarding → log refeição → ver relatório",
      description: `### Contexto
Teste do "happy path" principal do app: novo usuário se cadastra, completa o onboarding, registra uma refeição e vê o relatório atualizado.

### Critérios de aceite
\`\`\`gherkin
Scenario: Happy path — novo usuário
  Given o app está na WelcomeScreen
  When o usuário toca "Criar conta" e preenche nome, e-mail e senha válidos
  Then é redirecionado para o Onboarding
  When preenche data de nascimento, sexo "masculino", altura "178cm", peso "82kg"
  And pula o percentual de gordura e confirma
  Then é redirecionado para a DailyLogScreen com meta calórica visível
  When toca "+ Add" no Almoço, busca "arroz branco", seleciona e informa 150g
  And toca "Adicionar ao log"
  Then o item aparece no Almoço
  When navega para a aba Relatório
  Then vê "192 kcal" consumidos e barras de progresso atualizadas
\`\`\`

### Referências técnicas
- Cenários: e2e-bdd.md (Feature: Autenticação, Onboarding, Log Alimentar, Relatório)
- Fluxo: app-nutricional.md (Fluxo de Dados)`,
      labelIds: [labels["test-e2e"]],
      projectId,
      parentId: epic.id,
    },
    {
      title: "[test-e2e] Fluxo E2E: login → log café + almoço + jantar → verificar totais",
      description: `### Contexto
Teste de uso diário completo: usuário existente faz login e registra refeições ao longo do dia, verificando que os totais acumulam corretamente.

### Critérios de aceite
\`\`\`gherkin
Scenario: Uso diário completo
  Given existe uma conta com perfil completo (meta: 2300 kcal)
  When o usuário faz login
  Then é redirecionado para a DailyLogScreen
  When adiciona "2 ovos fritos" (186 kcal) no Café da Manhã
  And adiciona "arroz branco 150g" (192 kcal) no Almoço
  And adiciona "frango grelhado 200g" no Jantar
  Then o mini-card exibe a soma correta das calorias
  When navega para o Relatório
  Then vê o total consumido, déficit/superávit e macros por refeição
\`\`\`

### Referências técnicas
- Requirements: requirements.md (R4, R5)
- Cenários: e2e-bdd.md`,
      labelIds: [labels["test-e2e"]],
      projectId,
      parentId: epic.id,
    },
    {
      title: "[test-e2e] Fluxo E2E: editar perfil → confirmar recálculo de meta",
      description: `### Contexto
Valida que alterar dados corporais recalcula a meta nutricional e a mudança é refletida na tela principal.

### Critérios de aceite
\`\`\`gherkin
Scenario: Editar perfil recalcula meta
  Given usuário logado com meta de 2300 kcal (peso 82kg)
  When acessa Perfil → Editar → altera peso para "80kg" e salva
  Then a nova TMB é calculada com Mifflin-St Jeor para 80kg
  And a meta calórica no Relatório reflete o novo valor
  And o histórico anterior de metas é preservado
\`\`\`

### Referências técnicas
- Cenários: e2e-bdd.md (Feature: Perfil do Usuário)
- Domain rules: domain-rules.md (DR-01, DR-04, DR-05)`,
      labelIds: [labels["test-e2e"]],
      projectId,
      parentId: epic.id,
    },
    {
      title: "[test-e2e] Fluxo E2E: offline → modo somente-leitura de cache",
      description: `### Contexto
Valida o comportamento do app quando o usuário perde conectividade. O TanStack Query deve servir dados do cache e exibir aviso visual.

### Critérios de aceite
\`\`\`gherkin
Scenario: Sem conexão à internet
  Given o usuário está offline
  When ele tenta adicionar um alimento
  Then deve ver um aviso "Sem conexão. Tente novamente."
  And os dados do cache devem permanecer visíveis em modo somente-leitura

Scenario: Dados em cache ao ficar offline
  Given o usuário viu o relatório do dia com conexão
  When ele fica offline e navega pelo app
  Then os dados em cache permanecem visíveis (stale)
  And um indicador visual informa que os dados podem estar desatualizados
\`\`\`

### Referências técnicas
- Cenários: e2e-bdd.md (Cenários de Borda — Sem conexão)
- Frontend: frontend.md (Tratamento de Erros de Rede — Offline)`,
      labelIds: [labels["test-e2e"]],
      projectId,
      parentId: epic.id,
    },
    {
      title: "Checklist de release: acessibilidade, contraste e toque mínimo",
      description: `### Contexto
Verificação manual e automatizada dos critérios de qualidade antes de submeter às lojas. Garante conformidade com as guidelines da Apple e Google.

### Critérios de aceite
- [ ] Todos os inputs têm \`accessibilityLabel\` e \`accessibilityHint\` (ref: frontend.md Acessibilidade)
- [ ] Contraste de cores mínimo 4.5:1 (WCAG AA) verificado em todas as telas
- [ ] Botões e áreas de toque com mínimo 44×44pt (guideline Apple/Google) (ref: frontend.md)
- [ ] Suporte a Dynamic Type (iOS) e font scaling (Android) verificado
- [ ] App testado em iPhone 15 e Pixel 8 (ou equivalentes no CI)
- [ ] Screenshots para App Store e Google Play gerados
- [ ] App Store Connect e Google Play Console configurados
- [ ] Checklist de privacidade LGPD verificado (sem exigências especiais no MVP conforme PRD)

### Referências técnicas
- Acessibilidade: frontend.md (Acessibilidade — seção completa)
- PRD: PRD-app-nutricional-cliente.md (Restrições — LGPD)`,
      labelIds: [],
      projectId,
      parentId: epic.id,
    },
  ];

  const created = [];
  for (const issue of issues) {
    const i = await createIssue(issue);
    created.push(i);
    console.log(`  ✓ ${i.identifier} — ${i.title}`);
  }

  return { epic, issues: created };
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function main() {
  const milestone = parseInt(process.argv[2] || "0");

  const labels = await createLabels();

  if (milestone === 0 || milestone === "projects") {
    // Create all projects upfront
    const projects = await createProjects();
    console.log("\n✅ Labels e projetos criados. IDs:");
    console.log(JSON.stringify({ labels, projects }, null, 2));
    return;
  }

  // Load projects from env or re-fetch
  const projectsRaw = process.env.PROJECTS;
  let projects;
  if (projectsRaw) {
    projects = JSON.parse(projectsRaw);
  } else {
    // Fetch existing projects
    const data = await gql(`{ team(id: "${TEAM_ID}") { projects { nodes { id name } } } }`);
    projects = {};
    for (const p of data.team.projects.nodes) {
      projects[p.name] = p.id;
    }
  }

  const fns = {
    1: createMilestone1,
    2: createMilestone2,
    3: createMilestone3,
    4: createMilestone4,
    5: createMilestone5,
    6: createMilestone6,
  };

  if (!fns[milestone]) {
    console.error(`Milestone ${milestone} não encontrado. Use 0, 1-6.`);
    process.exit(1);
  }

  const result = await fns[milestone](projects, labels);

  console.log(`\n📋 Resumo Milestone ${milestone}:`);
  console.log(`  Epic: ${result.epic.identifier}`);
  console.log(`  Issues criadas: ${result.issues.length}`);
  console.log(`  Total: ${result.issues.length + 1} (epic + issues)`);
}

main().catch(err => {
  console.error("Erro:", err.message);
  process.exit(1);
});
