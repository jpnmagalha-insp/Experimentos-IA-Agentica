import { prisma } from '../lib/prisma'
import type { FoodLog, MealType } from '@prisma/client'

export type FoodLogWithFood = FoodLog & { food: { id: string; name: string } }

export type FoodLogWithFoodAndMeasures = FoodLog & {
  food: {
    id: string
    name: string
    caloriesPer100g: number
    proteinPer100g: number
    fatPer100g: number
    carbPer100g: number
    measures: { id: string; gramsEquivalent: number }[]
  }
}

export type CreateFoodLogData = {
  userId: string
  foodId: string
  logDate: Date
  mealType: MealType
  quantity: number
  unit: string
  foodMeasureId: string | null
  calories: number
  proteinG: number
  fatG: number
  carbG: number
}

export type UpdateFoodLogData = {
  quantity: number
  unit: string
  foodMeasureId: string | null
  calories: number
  proteinG: number
  fatG: number
  carbG: number
}

export class FoodLogRepository {
  async findByUserAndDate(userId: string, logDate: string): Promise<FoodLogWithFood[]> {
    return prisma.foodLog.findMany({
      where: { userId, logDate: new Date(`${logDate}T00:00:00.000Z`) },
      include: { food: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'asc' },
    })
  }

  async create(data: CreateFoodLogData): Promise<FoodLogWithFood> {
    return prisma.foodLog.create({
      data,
      include: { food: { select: { id: true, name: true } } },
    })
  }

  async findById(id: string): Promise<FoodLogWithFoodAndMeasures | null> {
    return prisma.foodLog.findUnique({
      where: { id },
      include: {
        food: {
          select: {
            id: true,
            name: true,
            caloriesPer100g: true,
            proteinPer100g: true,
            fatPer100g: true,
            carbPer100g: true,
            measures: { select: { id: true, gramsEquivalent: true } },
          },
        },
      },
    })
  }

  async update(id: string, data: UpdateFoodLogData): Promise<FoodLogWithFood> {
    return prisma.foodLog.update({
      where: { id },
      data,
      include: { food: { select: { id: true, name: true } } },
    })
  }
}
