import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { FoodLogRepository } from './foodLog.repository'
import type { FoodLogWithFoodAndMeasures, FoodLogWithFood } from './foodLog.repository'
import { prisma } from '../lib/prisma'

describe('FoodLogRepository.findByUserAndDate', () => {
  const repo = new FoodLogRepository()

  let userId: string
  let otherUserId: string
  let foodId: string
  let logOnTargetDateId: string
  let logOnOtherDateId: string
  let logOtherUserId: string

  const TARGET_DATE = '2026-01-15'
  const OTHER_DATE = '2026-01-16'

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        name: 'Test User FoodLog',
        email: `test-foodlog-repo-${Date.now()}@example.com`,
      },
    })
    userId = user.id

    const otherUser = await prisma.user.create({
      data: {
        name: 'Other User FoodLog',
        email: `other-foodlog-repo-${Date.now()}@example.com`,
      },
    })
    otherUserId = otherUser.id

    const food = await prisma.food.create({
      data: {
        name: 'Banana prata',
        caloriesPer100g: 89,
        proteinPer100g: 1.1,
        fatPer100g: 0.3,
        carbPer100g: 22.8,
      },
    })
    foodId = food.id

    const logBreakfast = await prisma.foodLog.create({
      data: {
        userId,
        foodId,
        logDate: new Date(`${TARGET_DATE}T00:00:00.000Z`),
        mealType: 'breakfast',
        quantity: 100,
        unit: 'g',
        calories: 89,
        proteinG: 1.1,
        fatG: 0.3,
        carbG: 22.8,
        createdAt: new Date('2026-01-15T07:00:00Z'),
      },
    })
    logOnTargetDateId = logBreakfast.id

    await prisma.foodLog.create({
      data: {
        userId,
        foodId,
        logDate: new Date(`${TARGET_DATE}T00:00:00.000Z`),
        mealType: 'lunch',
        quantity: 150,
        unit: 'g',
        calories: 133.5,
        proteinG: 1.65,
        fatG: 0.45,
        carbG: 34.2,
        createdAt: new Date('2026-01-15T12:00:00Z'),
      },
    })

    const logOnOtherDate = await prisma.foodLog.create({
      data: {
        userId,
        foodId,
        logDate: new Date(`${OTHER_DATE}T00:00:00.000Z`),
        mealType: 'breakfast',
        quantity: 100,
        unit: 'g',
        calories: 89,
        proteinG: 1.1,
        fatG: 0.3,
        carbG: 22.8,
      },
    })
    logOnOtherDateId = logOnOtherDate.id

    const logOtherUser = await prisma.foodLog.create({
      data: {
        userId: otherUserId,
        foodId,
        logDate: new Date(`${TARGET_DATE}T00:00:00.000Z`),
        mealType: 'breakfast',
        quantity: 100,
        unit: 'g',
        calories: 89,
        proteinG: 1.1,
        fatG: 0.3,
        carbG: 22.8,
      },
    })
    logOtherUserId = logOtherUser.id
  })

  afterAll(async () => {
    if (!userId || !otherUserId) return
    await prisma.foodLog.deleteMany({ where: { userId: { in: [userId, otherUserId] } } })
    await prisma.food.delete({ where: { id: foodId } })
    await prisma.user.deleteMany({ where: { id: { in: [userId, otherUserId] } } })
  })

  it('retorna [] quando não há logs para o userId e logDate informados', async () => {
    const results = await repo.findByUserAndDate(userId, '2000-01-01')

    expect(results).toEqual([])
  })

  it('retorna os logs do userId e logDate correto com food: { id, name } incluído', async () => {
    const results = await repo.findByUserAndDate(userId, TARGET_DATE)

    expect(results.length).toBeGreaterThan(0)
    const log = results.find(r => r.id === logOnTargetDateId)
    expect(log).toBeDefined()
    expect(log!.food).toMatchObject({
      id: foodId,
      name: 'Banana prata',
    })
  })

  it('não retorna logs de outro userId (isolamento por usuário)', async () => {
    const results = await repo.findByUserAndDate(userId, TARGET_DATE)

    const ids = results.map(r => r.id)
    expect(ids).not.toContain(logOtherUserId)
  })

  it('não retorna logs de outro logDate (isolamento por data)', async () => {
    const results = await repo.findByUserAndDate(userId, TARGET_DATE)

    const ids = results.map(r => r.id)
    expect(ids).not.toContain(logOnOtherDateId)
  })

  it('ordena os resultados por createdAt asc', async () => {
    const results = await repo.findByUserAndDate(userId, TARGET_DATE)

    expect(results.length).toBeGreaterThanOrEqual(2)
    for (let i = 1; i < results.length; i++) {
      expect(results[i].createdAt.getTime()).toBeGreaterThanOrEqual(
        results[i - 1].createdAt.getTime(),
      )
    }
  })
})

