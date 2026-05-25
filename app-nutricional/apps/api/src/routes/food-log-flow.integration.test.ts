import Fastify from 'fastify'
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest'
import { foodsPlugin } from './foods.routes'
import { logsPlugin } from './logs.routes'
import { errorHandler } from '../middlewares/error-handler'
import { FoodService } from '../services/food.service'
import { FoodLogService } from '../services/foodLog.service'
import type { FoodRepository, FoodWithMeasures } from '../repositories/food.repository'
import type { FoodLogRepository, FoodLogWithFood, CreateFoodLogData } from '../repositories/foodLog.repository'
import type { FoodSearchResponseDto, CreateLogResponseDto, DailyLogsResponseDto } from '@nutri-ia/shared'

vi.mock('../middlewares/authenticate', () => ({
  authenticate: vi.fn(async (req: { user: { id: string } }) => {
    req.user = { id: 'user-integration-id' }
  }),
}))

// ─── Fixtures ───────────────────────────────────────────────────────────────
// Valores TACO para "Arroz, branco, cozido"
// 150g: calories=128*1.5=192 | protein=2.5*1.5=3.8 | fat=0.2*1.5=0.3 | carb=28.1*1.5=42.2
const FOOD_ID = '550e8400-e29b-41d4-a716-446655440000'
const LOG_ID = '550e8400-e29b-41d4-a716-446655440010'
const USER_ID = 'user-integration-id'
const LOG_DATE = '2026-05-25'

const arrozBrancoCozido = {
  id: FOOD_ID,
  name: 'Arroz, branco, cozido',
  tacoId: '1',
  caloriesPer100g: 128,
  proteinPer100g: 2.5,
  fatPer100g: 0.2,
  carbPer100g: 28.1,
  category: 'Cereais e derivados',
  measures: [],
} as unknown as FoodWithMeasures

// ─── Setup ───────────────────────────────────────────────────────────────────

const mockFoodRepo = {
  search: vi.fn(),
  findById: vi.fn(),
}

const mockFoodLogRepo = {
  findByUserAndDate: vi.fn(),
  create: vi.fn(),
  findById: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}

const foodService = new FoodService(mockFoodRepo as unknown as FoodRepository)
const foodLogService = new FoodLogService(
  mockFoodLogRepo as unknown as FoodLogRepository,
  mockFoodRepo as unknown as FoodRepository,
)

