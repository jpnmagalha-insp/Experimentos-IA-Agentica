import Fastify from 'fastify'
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest'
import { logsPlugin } from './logs.routes'
import { authenticate } from '../middlewares/authenticate'
import type { FoodLogService } from '../services/foodLog.service'
import type { DailyLogsResponseDto } from '@nutri-ia/shared'

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
  const mockService = { getDailyLogs: vi.fn() }

  beforeAll(async () => {
    app = Fastify({ logger: false })
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
