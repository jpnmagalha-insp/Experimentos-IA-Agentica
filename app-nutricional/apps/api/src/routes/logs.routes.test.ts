import Fastify from 'fastify'
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest'
import { logsPlugin } from './logs.routes'
import { authenticate } from '../middlewares/authenticate'
import { errorHandler } from '../middlewares/error-handler'
import { NotFoundError, ForbiddenError } from '../lib/errors'
import type { FoodLogService } from '../services/foodLog.service'
import type { CreateLogResponseDto, DailyLogsResponseDto, UpdateLogResponseDto } from '@nutri-ia/shared'

vi.mock('../middlewares/authenticate', () => ({
  authenticate: vi.fn(async (req: { user: { id: string } }) => {
    req.user = { id: 'user-test-id-00000000-0000-0000-0000' }
  }),
}))

const emptyDailyLogs: DailyLogsResponseDto = {
  date: '2026-05-25',
  meals: {
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: [],
  },
  totals: {
    calories: 0,
    proteinG: 0,
    fatG: 0,
    carbG: 0,
  },
}

const populatedDailyLogs: DailyLogsResponseDto = {
  date: '2026-05-25',
  meals: {
    breakfast: [
      {
        id: '550e8400-e29b-41d4-a716-446655440010',
        food: { id: '550e8400-e29b-41d4-a716-446655440000', name: 'Aveia' },
        quantity: 40,
        unit: 'g',
        calories: 148,
        proteinG: 5.2,
        fatG: 2.8,
        carbG: 25.7,
      },
    ],
    lunch: [],
    dinner: [],
    snack: [],
  },
  totals: {
    calories: 148,
    proteinG: 5.2,
    fatG: 2.8,
    carbG: 25.7,
  },
}

describe('GET /logs', () => {
  let app: ReturnType<typeof Fastify>
  const mockService = { getDailyLogs: vi.fn(), createLog: vi.fn() }

  beforeAll(async () => {
    app = Fastify({ logger: false })
    await app.register(errorHandler)
    await app.register(logsPlugin, { logService: mockService as unknown as FoodLogService })
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retorna 400 com { error: "Validation error" } quando date é uma data inválida', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/logs?date=data-invalida',
      headers: { authorization: 'Bearer fake-token' },
    })

    expect(res.statusCode).toBe(400)
    const body = JSON.parse(res.body)
    expect(body.error).toBe('Validation error')
  })

  it('retorna 200 com envelope completo quando service retorna dados populados', async () => {
    mockService.getDailyLogs.mockResolvedValue(populatedDailyLogs)

    const res = await app.inject({
      method: 'GET',
      url: '/logs?date=2026-05-25',
      headers: { authorization: 'Bearer fake-token' },
    })

    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body) as DailyLogsResponseDto
    expect(body.date).toBe('2026-05-25')
    expect(body.meals).toHaveProperty('breakfast')
    expect(body.meals).toHaveProperty('lunch')
    expect(body.meals).toHaveProperty('dinner')
    expect(body.meals).toHaveProperty('snack')
    expect(body.totals).toMatchObject({
      calories: 148,
      proteinG: 5.2,
      fatG: 2.8,
      carbG: 25.7,
    })
  })

  it('retorna 200 com meals vazios e totals zerados quando o dia não tem registros', async () => {
    mockService.getDailyLogs.mockResolvedValue(emptyDailyLogs)

    const res = await app.inject({
      method: 'GET',
      url: '/logs?date=2026-05-25',
      headers: { authorization: 'Bearer fake-token' },
    })

    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body) as DailyLogsResponseDto
    expect(body.meals.breakfast).toEqual([])
    expect(body.meals.lunch).toEqual([])
    expect(body.meals.dinner).toEqual([])
    expect(body.meals.snack).toEqual([])
    expect(body.totals).toEqual({ calories: 0, proteinG: 0, fatG: 0, carbG: 0 })
  })

  it('retorna 200 e chama service com a data UTC de hoje quando date não é fornecida', async () => {
    const today = new Date().toISOString().slice(0, 10)
    mockService.getDailyLogs.mockResolvedValue({ ...emptyDailyLogs, date: today })

    const res = await app.inject({
      method: 'GET',
      url: '/logs',
      headers: { authorization: 'Bearer fake-token' },
    })

    expect(res.statusCode).toBe(200)
    expect(mockService.getDailyLogs).toHaveBeenCalledWith(
      expect.any(String),
      today,
    )
  })

  it('chama service com o userId correto extraído de req.user.id', async () => {
    mockService.getDailyLogs.mockResolvedValue(emptyDailyLogs)

    await app.inject({
      method: 'GET',
      url: '/logs?date=2026-05-25',
      headers: { authorization: 'Bearer fake-token' },
    })

    expect(mockService.getDailyLogs).toHaveBeenCalledOnce()
    expect(mockService.getDailyLogs).toHaveBeenCalledWith(
      'user-test-id-00000000-0000-0000-0000',
      '2026-05-25',
    )
  })

  it('retorna 401 quando o header Authorization está ausente', async () => {
    vi.mocked(authenticate).mockImplementationOnce(async (_req, reply) => {
      return reply.status(401).send({ error: 'Token ausente' })
    })

    const res = await app.inject({
      method: 'GET',
      url: '/logs?date=2026-05-25',
    })

    expect(res.statusCode).toBe(401)
  })
})

