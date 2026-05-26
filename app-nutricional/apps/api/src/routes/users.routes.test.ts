import Fastify from 'fastify'
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest'
import { usersRoutes } from './users.routes'
import { authenticate } from '../middlewares/authenticate'
import { errorHandler } from '../middlewares/error-handler'
import { NotFoundError } from '../lib/errors'
import type { GetMeResponseDto, UpdateProfileResponseDto } from '@nutri-ia/shared'

vi.mock('../middlewares/authenticate', () => ({
  authenticate: vi.fn(async (req: { user: { id: string } }) => {
    req.user = { id: 'user-test-id-00000000-0000-0000-0000' }
  }),
}))

const mockGetMe = vi.fn()
const mockUpsertProfile = vi.fn()

vi.mock('../services/user.service', () => ({
  userService: {
    getMe: (...args: unknown[]) => mockGetMe(...args),
    upsertProfile: (...args: unknown[]) => mockUpsertProfile(...args),
  },
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

const mifflinResponse: UpdateProfileResponseDto = {
  profile: {
    birthDate: '1990-05-15',
    sex: 'male',
    heightCm: 178,
    weightKg: 80,
    bodyFatPercent: null,
    tmb: 1777,
    age: 35,
  },
  currentGoal: { calories: 1777, proteinG: 133, fatG: 49, carbG: 200 },
}

const katchResponse: UpdateProfileResponseDto = {
  profile: {
    birthDate: '1990-05-15',
    sex: 'male',
    heightCm: 178,
    weightKg: 82,
    bodyFatPercent: 18,
    tmb: 1822,
    age: 35,
  },
  currentGoal: { calories: 1822, proteinG: 137, fatG: 51, carbG: 205 },
}

const validBody = {
  birthDate: '1990-05-15',
  sex: 'male',
  heightCm: 178,
  weightKg: 80,
}

describe('PUT /users/me/profile', () => {
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

  it('retorna 200 com perfil e meta via Mifflin-St Jeor (sem bodyFatPercent)', async () => {
    mockUpsertProfile.mockResolvedValue(mifflinResponse)

    const res = await app.inject({
      method: 'PUT',
      url: '/users/me/profile',
      headers: { authorization: 'Bearer fake-token', 'content-type': 'application/json' },
      payload: validBody,
    })

    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body) as UpdateProfileResponseDto
    expect(body.profile.tmb).toBe(1777)
    expect(body.currentGoal.calories).toBe(1777)
    expect(mockUpsertProfile).toHaveBeenCalledWith(
      'user-test-id-00000000-0000-0000-0000',
      expect.objectContaining({ birthDate: '1990-05-15', sex: 'male', heightCm: 178, weightKg: 80 }),
    )
  })

  it('retorna 200 com meta Katch-McArdle quando bodyFatPercent é fornecido', async () => {
    mockUpsertProfile.mockResolvedValue(katchResponse)

    const res = await app.inject({
      method: 'PUT',
      url: '/users/me/profile',
      headers: { authorization: 'Bearer fake-token', 'content-type': 'application/json' },
      payload: { ...validBody, weightKg: 82, bodyFatPercent: 18 },
    })

    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body) as UpdateProfileResponseDto
    expect(body.profile.bodyFatPercent).toBe(18)
    expect(mockUpsertProfile).toHaveBeenCalledWith(
      'user-test-id-00000000-0000-0000-0000',
      expect.objectContaining({ bodyFatPercent: 18 }),
    )
  })

  it('retorna 400 quando heightCm está abaixo do range (< 100)', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/users/me/profile',
      headers: { authorization: 'Bearer fake-token', 'content-type': 'application/json' },
      payload: { ...validBody, heightCm: 99 },
    })

    expect(res.statusCode).toBe(400)
    const body = JSON.parse(res.body)
    expect(body.error).toBe('Dados inválidos')
    expect(body.details.heightCm).toBeDefined()
  })

  it('retorna 400 quando heightCm está acima do range (> 250)', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/users/me/profile',
      headers: { authorization: 'Bearer fake-token', 'content-type': 'application/json' },
      payload: { ...validBody, heightCm: 251 },
    })

    expect(res.statusCode).toBe(400)
    const body = JSON.parse(res.body)
    expect(body.details.heightCm).toBeDefined()
  })

  it('retorna 400 quando weightKg está abaixo do range (< 30)', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/users/me/profile',
      headers: { authorization: 'Bearer fake-token', 'content-type': 'application/json' },
      payload: { ...validBody, weightKg: 29 },
    })

    expect(res.statusCode).toBe(400)
    const body = JSON.parse(res.body)
    expect(body.details.weightKg).toBeDefined()
  })

  it('retorna 400 quando weightKg está acima do range (> 300)', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/users/me/profile',
      headers: { authorization: 'Bearer fake-token', 'content-type': 'application/json' },
      payload: { ...validBody, weightKg: 301 },
    })

    expect(res.statusCode).toBe(400)
    const body = JSON.parse(res.body)
    expect(body.details.weightKg).toBeDefined()
  })

  it('retorna 400 quando bodyFatPercent está abaixo do range (< 3)', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/users/me/profile',
      headers: { authorization: 'Bearer fake-token', 'content-type': 'application/json' },
      payload: { ...validBody, bodyFatPercent: 2 },
    })

    expect(res.statusCode).toBe(400)
    const body = JSON.parse(res.body)
    expect(body.details.bodyFatPercent).toBeDefined()
  })

  it('retorna 400 quando bodyFatPercent está acima do range (> 70)', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/users/me/profile',
      headers: { authorization: 'Bearer fake-token', 'content-type': 'application/json' },
      payload: { ...validBody, bodyFatPercent: 70.5 },
    })

    expect(res.statusCode).toBe(400)
    const body = JSON.parse(res.body)
    expect(body.details.bodyFatPercent).toBeDefined()
  })

  it('retorna 400 quando idade é menor que 10 anos', async () => {
    const birthDate = new Date()
    birthDate.setFullYear(birthDate.getFullYear() - 5)

    const res = await app.inject({
      method: 'PUT',
      url: '/users/me/profile',
      headers: { authorization: 'Bearer fake-token', 'content-type': 'application/json' },
      payload: { ...validBody, birthDate: birthDate.toISOString().split('T')[0] },
    })

    expect(res.statusCode).toBe(400)
    const body = JSON.parse(res.body)
    expect(body.details.birthDate).toBeDefined()
  })

  it('retorna 400 quando idade é maior que 120 anos', async () => {
    const birthDate = new Date()
    birthDate.setFullYear(birthDate.getFullYear() - 130)

    const res = await app.inject({
      method: 'PUT',
      url: '/users/me/profile',
      headers: { authorization: 'Bearer fake-token', 'content-type': 'application/json' },
      payload: { ...validBody, birthDate: birthDate.toISOString().split('T')[0] },
    })

    expect(res.statusCode).toBe(400)
    const body = JSON.parse(res.body)
    expect(body.details.birthDate).toBeDefined()
  })

  it('retorna 400 quando birthDate está no futuro', async () => {
    const future = new Date()
    future.setFullYear(future.getFullYear() + 1)

    const res = await app.inject({
      method: 'PUT',
      url: '/users/me/profile',
      headers: { authorization: 'Bearer fake-token', 'content-type': 'application/json' },
      payload: { ...validBody, birthDate: future.toISOString().split('T')[0] },
    })

    expect(res.statusCode).toBe(400)
    const body = JSON.parse(res.body)
    expect(body.details.birthDate).toBeDefined()
  })

  it('retorna 400 quando sex é inválido', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/users/me/profile',
      headers: { authorization: 'Bearer fake-token', 'content-type': 'application/json' },
      payload: { ...validBody, sex: 'other' },
    })

    expect(res.statusCode).toBe(400)
    const body = JSON.parse(res.body)
    expect(body.details.sex).toBeDefined()
  })

  it('retorna 401 quando autenticação falha', async () => {
    vi.mocked(authenticate).mockImplementationOnce(async (_req, reply) => {
      return reply.status(401).send({ error: 'Token ausente' })
    })

    const res = await app.inject({
      method: 'PUT',
      url: '/users/me/profile',
      headers: { 'content-type': 'application/json' },
      payload: validBody,
    })

    expect(res.statusCode).toBe(401)
    expect(mockUpsertProfile).not.toHaveBeenCalled()
  })
})
