import Fastify from 'fastify'
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest'
import { reportsPlugin } from './reports.routes'
import { authenticate } from '../middlewares/authenticate'
import { errorHandler } from '../middlewares/error-handler'
import { NotFoundError } from '../lib/errors'
import type { ReportService } from '../services/report.service'
import type { DailyReportResponseDto } from '@nutri-ia/shared'

vi.mock('../middlewares/authenticate', () => ({
  authenticate: vi.fn(async (req: { user: { id: string } }) => {
    req.user = { id: 'user-test-id-00000000-0000-0000-0000' }
  }),
}))

const goal = { calories: 2300, proteinG: 165, fatG: 77, carbG: 230 }

const deficitReport: DailyReportResponseDto = {
  date: '2026-05-25',
  goal,
  consumed: { calories: 1450, proteinG: 98, fatG: 52, carbG: 145 },
  balance: { calories: -850, status: 'deficit' },
  progress: { calories: 0.63, proteinG: 0.59, fatG: 0.68, carbG: 0.63 },
}

const surplusReport: DailyReportResponseDto = {
  date: '2026-05-25',
  goal,
  consumed: { calories: 2500, proteinG: 175, fatG: 85, carbG: 250 },
  balance: { calories: 200, status: 'surplus' },
  progress: { calories: 1.09, proteinG: 1.06, fatG: 1.1, carbG: 1.09 },
}

const onTargetReport: DailyReportResponseDto = {
  date: '2026-05-25',
  goal,
  consumed: { calories: 2310, proteinG: 165, fatG: 77, carbG: 230 },
  balance: { calories: 10, status: 'on_target' },
  progress: { calories: 1.0, proteinG: 1.0, fatG: 1.0, carbG: 1.0 },
}

const emptyDayReport: DailyReportResponseDto = {
  date: '2026-05-25',
  goal,
  consumed: { calories: 0, proteinG: 0, fatG: 0, carbG: 0 },
  balance: { calories: -2300, status: 'deficit' },
  progress: { calories: 0, proteinG: 0, fatG: 0, carbG: 0 },
}

describe('GET /reports/daily', () => {
  let app: ReturnType<typeof Fastify>
  const mockService = { getDailyReport: vi.fn() }

  beforeAll(async () => {
    app = Fastify({ logger: false })
    await app.register(errorHandler)
    await app.register(reportsPlugin, { reportService: mockService as unknown as ReportService })
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retorna 200 com status "deficit" quando consumido < meta - 50', async () => {
    mockService.getDailyReport.mockResolvedValue(deficitReport)

    const res = await app.inject({
      method: 'GET',
      url: '/reports/daily?date=2026-05-25',
      headers: { authorization: 'Bearer fake-token' },
    })

    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body) as DailyReportResponseDto
    expect(body.balance.status).toBe('deficit')
    expect(body.balance.calories).toBe(-850)
    expect(body.consumed.calories).toBe(1450)
    expect(body.goal.calories).toBe(2300)
  })

  it('retorna 200 com status "surplus" quando consumido > meta + 50', async () => {
    mockService.getDailyReport.mockResolvedValue(surplusReport)

    const res = await app.inject({
      method: 'GET',
      url: '/reports/daily?date=2026-05-25',
      headers: { authorization: 'Bearer fake-token' },
    })

    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body) as DailyReportResponseDto
    expect(body.balance.status).toBe('surplus')
    expect(body.balance.calories).toBe(200)
  })

  it('retorna 200 com status "on_target" quando balanço está dentro de ±50 kcal', async () => {
    mockService.getDailyReport.mockResolvedValue(onTargetReport)

    const res = await app.inject({
      method: 'GET',
      url: '/reports/daily?date=2026-05-25',
      headers: { authorization: 'Bearer fake-token' },
    })

    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body) as DailyReportResponseDto
    expect(body.balance.status).toBe('on_target')
  })

  it('retorna 200 com consumed zerado e balance = -meta em dia sem registros', async () => {
    mockService.getDailyReport.mockResolvedValue(emptyDayReport)

    const res = await app.inject({
      method: 'GET',
      url: '/reports/daily?date=2026-05-25',
      headers: { authorization: 'Bearer fake-token' },
    })

    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body) as DailyReportResponseDto
    expect(body.consumed).toEqual({ calories: 0, proteinG: 0, fatG: 0, carbG: 0 })
    expect(body.balance.calories).toBe(-2300)
    expect(body.balance.status).toBe('deficit')
    expect(body.progress).toEqual({ calories: 0, proteinG: 0, fatG: 0, carbG: 0 })
  })

  it('retorna 200 com campos progress contendo percentuais corretos', async () => {
    mockService.getDailyReport.mockResolvedValue(deficitReport)

    const res = await app.inject({
      method: 'GET',
      url: '/reports/daily?date=2026-05-25',
      headers: { authorization: 'Bearer fake-token' },
    })

    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body) as DailyReportResponseDto
    expect(body.progress).toMatchObject({
      calories: expect.any(Number),
      proteinG: expect.any(Number),
      fatG: expect.any(Number),
      carbG: expect.any(Number),
    })
  })

  it('retorna 400 com { error: "Validation error" } quando date é inválida', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/reports/daily?date=data-invalida',
      headers: { authorization: 'Bearer fake-token' },
    })

    expect(res.statusCode).toBe(400)
    const body = JSON.parse(res.body)
    expect(body.error).toBe('Validation error')
  })

  it('retorna 200 com a data de hoje quando date não é fornecida', async () => {
    const today = new Date().toISOString().slice(0, 10)
    mockService.getDailyReport.mockResolvedValue({ ...emptyDayReport, date: today })

    const res = await app.inject({
      method: 'GET',
      url: '/reports/daily',
      headers: { authorization: 'Bearer fake-token' },
    })

    expect(res.statusCode).toBe(200)
    expect(mockService.getDailyReport).toHaveBeenCalledWith(
      expect.any(String),
      today,
    )
  })

  it('retorna 404 quando service lança NotFoundError (usuário sem meta)', async () => {
    mockService.getDailyReport.mockRejectedValue(
      new NotFoundError('Nenhuma meta nutricional encontrada para este usuário'),
    )

    const res = await app.inject({
      method: 'GET',
      url: '/reports/daily?date=2026-05-25',
      headers: { authorization: 'Bearer fake-token' },
    })

    expect(res.statusCode).toBe(404)
    const body = JSON.parse(res.body)
    expect(body.error).toContain('meta nutricional')
  })

  it('retorna 401 quando authenticate rejeita', async () => {
    vi.mocked(authenticate).mockImplementationOnce(async (_req, reply) => {
      return reply.status(401).send({ error: 'Token ausente' })
    })

    const res = await app.inject({
      method: 'GET',
      url: '/reports/daily?date=2026-05-25',
    })

    expect(res.statusCode).toBe(401)
  })

  it('chama getDailyReport com userId e date corretos', async () => {
    mockService.getDailyReport.mockResolvedValue(deficitReport)

    await app.inject({
      method: 'GET',
      url: '/reports/daily?date=2026-05-25',
      headers: { authorization: 'Bearer fake-token' },
    })

    expect(mockService.getDailyReport).toHaveBeenCalledOnce()
    expect(mockService.getDailyReport).toHaveBeenCalledWith(
      'user-test-id-00000000-0000-0000-0000',
      '2026-05-25',
    )
  })
})