describe('FoodLogRepository.create', () => {
  const repo = new FoodLogRepository()

  let userId: string
  let foodId: string

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        name: 'Test User FoodLog Create',
        email: `test-foodlog-create-${Date.now()}@example.com`,
      },
    })
    userId = user.id

    const food = await prisma.food.create({
      data: {
        name: 'Maçã fuji',
        caloriesPer100g: 52,
        proteinPer100g: 0.3,
        fatPer100g: 0.2,
        carbPer100g: 13.8,
      },
    })
    foodId = food.id
  })

  afterAll(async () => {
    if (!userId) return
    await prisma.foodLog.deleteMany({ where: { userId } })
    await prisma.food.delete({ where: { id: foodId } })
    await prisma.user.delete({ where: { id: userId } })
  })

  it('cria e retorna FoodLogWithFood com food: { id, name } incluído', async () => {
    const result = await repo.create({
      userId,
      foodId,
      logDate: new Date('2026-05-25T00:00:00.000Z'),
      mealType: 'breakfast',
      quantity: 100,
      unit: 'g',
      foodMeasureId: null,
      calories: 52,
      proteinG: 0.3,
      fatG: 0.2,
      carbG: 13.8,
    })

    expect(result.id).toBeDefined()
    expect(result.userId).toBe(userId)
    expect(result.foodId).toBe(foodId)
    expect(result.mealType).toBe('breakfast')
    expect(result.quantity).toBe(100)
    expect(result.unit).toBe('g')
    expect(result.foodMeasureId).toBeNull()
    expect(result.calories).toBe(52)
    expect(result.proteinG).toBe(0.3)
    expect(result.fatG).toBe(0.2)
    expect(result.carbG).toBe(13.8)
    expect(result.food).toMatchObject({ id: foodId, name: 'Maçã fuji' })
  })

  it('o registro criado é acessível via prisma.foodLog.findUnique com todos os campos persistidos', async () => {
    const created = await repo.create({
      userId,
      foodId,
      logDate: new Date('2026-05-26T00:00:00.000Z'),
      mealType: 'lunch',
      quantity: 150,
      unit: 'g',
      foodMeasureId: null,
      calories: 78,
      proteinG: 0.45,
      fatG: 0.3,
      carbG: 20.7,
    })

    const persisted = await prisma.foodLog.findUnique({ where: { id: created.id } })

    expect(persisted).not.toBeNull()
    expect(persisted!.userId).toBe(userId)
    expect(persisted!.foodId).toBe(foodId)
    expect(persisted!.mealType).toBe('lunch')
    expect(persisted!.quantity).toBe(150)
    expect(persisted!.calories).toBe(78)
    expect(persisted!.logDate).toEqual(new Date('2026-05-26T00:00:00.000Z'))
  })
})

describe('FoodLogRepository.findById', () => {
  const repo = new FoodLogRepository()

  let userId: string
  let foodId: string
  let measureId: string
  let logId: string

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        name: 'Test User FindById',
        email: `test-foodlog-findbyid-${Date.now()}@example.com`,
      },
    })
    userId = user.id

    const food = await prisma.food.create({
      data: {
        name: 'Arroz cozido',
        caloriesPer100g: 130,
        proteinPer100g: 2.5,
        fatPer100g: 0.2,
        carbPer100g: 28.1,
        measures: {
          create: [{ description: 'colher de sopa', gramsEquivalent: 25 }],
        },
      },
      include: { measures: true },
    })
    foodId = food.id
    measureId = food.measures[0].id

    const log = await prisma.foodLog.create({
      data: {
        userId,
        foodId,
        logDate: new Date('2026-05-25T00:00:00.000Z'),
        mealType: 'lunch',
        quantity: 100,
        unit: 'g',
        foodMeasureId: null,
        calories: 130,
        proteinG: 2.5,
        fatG: 0.2,
        carbG: 28.1,
      },
    })
    logId = log.id
  })

  afterAll(async () => {
    if (!userId) return
    await prisma.foodLog.deleteMany({ where: { userId } })
    await prisma.foodMeasure.deleteMany({ where: { foodId } })
    await prisma.food.delete({ where: { id: foodId } })
    await prisma.user.delete({ where: { id: userId } })
  })

  it('retorna null para id inexistente', async () => {
    const result = await repo.findById('00000000-0000-0000-0000-000000000000')

    expect(result).toBeNull()
  })

  it('retorna o log com food.measures quando encontrado', async () => {
    const result: FoodLogWithFoodAndMeasures | null = await repo.findById(logId)

    expect(result).not.toBeNull()
    expect(result!.id).toBe(logId)
    expect(result!.food.id).toBe(foodId)
    expect(result!.food.name).toBe('Arroz cozido')
    expect(result!.food.caloriesPer100g).toBe(130)
    expect(result!.food.proteinPer100g).toBe(2.5)
    expect(result!.food.fatPer100g).toBe(0.2)
    expect(result!.food.carbPer100g).toBe(28.1)
    expect(result!.food.measures).toHaveLength(1)
    expect(result!.food.measures[0].id).toBe(measureId)
    expect(result!.food.measures[0].gramsEquivalent).toBe(25)
  })
})