// ---------------------------------------------------------------------------
// POST /logs
// ---------------------------------------------------------------------------

const FOOD_ID = '550e8400-e29b-41d4-a716-446655440000'
const LOG_ID = '550e8400-e29b-41d4-a716-446655440010'

const mockCreateLogResponse: CreateLogResponseDto = {
  id: LOG_ID,
  food: { id: FOOD_ID, name: 'Banana prata' },
  mealType: 'breakfast',
  quantity: 60,
  unit: 'g',
  calories: 53.4,
  proteinG: 0.7,
  fatG: 0.2,
  carbG: 13.7,
}

const validPostBody = {
  foodId: FOOD_ID,
  logDate: '2026-05-25',
  mealType: 'breakfast',
  quantity: 60,
  unit: 'g',
}

describe('POST /logs', () => {
  let app: ReturnType<typeof Fastify>
  const mockService = { getDailyLogs: vi.fn(), createLog: vi.fn() }

  beforeAll(async () => {
    app = Fastify({ logger: false })
    await app.register(errorHandler)
    await app.register(logsPlugin, { logService: mockService as unknown as FoodLogService })
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retorna 201 com envelope de 9 campos quando service retorna dado válido', async () => {
    mockService.createLog.mockResolvedValue(mockCreateLogResponse)

    const res = await app.inject({
      method: 'POST',
      url: '/logs',
      headers: { authorization: 'Bearer fake-token', 'content-type': 'application/json' },
      body: JSON.stringify(validPostBody),
    })

    expect(res.statusCode).toBe(201)
    const body = JSON.parse(res.body) as CreateLogResponseDto
    expect(body).toMatchObject({
      id: LOG_ID,
      food: { id: FOOD_ID, name: 'Banana prata' },
      mealType: 'breakfast',
      quantity: 60,
      unit: 'g',
      calories: 53.4,
      proteinG: 0.7,
      fatG: 0.2,
      carbG: 13.7,
    })
  })

  it('retorna 400 quando foodId está ausente no body', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/logs',
      headers: { authorization: 'Bearer fake-token', 'content-type': 'application/json' },
      body: JSON.stringify({
        logDate: '2026-05-25',
        mealType: 'breakfast',
        quantity: 60,
      }),
    })

    expect(res.statusCode).toBe(400)
    const body = JSON.parse(res.body)
    expect(body.error).toBe('Validation error')
  })

  it('retorna 400 quando unit="measure" sem foodMeasureId (Zod refine)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/logs',
      headers: { authorization: 'Bearer fake-token', 'content-type': 'application/json' },
      body: JSON.stringify({
        foodId: FOOD_ID,
        logDate: '2026-05-25',
        mealType: 'breakfast',
        quantity: 2,
        unit: 'measure',
      }),
    })

    expect(res.statusCode).toBe(400)
    const body = JSON.parse(res.body)
    expect(body.error).toBe('Validation error')
  })

  it('retorna 400 quando mealType é inválido', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/logs',
      headers: { authorization: 'Bearer fake-token', 'content-type': 'application/json' },
      body: JSON.stringify({
        foodId: FOOD_ID,
        logDate: '2026-05-25',
        mealType: 'brunch',
        quantity: 60,
        unit: 'g',
      }),
    })

    expect(res.statusCode).toBe(400)
    const body = JSON.parse(res.body)
    expect(body.error).toBe('Validation error')
  })

  it('retorna 404 quando service lança NotFoundError', async () => {
    mockService.createLog.mockRejectedValue(new NotFoundError('Food not found'))

    const res = await app.inject({
      method: 'POST',
      url: '/logs',
      headers: { authorization: 'Bearer fake-token', 'content-type': 'application/json' },
      body: JSON.stringify(validPostBody),
    })

    expect(res.statusCode).toBe(404)
    const body = JSON.parse(res.body)
    expect(body.error).toBe('Food not found')
  })

  it('retorna 401 quando o middleware de autenticação rejeita a requisição', async () => {
    vi.mocked(authenticate).mockImplementationOnce(async (_req, reply) => {
      return reply.status(401).send({ error: 'Token ausente' })
    })

    const res = await app.inject({
      method: 'POST',
      url: '/logs',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(validPostBody),
    })

    expect(res.statusCode).toBe(401)
  })

  it('chama createLog com o userId extraído de req.user.id', async () => {
    mockService.createLog.mockResolvedValue(mockCreateLogResponse)

    await app.inject({
      method: 'POST',
      url: '/logs',
      headers: { authorization: 'Bearer fake-token', 'content-type': 'application/json' },
      body: JSON.stringify(validPostBody),
    })

    expect(mockService.createLog).toHaveBeenCalledOnce()
    expect(mockService.createLog).toHaveBeenCalledWith(
      'user-test-id-00000000-0000-0000-0000',
      expect.objectContaining({ foodId: FOOD_ID }),
    )
  })
})

