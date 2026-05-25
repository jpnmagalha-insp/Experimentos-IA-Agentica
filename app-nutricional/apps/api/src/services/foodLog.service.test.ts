import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FoodLogService } from './foodLog.service'
import type { FoodLogRepository, FoodLogWithFood } from '../repositories/foodLog.repository'
import type { FoodRepository, FoodWithMeasures } from '../repositories/food.repository'
import { NotFoundError } from '../lib/errors'

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
    service = new FoodLogService(mockRepo as unknown as FoodLogRepository, {} as unknown as FoodRepository)
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

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const FOOD_ID = '550e8400-e29b-41d4-a716-446655440000'
const MEASURE_ID = '550e8400-e29b-41d4-a716-446655440001'
const LOG_ID = '550e8400-e29b-41d4-a716-446655440010'
const USER_ID = 'user-00000000-0000-0000-0000-000000000001'

const mockFoodNoMeasures: FoodWithMeasures = {
  id: FOOD_ID,
  name: 'Banana prata',
  tacoId: '1',
  caloriesPer100g: 89,
  proteinPer100g: 1.1,
  fatPer100g: 0.3,
  carbPer100g: 22.8,
  category: 'Frutas',
  measures: [],
}

const mockFoodWithMeasure: FoodWithMeasures = {
  ...mockFoodNoMeasures,
  measures: [
    {
      id: MEASURE_ID,
      foodId: FOOD_ID,
      description: 'unidade média',
      gramsEquivalent: 120,
    },
  ],
}

const makeCreatedLog = (overrides: Partial<FoodLogWithFood> = {}): FoodLogWithFood => ({
  id: LOG_ID,
  userId: USER_ID,
  foodId: FOOD_ID,
  logDate: new Date('2026-05-25T00:00:00.000Z'),
  mealType: 'breakfast',
  quantity: 60,
  unit: 'g',
  foodMeasureId: null,
  calories: 53.4,
  proteinG: 0.7,
  fatG: 0.2,
  carbG: 13.7,
  createdAt: new Date('2026-05-25T08:00:00Z'),
  food: { id: FOOD_ID, name: 'Banana prata' },
  ...overrides,
})

// ---------------------------------------------------------------------------

