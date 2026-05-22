import Fastify from 'fastify'
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest'
import { foodsPlugin } from './foods.routes'
import type { FoodService } from '../services/food.service'
import type { FoodWithMeasures } from '../repositories/food.repository'

const mockFood: FoodWithMeasures = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'Arroz, branco, cozido',
  tacoId: '1',
  caloriesPer100g: 128,
  proteinPer100g: 2.5,
  fatPer100g: 0.2,
  carbPer100g: 28.1,
  category: 'Cereais e derivados',
  measures: [
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      foodId: '550e8400-e29b-41d4-a716-446655440000',
      description: 'colher de sopa cheia',
      gramsEquivalent: 25,
    },
  ],
}

describe('GET /foods/search', () => {
  let app: ReturnType<typeof Fastify>
  const mockService = { search: vi.fn() }

  beforeAll(async () => {
    app = Fastify({ logger: false })
    await app.register(foodsPlugin, { foodService: mockService as unknown as FoodService })
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retorna 400 quando q não é fornecido', async () => {
    const res = await app.inject({ method: 'GET', url: '/foods/search' })
    expect(res.statusCode).toBe(400)
  })

  it('retorna 400 quando q tem menos de 2 caracteres', async () => {
    const res = await app.inject({ method: 'GET', url: '/foods/search?q=a' })
    expect(res.statusCode).toBe(400)
  })

  it('retorna 400 quando limit é maior que 30', async () => {
    const res = await app.inject({ method: 'GET', url: '/foods/search?q=arroz&limit=31' })
    expect(res.statusCode).toBe(400)
  })

  it('retorna 200 com envelope { foods[] } em busca válida', async () => {
    mockService.search.mockResolvedValue([mockFood])

    const res = await app.inject({ method: 'GET', url: '/foods/search?q=arroz' })

    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body).toHaveProperty('foods')
    expect(body.foods).toBeInstanceOf(Array)
    expect(body.foods[0].id).toBe(mockFood.id)
    expect(body.foods[0].measures).toBeInstanceOf(Array)
  })

  it('retorna 200 com foods=[] quando nenhum alimento encontrado (não 404)', async () => {
    mockService.search.mockResolvedValue([])

    const res = await app.inject({ method: 'GET', url: '/foods/search?q=xyzxyz' })

    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body).foods).toEqual([])
  })

  it('usa limit=10 por padrão', async () => {
    mockService.search.mockResolvedValue([])

    await app.inject({ method: 'GET', url: '/foods/search?q=arroz' })

    expect(mockService.search).toHaveBeenCalledWith('arroz', 10)
  })

  it('passa limit customizado ao service', async () => {
    mockService.search.mockResolvedValue([])

    await app.inject({ method: 'GET', url: '/foods/search?q=arroz&limit=5' })

    expect(mockService.search).toHaveBeenCalledWith('arroz', 5)
  })
})
