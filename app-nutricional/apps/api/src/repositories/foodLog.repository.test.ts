import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { FoodLogRepository } from './foodLog.repository'
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
