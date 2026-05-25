import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FoodLogService } from './foodLog.service'
import type { FoodLogRepository, FoodLogWithFood } from '../repositories/foodLog.repository'

const makeFoodLog = (overrides: Partial<FoodLogWithFood> = {}): FoodLogWithFood => ({
  id: '550e8400-e29b-41d4-a716-446655440010',
  userId: 'user-00000000-0000-0000-0000-000000000001',
  foodId: '550e8400-e29b-41d4-a716-446655440000',
  logDate: new Date('2026-05-25'),
  mealType: 'breakfast',
  quantity: 40,
  unit: 'g',
  foodMeasureId: null,
  calories: 148,
  proteinG: 5.2,
  fatG: 2.8,
  carbG: 25.7,
  createdAt: new Date('2026-05-25T08:00:00Z'),
  food: { id: '550e8400-e29b-41d4-a716-446655440000', name: 'Aveia' },
  ...overrides,
})

describe('FoodLogService.getDailyLogs', () => {
  let service: FoodLogService
  let mockRepo: { findByUserAndDate: ReturnType<typeof vi.fn> }

  beforeEach(() => {
    mockRepo = { findByUserAndDate: vi.fn() }
    service = new FoodLogService(mockRepo as unknown as FoodLogRepository)
  })

  it('retorna meals com 4 arrays vazios e totals zerados quando repository retorna []', async () => {
    mockRepo.findByUserAndDate.mockResolvedValue([])

    const result = await service.getDailyLogs('user-id', '2026-05-25')

    expect(result.date).toBe('2026-05-25')
    expect(result.meals).toEqual({
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: [],
    })
    expect(result.totals).toEqual({
      calories: 0,
      proteinG: 0,
      fatG: 0,
      carbG: 0,
    })
  })

  it('agrupa log com mealType "breakfast" em meals.breakfast', async () => {
    const log = makeFoodLog({ mealType: 'breakfast' })
    mockRepo.findByUserAndDate.mockResolvedValue([log])

    const result = await service.getDailyLogs('user-id', '2026-05-25')

    expect(result.meals.breakfast).toHaveLength(1)
    expect(result.meals.lunch).toHaveLength(0)
    expect(result.meals.dinner).toHaveLength(0)
    expect(result.meals.snack).toHaveLength(0)
  })

  it('agrupa log com mealType "lunch" em meals.lunch', async () => {
    const log = makeFoodLog({ mealType: 'lunch' })
    mockRepo.findByUserAndDate.mockResolvedValue([log])

    const result = await service.getDailyLogs('user-id', '2026-05-25')

    expect(result.meals.lunch).toHaveLength(1)
    expect(result.meals.breakfast).toHaveLength(0)
  })

  it('agrupa log com mealType "dinner" em meals.dinner', async () => {
    const log = makeFoodLog({ mealType: 'dinner' })
    mockRepo.findByUserAndDate.mockResolvedValue([log])

    const result = await service.getDailyLogs('user-id', '2026-05-25')

    expect(result.meals.dinner).toHaveLength(1)
    expect(result.meals.breakfast).toHaveLength(0)
  })

  it('agrupa log com mealType "snack" em meals.snack', async () => {
    const log = makeFoodLog({ mealType: 'snack' })
    mockRepo.findByUserAndDate.mockResolvedValue([log])

    const result = await service.getDailyLogs('user-id', '2026-05-25')

    expect(result.meals.snack).toHaveLength(1)
    expect(result.meals.breakfast).toHaveLength(0)
  })

  it('soma calories, proteinG, fatG e carbG corretamente em totals com múltiplos logs', async () => {
    const log1 = makeFoodLog({
      id: '550e8400-e29b-41d4-a716-446655440011',
      mealType: 'breakfast',
      calories: 148,
      proteinG: 5.2,
      fatG: 2.8,
      carbG: 25.7,
    })
    const log2 = makeFoodLog({
      id: '550e8400-e29b-41d4-a716-446655440012',
      mealType: 'lunch',
      calories: 350,
      proteinG: 30.0,
      fatG: 8.5,
      carbG: 40.0,
    })
    mockRepo.findByUserAndDate.mockResolvedValue([log1, log2])

    const result = await service.getDailyLogs('user-id', '2026-05-25')

    expect(result.totals.calories).toBeCloseTo(498)
    expect(result.totals.proteinG).toBeCloseTo(35.2)
    expect(result.totals.fatG).toBeCloseTo(11.3)
    expect(result.totals.carbG).toBeCloseTo(65.7)
  })

  it('as 4 chaves de meals estão sempre presentes mesmo quando só um mealType tem dados', async () => {
    const log = makeFoodLog({ mealType: 'dinner' })
    mockRepo.findByUserAndDate.mockResolvedValue([log])

    const result = await service.getDailyLogs('user-id', '2026-05-25')

    expect(result.meals).toHaveProperty('breakfast')
    expect(result.meals).toHaveProperty('lunch')
    expect(result.meals).toHaveProperty('dinner')
    expect(result.meals).toHaveProperty('snack')
  })

  it('cada item em meals tem o shape correto: { id, food: { id, name }, quantity, unit, calories, proteinG, fatG, carbG }', async () => {
    const log = makeFoodLog({
      id: '550e8400-e29b-41d4-a716-446655440010',
      mealType: 'breakfast',
      quantity: 40,
      unit: 'g',
      calories: 148,
      proteinG: 5.2,
      fatG: 2.8,
      carbG: 25.7,
      food: { id: '550e8400-e29b-41d4-a716-446655440000', name: 'Aveia' },
    })
    mockRepo.findByUserAndDate.mockResolvedValue([log])

    const result = await service.getDailyLogs('user-id', '2026-05-25')
    const item = result.meals.breakfast[0]

    expect(item).toMatchObject({
      id: '550e8400-e29b-41d4-a716-446655440010',
      food: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Aveia',
      },
      quantity: 40,
      unit: 'g',
      calories: 148,
      proteinG: 5.2,
      fatG: 2.8,
      carbG: 25.7,
    })
  })

  it('delega ao repository com userId e date corretos', async () => {
    mockRepo.findByUserAndDate.mockResolvedValue([])

    await service.getDailyLogs('user-abc', '2026-05-25')

    expect(mockRepo.findByUserAndDate).toHaveBeenCalledOnce()
    expect(mockRepo.findByUserAndDate).toHaveBeenCalledWith('user-abc', '2026-05-25')
  })

  it('propaga erros do repository sem capturar', async () => {
    mockRepo.findByUserAndDate.mockRejectedValue(new Error('DB error'))

    await expect(service.getDailyLogs('user-id', '2026-05-25')).rejects.toThrow('DB error')
  })
})