// ---------------------------------------------------------------------------
// PUT /logs/:id
// ---------------------------------------------------------------------------

const mockUpdateLogResponse: UpdateLogResponseDto = {
  id: LOG_ID,
  food: { id: FOOD_ID, name: 'Banana prata' },
  mealType: 'breakfast',
  quantity: 120,
  unit: 'g',
  calories: 106.8,
  proteinG: 1.3,
  fatG: 0.4,
  carbG: 27.4,
}

const validPutBody = {
  quantity: 120,
  unit: 'g',
}

describe('PUT /logs/:id', () => {
  let app: ReturnType<typeof Fastify>
  const mockService = { getDailyLogs: vi.fn(), createLog: vi.fn(), updateLog: vi.fn() }

  beforeAll(async () => {
    app = Fastify({ logger: false })
    await app.register(errorHandler)
    await app.register(logsPlugin, { logService: mockService as unknown as FoodLogService })
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retorna 200 com shape completo quando service retorna sucesso', async () => {
    mockService.updateLog.mockResolvedValue(mockUpdateLogResponse)

    const res = await app.inject({
      method: 'PUT',
      url: `/logs/${LOG_ID}`,
      headers: { authorization: 'Bearer fake-token', 'content-type': 'application/json' },
      body: JSON.stringify(validPutBody),
    })

    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body) as UpdateLogResponseDto
    expect(body).toMatchObject({
      id: LOG_ID,
      food: { id: FOOD_ID, name: 'Banana prata' },
      mealType: 'breakfast',
      quantity: 120,
      unit: 'g',
      calories: 106.8,
      proteinG: 1.3,
      fatG: 0.4,
      carbG: 27.4,
    })
  })

  it('retorna 400 quando :id não é UUID válido', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/logs/nao-e-um-uuid',
      headers: { authorization: 'Bearer fake-token', 'content-type': 'application/json' },
      body: JSON.stringify(validPutBody),
    })

    expect(res.statusCode).toBe(400)
    const body = JSON.parse(res.body)
    expect(body.error).toBe('Validation error')
  })

  it('retorna 400 quando quantity é negativo ou zero (violação Zod)', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: `/logs/${LOG_ID}`,
      headers: { authorization: 'Bearer fake-token', 'content-type': 'application/json' },
      body: JSON.stringify({ quantity: -5, unit: 'g' }),
    })

    expect(res.statusCode).toBe(400)
    const body = JSON.parse(res.body)
    expect(body.error).toBe('Validation error')
  })

  it('retorna 400 quando unit="measure" sem foodMeasureId (refine Zod)', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: `/logs/${LOG_ID}`,
      headers: { authorization: 'Bearer fake-token', 'content-type': 'application/json' },
      body: JSON.stringify({ quantity: 2, unit: 'measure' }),
    })

    expect(res.statusCode).toBe(400)
    const body = JSON.parse(res.body)
    expect(body.error).toBe('Validation error')
  })

  it('retorna 404 quando service lança NotFoundError', async () => {
    mockService.updateLog.mockRejectedValue(new NotFoundError('Food log not found'))

    const res = await app.inject({
      method: 'PUT',
      url: `/logs/${LOG_ID}`,
      headers: { authorization: 'Bearer fake-token', 'content-type': 'application/json' },
      body: JSON.stringify(validPutBody),
    })

    expect(res.statusCode).toBe(404)
    const body = JSON.parse(res.body)
    expect(body.error).toBe('Food log not found')
  })

  it('retorna 403 quando service lança ForbiddenError', async () => {
    mockService.updateLog.mockRejectedValue(new ForbiddenError('Access denied'))

    const res = await app.inject({
      method: 'PUT',
      url: `/logs/${LOG_ID}`,
      headers: { authorization: 'Bearer fake-token', 'content-type': 'application/json' },
      body: JSON.stringify(validPutBody),
    })

    expect(res.statusCode).toBe(403)
    const body = JSON.parse(res.body)
    expect(body.error).toBe('Access denied')
  })

  it('retorna 401 quando authenticate rejeita', async () => {
    vi.mocked(authenticate).mockImplementationOnce(async (_req, reply) => {
      return reply.status(401).send({ error: 'Token ausente' })
    })

    const res = await app.inject({
      method: 'PUT',
      url: `/logs/${LOG_ID}`,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(validPutBody),
    })

    expect(res.statusCode).toBe(401)
  })

  it('chama updateLog com userId correto, logId correto e dto correto', async () => {
    mockService.updateLog.mockResolvedValue(mockUpdateLogResponse)

    await app.inject({
      method: 'PUT',
      url: `/logs/${LOG_ID}`,
      headers: { authorization: 'Bearer fake-token', 'content-type': 'application/json' },
      body: JSON.stringify(validPutBody),
    })

    expect(mockService.updateLog).toHaveBeenCalledOnce()
    expect(mockService.updateLog).toHaveBeenCalledWith(
      'user-test-id-00000000-0000-0000-0000',
      LOG_ID,
      expect.objectContaining({ quantity: 120, unit: 'g' }),
    )
  })
})
