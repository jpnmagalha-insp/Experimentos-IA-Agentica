import Fastify from 'fastify'
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest'
import { usersRoutes } from './users.routes'
import { authenticate } from '../middlewares/authenticate'
import { errorHandler } from '../middlewares/error-handler'
import { NotFoundError } from '../lib/errors'
import type { GetMeResponseDto } from '@nutri-ia/shared'

vi.mock('../middlewares/authenticate', () => ({
  authenticate: vi.fn(async (req: { user: { id: string } }) => {
    req.user = { id: 'user-test-id-00000000-0000-0000-0000' }
  }),
}))

const mockGetMe = vi.fn()

vi.mock('../services/user.service', () => ({
  userService: { getMe: (...args: unknown[]) => mockGetMe(...args) },
}))

const fullResponse: GetMeResponseDto = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  name: 'João Silva',
  email: 'joao@email.com',
  emailVerified: true,
  profile: {
    birthDate: '1990-05-15',
    sex: 'male',
    heightCm: 178,
    weightKg: 82.5,
    bodyFatPercent: null,
    tmb: 1920,
    age: 35,
  },
  currentGoal: {
    calories: 2300,
    proteinG: 165,
    fatG: 77,
    carbG: 230,
  },
}

const noProfileResponse: GetMeResponseDto = {
  id: '550e8400-e29b-41d4-a716-446655440002',
  name: 'Maria Sem Perfil',
  email: 'maria@email.com',
  emailVerified: false,
  profile: null,
  currentGoal: null,
}

describe('GET /users/me', () => {
  let app: ReturnType<typeof Fastify>

  beforeAll(async () => {
    app = Fastify({ logger: false })
    await app.register(errorHandler)
    await app.register(usersRoutes)
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retorna 200 com payload completo quando usuário tem perfil e meta', async () => {
    mockGetMe.mockResolvedValue(fullResponse)

    const res = await app.inject({
      method: 'GET',
      url: '/users/me',
      headers: { authorization: 'Bearer fake-token' },
    })

    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body) as GetMeResponseDto
    expect(body).toMatchObject({
      id: fullResponse.id,
      name: 'João Silva',
      email: 'joao@email.com',
      emailVerified: true,
      profile: {
        birthDate: '1990-05-15',
        sex: 'male',
        heightCm: 178,
        weightKg: 82.5,
        bodyFatPercent: null,
        tmb: 1920,
        age: 35,
      },
      currentGoal: {
        calories: 2300,
        proteinG: 165,
        fatG: 77,
        carbG: 230,
      },
    })
  })

  it('retorna 200 com profile: null e currentGoal: null quando onboarding está incompleto', async () => {
    mockGetMe.mockResolvedValue(noProfileResponse)

    const res = await app.inject({
      method: 'GET',
      url: '/users/me',
      headers: { authorization: 'Bearer fake-token' },
    })

    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body) as GetMeResponseDto
    expect(body.profile).toBeNull()
    expect(body.currentGoal).toBeNull()
  })

  it('retorna 404 quando service lança NotFoundError', async () => {
    mockGetMe.mockRejectedValue(new NotFoundError('Usuário não encontrado'))

    const res = await app.inject({
      method: 'GET',
      url: '/users/me',
      headers: { authorization: 'Bearer fake-token' },
    })

    expect(res.statusCode).toBe(404)
    const body = JSON.parse(res.body)
    expect(body.error).toBe('Usuário não encontrado')
  })

  it('retorna 401 quando authenticate rejeita a requisição', async () => {
    vi.mocked(authenticate).mockImplementationOnce(async (_req, reply) => {
      return reply.status(401).send({ error: 'Token ausente' })
    })

    const res = await app.inject({
      method: 'GET',
      url: '/users/me',
    })

    expect(res.statusCode).toBe(401)
  })

  it('chama service com o userId correto extraído de req.user.id', async () => {
    mockGetMe.mockResolvedValue(fullResponse)

    await app.inject({
      method: 'GET',
      url: '/users/me',
      headers: { authorization: 'Bearer fake-token' },
    })

    expect(mockGetMe).toHaveBeenCalledOnce()
    expect(mockGetMe).toHaveBeenCalledWith('user-test-id-00000000-0000-0000-0000')
  })
})
