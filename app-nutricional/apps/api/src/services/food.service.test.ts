import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FoodService } from './food.service'
import type { FoodRepository, FoodWithMeasures } from '../repositories/food.repository'

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

describe('FoodService.search', () => {
  let service: FoodService
  let mockRepo: { search: ReturnType<typeof vi.fn> }

  beforeEach(() => {
    mockRepo = { search: vi.fn() }
    service = new FoodService(mockRepo as unknown as FoodRepository)
  })

  it('delega a busca ao repositório com os parâmetros corretos', async () => {
    mockRepo.search.mockResolvedValue([mockFood])

    const results = await service.search('arroz', 10)

    expect(mockRepo.search).toHaveBeenCalledOnce()
    expect(mockRepo.search).toHaveBeenCalledWith('arroz', 10)
    expect(results).toEqual([mockFood])
  })

  it('retorna lista vazia quando repositório retorna vazio', async () => {
    mockRepo.search.mockResolvedValue([])

    const results = await service.search('xyz', 10)

    expect(results).toEqual([])
  })

  it('propaga erros do repositório sem engolir', async () => {
    mockRepo.search.mockRejectedValue(new Error('DB connection failed'))

    await expect(service.search('arroz', 10)).rejects.toThrow('DB connection failed')
  })
})

describe('FoodService.findById', () => {
  let service: FoodService
  let mockRepo: { search: ReturnType<typeof vi.fn>; findById: ReturnType<typeof vi.fn> }

  beforeEach(() => {
    mockRepo = { search: vi.fn(), findById: vi.fn() }
    service = new FoodService(mockRepo as unknown as FoodRepository)
  })

  it('delega ao repositório com o id correto e retorna o food', async () => {
    mockRepo.findById.mockResolvedValue(mockFood)

    const result = await service.findById(mockFood.id)

    expect(mockRepo.findById).toHaveBeenCalledOnce()
    expect(mockRepo.findById).toHaveBeenCalledWith(mockFood.id)
    expect(result).toEqual(mockFood)
  })

  it('propaga null quando repositório retorna null', async () => {
    mockRepo.findById.mockResolvedValue(null)

    const result = await service.findById('00000000-0000-0000-0000-000000000000')

    expect(result).toBeNull()
  })

  it('propaga erros do repositório sem engolir', async () => {
    mockRepo.findById.mockRejectedValue(new Error('DB connection failed'))

    await expect(service.findById(mockFood.id)).rejects.toThrow('DB connection failed')
  })
})
