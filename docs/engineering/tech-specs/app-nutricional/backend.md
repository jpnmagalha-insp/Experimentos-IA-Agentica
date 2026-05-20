# Backend — App de Controle Nutricional

## Stack

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| Node.js | 20 LTS | Runtime |
| Fastify | 4 | HTTP framework (performance + plugin ecosystem) |
| TypeScript | 5 | Type safety |
| Prisma | 5 | ORM + migrations |
| PostgreSQL | 15 | Banco de dados |
| Zod | 3 | Validação de schemas de entrada/saída |
| @fastify/jwt | 8 | JWT access + refresh tokens |
| Passport.js | 0.7 | OAuth2 Google e Apple |
| bcrypt | 5 | Hash de senhas |
| Nodemailer | 6 | Envio de e-mail (recuperação de senha) |

---

## Estrutura de Diretórios

```
apps/api/src/
├── routes/
│   ├── auth.routes.ts
│   ├── users.routes.ts
│   ├── foods.routes.ts
│   ├── logs.routes.ts
│   └── reports.routes.ts
├── services/
│   ├── auth.service.ts
│   ├── user.service.ts
│   ├── food.service.ts
│   ├── log.service.ts
│   └── report.service.ts
├── repositories/
│   ├── user.repository.ts
│   ├── food.repository.ts
│   ├── log.repository.ts
│   └── goal.repository.ts
├── calculators/
│   ├── tmb.calculator.ts
│   ├── macro-goal.calculator.ts
│   └── food-macro.calculator.ts
├── middlewares/
│   ├── authenticate.ts        # verifica JWT, injeta req.user
│   └── error-handler.ts       # formata erros para o padrão da API
├── lib/
│   ├── prisma.ts              # singleton do PrismaClient
│   ├── jwt.ts                 # helpers de sign/verify
│   └── email.ts               # wrapper do Nodemailer
└── server.ts                  # bootstrap do Fastify
```

---

## Camadas e Responsabilidades

### Routes
- Recebem a requisição HTTP
- Validam input com schemas Zod via `fastify-zod` ou `fastify-type-provider-zod`
- Chamam o Service correspondente
- Retornam a resposta HTTP

Não contêm lógica de negócio nem acesso direto ao banco.

```typescript
// exemplo: routes/logs.routes.ts
fastify.post('/logs', { preHandler: authenticate }, async (req, reply) => {
  const body = createLogSchema.parse(req.body)
  const log = await logService.create(req.user.id, body)
  return reply.status(201).send(log)
})
```

### Services
- Contêm toda a lógica de negócio
- Orquestram chamadas a Repositories e Calculators
- Lançam erros de domínio (ex: `FoodNotFoundError`, `UnauthorizedError`)

```typescript
// exemplo: services/log.service.ts
async create(userId: string, data: CreateLogDto): Promise<FoodLog> {
  const food = await foodRepository.findById(data.foodId)
  if (!food) throw new FoodNotFoundError(data.foodId)

  const macros = foodMacroCalculator.calculate(food, data.quantity, data.unit, data.foodMeasureId)
  return logRepository.create({ ...data, userId, ...macros })
}
```

### Repositories
- Acesso ao banco exclusivamente via Prisma
- Sem lógica de negócio
- Métodos: `findById`, `findByUserId`, `create`, `update`, `delete`

### Calculators
- Funções puras sem side effects
- Recebem parâmetros e retornam resultados calculados
- Testáveis de forma isolada

---

## Calculators

### `tmb.calculator.ts`

```typescript
export type TmbInput = {
  sex: 'male' | 'female'
  weightKg: number
  heightCm: number
  ageYears: number
  bodyFatPercent?: number | null
}

// Mifflin-St Jeor (sem % gordura)
function mifflinStJeor({ sex, weightKg, heightCm, ageYears }: TmbInput): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears
  return sex === 'male' ? base + 5 : base - 161
}

// Katch-McArdle (com % gordura)
function katchMcArdle({ weightKg, bodyFatPercent }: TmbInput): number {
  const leanMass = weightKg * (1 - bodyFatPercent! / 100)
  return 370 + 21.6 * leanMass
}

export function calculateTmb(input: TmbInput): number {
  return input.bodyFatPercent != null
    ? katchMcArdle(input)
    : mifflinStJeor(input)
}
```

### `macro-goal.calculator.ts`

```typescript
// Distribuição padrão MVP (sem seleção de objetivo pelo usuário)
// Proteína: 30% · Gordura: 25% · Carboidrato: 45%
export function calculateMacroGoal(tmb: number) {
  return {
    calories: Math.round(tmb),
    proteinG: Math.round((tmb * 0.30) / 4),   // 4 kcal/g
    fatG: Math.round((tmb * 0.25) / 9),         // 9 kcal/g
    carbG: Math.round((tmb * 0.45) / 4),        // 4 kcal/g
  }
}
```

### `food-macro.calculator.ts`

```typescript
export function calculateFoodMacros(
  food: Pick<Food, 'caloriesPer100g' | 'proteinPer100g' | 'fatPer100g' | 'carbPer100g'>,
  quantity: number,
  unit: string,
  measure?: Pick<FoodMeasure, 'gramsEquivalent'> | null
): MacroResult {
  const grams = unit === 'measure' && measure
    ? quantity * measure.gramsEquivalent
    : quantity

  const factor = grams / 100
  return {
    calories: round(food.caloriesPer100g * factor),
    proteinG: round(food.proteinPer100g * factor),
    fatG:     round(food.fatPer100g * factor),
    carbG:    round(food.carbPer100g * factor),
  }
}

const round = (n: number) => Math.round(n * 10) / 10
```

---

## Middlewares

### `authenticate.ts`
Hook `preHandler` que verifica o JWT e injeta `req.user`:

```typescript
export async function authenticate(req: FastifyRequest, reply: FastifyReply) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return reply.status(401).send({ error: 'Token ausente' })

  try {
    const payload = fastify.jwt.verify<JwtPayload>(token)
    req.user = { id: payload.sub }
  } catch {
    return reply.status(401).send({ error: 'Token inválido ou expirado' })
  }
}
```

### `error-handler.ts`
Plugin global que normaliza erros lançados pelos services:

| Tipo de Erro | Status HTTP |
|---|---|
| `ZodError` | 400 com details dos campos inválidos |
| `FoodNotFoundError` | 404 |
| `UnauthorizedError` | 403 |
| `ConflictError` | 409 |
| Outros | 500 |

---

## Autenticação JWT

- **Access token**: expira em 15 minutos, payload: `{ sub: userId, iat, exp }`
- **Refresh token**: expira em 30 dias, armazenado como hash no banco (tabela `refresh_tokens`)
- Ao fazer refresh: valida o token no banco, invalida o antigo, emite novo par

---

## Seed da Base TACO

Script `prisma/seeds/taco.seed.ts` que:
1. Lê o JSON da TACO v7 (`prisma/seeds/data/taco.json`)
2. Faz upsert de todos os alimentos via `prisma.food.upsert({ where: { tacoId } })`
3. Importa as medidas caseiras correspondentes

Executado com `npx prisma db seed` e também no pipeline de CI antes dos testes de integração.

---

## Testes

| Tipo | Ferramenta | Escopo |
|------|-----------|--------|
| Unitário | Vitest | Calculators (funções puras) |
| Integração | Vitest + Testcontainers | Services + Repositories + banco real |
| e2e | Supertest | Rotas HTTP completas |

Os testes de integração sobem um PostgreSQL via Docker (Testcontainers) e rodam as migrations antes de cada suite.