describe('Fluxo de integração: busca → seleção → quantidade → log', () => {
  let app: ReturnType<typeof Fastify>

  beforeAll(async () => {
    app = Fastify({ logger: false })
    await app.register(errorHandler)
    await app.register(foodsPlugin, { foodService })
    await app.register(logsPlugin, { logService: foodLogService })
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Critério 1 ────────────────────────────────────────────────────────────
  it('GET /foods/search retorna "Arroz, branco, cozido" com shape FoodDto completo', async () => {
    mockFoodRepo.search.mockResolvedValue([arrozBrancoCozido])

    const res = await app.inject({ method: 'GET', url: '/foods/search?q=arroz+branco' })

    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body) as FoodSearchResponseDto
    expect(body.foods).toHaveLength(1)
    const food = body.foods[0]
    expect(food.name).toBe('Arroz, branco, cozido')
    expect(food.caloriesPer100g).toBe(128)
    expect(food.proteinPer100g).toBe(2.5)
    expect(food.fatPer100g).toBe(0.2)
    expect(food.carbPer100g).toBe(28.1)
    // Critério 2: shape necessário para FoodDetailScreen navegar com dados corretos
    expect(food).toHaveProperty('id')
    expect(food).toHaveProperty('measures')
    expect(Array.isArray(food.measures)).toBe(true)
  })

  // ── Critérios 3 e 4 ──────────────────────────────────────────────────────
  it('POST /logs 150g → 201 com macros do cenário BDD: 192 kcal · P:3.8g · G:0.3g · C:42.2g', async () => {
    mockFoodRepo.findById.mockResolvedValue(arrozBrancoCozido)
    // Ecoa de volta os macros calculados pelo calculateFoodMacros real
    mockFoodLogRepo.create.mockImplementation(async (data: CreateFoodLogData) => ({
      id: LOG_ID,
      userId: data.userId,
      foodId: data.foodId,
      foodMeasureId: data.foodMeasureId,
      logDate: data.logDate,
      mealType: data.mealType,
      quantity: data.quantity,
      unit: data.unit,
      calories: data.calories,
      proteinG: data.proteinG,
      fatG: data.fatG,
      carbG: data.carbG,
      createdAt: new Date(),
      updatedAt: new Date(),
      food: { id: FOOD_ID, name: 'Arroz, branco, cozido' },
    }))

    const res = await app.inject({
      method: 'POST',
      url: '/logs',
      headers: { authorization: 'Bearer fake-token', 'content-type': 'application/json' },
      body: JSON.stringify({
        foodId: FOOD_ID,
        logDate: LOG_DATE,
        mealType: 'lunch',
        quantity: 150,
        unit: 'g',
      }),
    })

    expect(res.statusCode).toBe(201)
    const body = JSON.parse(res.body) as CreateLogResponseDto
    expect(body.mealType).toBe('lunch')
    expect(body.quantity).toBe(150)
    expect(body.unit).toBe('g')
    expect(body.calories).toBe(192)
    expect(body.proteinG).toBe(3.8)
    expect(body.fatG).toBe(0.3)
    expect(body.carbG).toBe(42.2)
  })

  // ── Critérios 5 e 6 ──────────────────────────────────────────────────────
  it('GET /logs após POST mostra item na seção lunch e totals.calories = 192', async () => {
    const logEntry = {
      id: LOG_ID,
      userId: USER_ID,
      foodId: FOOD_ID,
      foodMeasureId: null,
      logDate: new Date(`${LOG_DATE}T00:00:00.000Z`),
      mealType: 'lunch',
      quantity: 150,
      unit: 'g',
      calories: 192,
      proteinG: 3.8,
      fatG: 0.3,
      carbG: 42.2,
      createdAt: new Date(),
      updatedAt: new Date(),
      food: { id: FOOD_ID, name: 'Arroz, branco, cozido' },
    } as unknown as FoodLogWithFood

    mockFoodLogRepo.findByUserAndDate.mockResolvedValue([logEntry])

    const res = await app.inject({
      method: 'GET',
      url: `/logs?date=${LOG_DATE}`,
      headers: { authorization: 'Bearer fake-token' },
    })

    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body) as DailyLogsResponseDto
    expect(body.date).toBe(LOG_DATE)
    // Critério 5: item aparece na seção correta (DailyLogScreen atualiza a lista)
    expect(body.meals.lunch).toHaveLength(1)
    expect(body.meals.lunch[0].food.name).toBe('Arroz, branco, cozido')
    expect(body.meals.lunch[0].quantity).toBe(150)
    expect(body.meals.lunch[0].calories).toBe(192)
    // Seções de outras refeições permanecem vazias
    expect(body.meals.breakfast).toHaveLength(0)
    expect(body.meals.dinner).toHaveLength(0)
    expect(body.meals.snack).toHaveLength(0)
    // Critério 6: mini-card de resumo recebe total atualizado
    expect(body.totals.calories).toBe(192)
    expect(body.totals.proteinG).toBe(3.8)
    expect(body.totals.fatG).toBe(0.3)
    expect(body.totals.carbG).toBe(42.2)
  })

  // ── Fluxo encadeado completo ──────────────────────────────────────────────
  it('encadeia busca → criação → consulta preservando food_id e valores ao longo do fluxo', async () => {
    // Search
    mockFoodRepo.search.mockResolvedValue([arrozBrancoCozido])
    const searchRes = await app.inject({ method: 'GET', url: '/foods/search?q=arroz+branco' })
    const { foods } = JSON.parse(searchRes.body) as FoodSearchResponseDto
    const selectedFoodId = foods[0].id

    // Create log usando o id retornado pela busca (sem hardcode)
    mockFoodRepo.findById.mockResolvedValue(arrozBrancoCozido)
    mockFoodLogRepo.create.mockImplementation(async (data: CreateFoodLogData) => ({
      id: LOG_ID,
      userId: data.userId,
      foodId: data.foodId,
      foodMeasureId: null,
      logDate: data.logDate,
      mealType: data.mealType,
      quantity: data.quantity,
      unit: data.unit,
      calories: data.calories,
      proteinG: data.proteinG,
      fatG: data.fatG,
      carbG: data.carbG,
      createdAt: new Date(),
      updatedAt: new Date(),
      food: { id: selectedFoodId, name: 'Arroz, branco, cozido' },
    }))

    const createRes = await app.inject({
      method: 'POST',
      url: '/logs',
      headers: { authorization: 'Bearer fake-token', 'content-type': 'application/json' },
      body: JSON.stringify({
        foodId: selectedFoodId,
        logDate: LOG_DATE,
        mealType: 'lunch',
        quantity: 150,
        unit: 'g',
      }),
    })
    expect(createRes.statusCode).toBe(201)
    const created = JSON.parse(createRes.body) as CreateLogResponseDto
    expect(created.food.id).toBe(selectedFoodId)

    // Query logs
    mockFoodLogRepo.findByUserAndDate.mockResolvedValue([{
      id: LOG_ID,
      userId: USER_ID,
      foodId: selectedFoodId,
      foodMeasureId: null,
      logDate: new Date(`${LOG_DATE}T00:00:00.000Z`),
      mealType: 'lunch',
      quantity: 150,
      unit: 'g',
      calories: created.calories,
      proteinG: created.proteinG,
      fatG: created.fatG,
      carbG: created.carbG,
      createdAt: new Date(),
      updatedAt: new Date(),
      food: { id: selectedFoodId, name: 'Arroz, branco, cozido' },
    } as unknown as FoodLogWithFood])

    const logsRes = await app.inject({
      method: 'GET',
      url: `/logs?date=${LOG_DATE}`,
      headers: { authorization: 'Bearer fake-token' },
    })

    expect(logsRes.statusCode).toBe(200)
    const logsBody = JSON.parse(logsRes.body) as DailyLogsResponseDto
    const lunchItem = logsBody.meals.lunch[0]
    expect(lunchItem.food.id).toBe(selectedFoodId)
    expect(lunchItem.calories).toBe(created.calories)
    expect(logsBody.totals.calories).toBe(created.calories)
  })
})