describe('FoodLogRepository.delete', () => {
  const repo = new FoodLogRepository()

  let userId: string
  let foodId: string
  let logId: string

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        name: 'Test User Delete',
        email: `test-foodlog-delete-${Date.now()}@example.com`,
      },
    })
    userId = user.id

    const food = await prisma.food.create({
      data: {
        name: 'Laranja pera',
        caloriesPer100g: 43,
        proteinPer100g: 0.8,
        fatPer100g: 0.1,
        carbPer100g: 10.8,
      },
    })
    foodId = food.id

    const log = await prisma.foodLog.create({
      data: {
        userId,
        foodId,
        logDate: new Date('2026-05-25T00:00:00.000Z'),
        mealType: 'snack',
        quantity: 150,
        unit: 'g',
        foodMeasureId: null,
        calories: 64.5,
        proteinG: 1.2,
        fatG: 0.15,
        carbG: 16.2,
      },
    })
    logId = log.id
  })

  afterAll(async () => {
    if (!userId) return
    await prisma.foodLog.deleteMany({ where: { userId } })
    await prisma.food.delete({ where: { id: foodId } })
    await prisma.user.delete({ where: { id: userId } })
  })

  it('deleta o registro e ele não é mais encontrado via findUnique', async () => {
    await repo.delete(logId)

    const persisted = await prisma.foodLog.findUnique({ where: { id: logId } })
    expect(persisted).toBeNull()
  })
})

describe('FoodLogRepository.update', () => {
  const repo = new FoodLogRepository()

  let userId: string
  let foodId: string
  let logId: string

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        name: 'Test User Update',
        email: `test-foodlog-update-${Date.now()}@example.com`,
      },
    })
    userId = user.id

    const food = await prisma.food.create({
      data: {
        name: 'Feijão carioca cozido',
        caloriesPer100g: 77,
        proteinPer100g: 4.8,
        fatPer100g: 0.5,
        carbPer100g: 13.6,
      },
    })
    foodId = food.id

    const log = await prisma.foodLog.create({
      data: {
        userId,
        foodId,
        logDate: new Date('2026-05-25T00:00:00.000Z'),
        mealType: 'dinner',
        quantity: 100,
        unit: 'g',
        foodMeasureId: null,
        calories: 77,
        proteinG: 4.8,
        fatG: 0.5,
        carbG: 13.6,
      },
    })
    logId = log.id
  })

  afterAll(async () => {
    if (!userId) return
    await prisma.foodLog.deleteMany({ where: { userId } })
    await prisma.food.delete({ where: { id: foodId } })
    await prisma.user.delete({ where: { id: userId } })
  })

  it('persiste a nova quantity, unit e macros recalculados', async () => {
    await repo.update(logId, {
      quantity: 200,
      unit: 'g',
      foodMeasureId: null,
      calories: 154,
      proteinG: 9.6,
      fatG: 1.0,
      carbG: 27.2,
    })

    const persisted = await prisma.foodLog.findUnique({ where: { id: logId } })

    expect(persisted).not.toBeNull()
    expect(persisted!.quantity).toBe(200)
    expect(persisted!.unit).toBe('g')
    expect(persisted!.calories).toBe(154)
    expect(persisted!.proteinG).toBe(9.6)
    expect(persisted!.fatG).toBe(1.0)
    expect(persisted!.carbG).toBe(27.2)
  })

  it('retorna FoodLogWithFood com food: { id, name }', async () => {
    const result: FoodLogWithFood = await repo.update(logId, {
      quantity: 150,
      unit: 'g',
      foodMeasureId: null,
      calories: 115.5,
      proteinG: 7.2,
      fatG: 0.75,
      carbG: 20.4,
    })

    expect(result.id).toBe(logId)
    expect(result.quantity).toBe(150)
    expect(result.calories).toBe(115.5)
    expect(result.food).toMatchObject({ id: foodId, name: 'Feijão carioca cozido' })
    expect(Object.keys(result.food)).toEqual(expect.arrayContaining(['id', 'name']))
    expect(Object.keys(result.food)).not.toContain('caloriesPer100g')
  })
})