describe('FoodLogService.createLog', () => {
  let service: FoodLogService
  let mockFoodLogRepo: { findByUserAndDate: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn> }
  let mockFoodRepo: { findById: ReturnType<typeof vi.fn> }

  beforeEach(() => {
    mockFoodLogRepo = { findByUserAndDate: vi.fn(), create: vi.fn() }
    mockFoodRepo = { findById: vi.fn() }
    service = new FoodLogService(
      mockFoodLogRepo as unknown as FoodLogRepository,
      mockFoodRepo as unknown as FoodRepository,
    )
  })

  it('retorna shape com 9 campos no path gramas (unit="g")', async () => {
    mockFoodRepo.findById.mockResolvedValue(mockFoodNoMeasures)
    const createdLog = makeCreatedLog()
    mockFoodLogRepo.create.mockResolvedValue(createdLog)

    const result = await service.createLog(USER_ID, {
      foodId: FOOD_ID,
      logDate: '2026-05-25',
      mealType: 'breakfast',
      quantity: 60,
      unit: 'g',
    })

    expect(result).toMatchObject({
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

  it('chama create com foodMeasureId correto no path medida (unit="measure")', async () => {
    mockFoodRepo.findById.mockResolvedValue(mockFoodWithMeasure)
    const createdLog = makeCreatedLog({
      quantity: 2,
      unit: 'measure',
      foodMeasureId: MEASURE_ID,
      calories: 213.6,
      proteinG: 2.6,
      fatG: 0.7,
      carbG: 54.7,
    })
    mockFoodLogRepo.create.mockResolvedValue(createdLog)

    await service.createLog(USER_ID, {
      foodId: FOOD_ID,
      logDate: '2026-05-25',
      mealType: 'breakfast',
      quantity: 2,
      unit: 'measure',
      foodMeasureId: MEASURE_ID,
    })

    expect(mockFoodLogRepo.create).toHaveBeenCalledOnce()
    expect(mockFoodLogRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ foodMeasureId: MEASURE_ID }),
    )
  })

  it('rejeita com NotFoundError "Food not found" quando food não existe', async () => {
    mockFoodRepo.findById.mockResolvedValue(null)

    await expect(
      service.createLog(USER_ID, {
        foodId: FOOD_ID,
        logDate: '2026-05-25',
        mealType: 'breakfast',
        quantity: 60,
        unit: 'g',
      }),
    ).rejects.toThrow(NotFoundError)

    await expect(
      service.createLog(USER_ID, {
        foodId: FOOD_ID,
        logDate: '2026-05-25',
        mealType: 'breakfast',
        quantity: 60,
        unit: 'g',
      }),
    ).rejects.toThrow('Food not found')

    expect(mockFoodLogRepo.create).not.toHaveBeenCalled()
  })

  it('rejeita com NotFoundError "Food measure not found" quando foodMeasureId não existe nas measures do alimento', async () => {
    mockFoodRepo.findById.mockResolvedValue(mockFoodNoMeasures)

    await expect(
      service.createLog(USER_ID, {
        foodId: FOOD_ID,
        logDate: '2026-05-25',
        mealType: 'breakfast',
        quantity: 2,
        unit: 'measure',
        foodMeasureId: 'non-existent-00000000-0000-0000-0000',
      }),
    ).rejects.toThrow(NotFoundError)

    await expect(
      service.createLog(USER_ID, {
        foodId: FOOD_ID,
        logDate: '2026-05-25',
        mealType: 'breakfast',
        quantity: 2,
        unit: 'measure',
        foodMeasureId: 'non-existent-00000000-0000-0000-0000',
      }),
    ).rejects.toThrow('Food measure not found')
  })

  it('arredonda os 4 macros para 1 decimal: 300g de alimento com caloriesPer100g=33.33', async () => {
    const specialFood: FoodWithMeasures = {
      ...mockFoodNoMeasures,
      caloriesPer100g: 33.33,
      proteinPer100g: 0,
      fatPer100g: 0,
      carbPer100g: 0,
    }
    mockFoodRepo.findById.mockResolvedValue(specialFood)
    const createdLog = makeCreatedLog({ calories: 100, proteinG: 0, fatG: 0, carbG: 0, quantity: 300 })
    mockFoodLogRepo.create.mockResolvedValue(createdLog)

    await service.createLog(USER_ID, {
      foodId: FOOD_ID,
      logDate: '2026-05-25',
      mealType: 'breakfast',
      quantity: 300,
      unit: 'g',
    })

    expect(mockFoodLogRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ calories: 100 }),
    )
  })

  it('converte dto.logDate string para Date UTC meia-noite ao chamar create', async () => {
    mockFoodRepo.findById.mockResolvedValue(mockFoodNoMeasures)
    mockFoodLogRepo.create.mockResolvedValue(makeCreatedLog())

    await service.createLog(USER_ID, {
      foodId: FOOD_ID,
      logDate: '2026-05-25',
      mealType: 'breakfast',
      quantity: 60,
      unit: 'g',
    })

    expect(mockFoodLogRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ logDate: new Date('2026-05-25T00:00:00.000Z') }),
    )
  })

  it('persiste foodMeasureId como null quando unit="g" mesmo que dto contenha foodMeasureId', async () => {
    mockFoodRepo.findById.mockResolvedValue(mockFoodWithMeasure)
    mockFoodLogRepo.create.mockResolvedValue(makeCreatedLog())

    await service.createLog(USER_ID, {
      foodId: FOOD_ID,
      logDate: '2026-05-25',
      mealType: 'breakfast',
      quantity: 60,
      unit: 'g',
      foodMeasureId: MEASURE_ID,
    })

    expect(mockFoodLogRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ foodMeasureId: null }),
    )
  })

  it('resposta não contém logDate, foodMeasureId nem createdAt', async () => {
    mockFoodRepo.findById.mockResolvedValue(mockFoodNoMeasures)
    mockFoodLogRepo.create.mockResolvedValue(makeCreatedLog())

    const result = await service.createLog(USER_ID, {
      foodId: FOOD_ID,
      logDate: '2026-05-25',
      mealType: 'breakfast',
      quantity: 60,
      unit: 'g',
    })

    expect(Object.keys(result)).not.toContain('logDate')
    expect(Object.keys(result)).not.toContain('foodMeasureId')
    expect(Object.keys(result)).not.toContain('createdAt')
  })

  it('propaga erros do repository sem capturar', async () => {
    mockFoodRepo.findById.mockResolvedValue(mockFoodNoMeasures)
    mockFoodLogRepo.create.mockRejectedValue(new Error('DB insert error'))

    await expect(
      service.createLog(USER_ID, {
        foodId: FOOD_ID,
        logDate: '2026-05-25',
        mealType: 'breakfast',
        quantity: 60,
        unit: 'g',
      }),
    ).rejects.toThrow('DB insert error')
  })
})
