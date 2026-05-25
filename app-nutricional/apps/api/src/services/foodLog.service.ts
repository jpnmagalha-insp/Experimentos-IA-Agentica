import type { FoodLogRepository, FoodLogWithFood } from '../repositories/foodLog.repository'
import type { FoodRepository } from '../repositories/food.repository'
import type { CreateLogDto, CreateLogResponseDto, DailyLogsResponseDto, FoodLogItemDto, UpdateLogDto, UpdateLogResponseDto } from '@nutri-ia/shared'
import { MealType } from '@prisma/client'
import { NotFoundError, ForbiddenError } from '../lib/errors'
import { calculateFoodMacros } from '../calculators/food-macros.calculator'

export class FoodLogService {
  constructor(
    private readonly foodLogRepository: FoodLogRepository,
    private readonly foodRepository: FoodRepository,
  ) {}

  async getDailyLogs(userId: string, date: string): Promise<DailyLogsResponseDto> {
    const logs = await this.foodLogRepository.findByUserAndDate(userId, date)

    const meals: Record<MealType, FoodLogItemDto[]> = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: [],
    }

    const totals = { calories: 0, proteinG: 0, fatG: 0, carbG: 0 }

    for (const log of logs) {
      meals[log.mealType].push(toItem(log))
      totals.calories += log.calories
      totals.proteinG += log.proteinG
      totals.fatG += log.fatG
      totals.carbG += log.carbG
    }

    return {
      date,
      meals,
      totals: {
        calories: round2(totals.calories),
        proteinG: round2(totals.proteinG),
        fatG: round2(totals.fatG),
        carbG: round2(totals.carbG),
      },
    }
  }

  async createLog(userId: string, dto: CreateLogDto): Promise<CreateLogResponseDto> {
    const food = await this.foodRepository.findById(dto.foodId)
    if (!food) {
      throw new NotFoundError('Food not found')
    }

    let measure: { gramsEquivalent: number } | undefined
    if (dto.unit === 'measure') {
      const found = food.measures.find((m) => m.id === dto.foodMeasureId)
      if (!found) {
        throw new NotFoundError('Food measure not found')
      }
      measure = found
    }

    const macros = calculateFoodMacros(food, dto.quantity, dto.unit, measure)
    const logDate = new Date(`${dto.logDate}T00:00:00.000Z`)
    const foodMeasureId = dto.unit === 'measure' ? (dto.foodMeasureId ?? null) : null

    const created = await this.foodLogRepository.create({
      userId,
      foodId: dto.foodId,
      logDate,
      mealType: dto.mealType,
      quantity: dto.quantity,
      unit: dto.unit,
      foodMeasureId,
      ...macros,
    })

    return {
      id: created.id,
      food: { id: created.food.id, name: created.food.name },
      mealType: created.mealType,
      quantity: created.quantity,
      unit: created.unit as 'g' | 'measure',
      calories: created.calories,
      proteinG: created.proteinG,
      fatG: created.fatG,
      carbG: created.carbG,
    }
  }

  async updateLog(userId: string, logId: string, dto: UpdateLogDto): Promise<UpdateLogResponseDto> {
    const log = await this.foodLogRepository.findById(logId)
    if (!log) {
      throw new NotFoundError('Food log not found')
    }
    if (log.userId !== userId) {
      throw new ForbiddenError('Access denied')
    }

    let measure: { gramsEquivalent: number } | undefined
    if (dto.unit === 'measure') {
      const found = log.food.measures.find((m) => m.id === dto.foodMeasureId)
      if (!found) {
        throw new NotFoundError('Food measure not found')
      }
      measure = found
    }

    const macros = calculateFoodMacros(log.food, dto.quantity, dto.unit, measure)
    const foodMeasureId = dto.unit === 'measure' ? (dto.foodMeasureId ?? null) : null

    const updated = await this.foodLogRepository.update(logId, {
      quantity: dto.quantity,
      unit: dto.unit,
      foodMeasureId,
      ...macros,
    })

    return {
      id: updated.id,
      food: { id: updated.food.id, name: updated.food.name },
      mealType: updated.mealType,
      quantity: updated.quantity,
      unit: updated.unit as 'g' | 'measure',
      calories: updated.calories,
      proteinG: updated.proteinG,
      fatG: updated.fatG,
      carbG: updated.carbG,
    }
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function toItem(log: FoodLogWithFood): FoodLogItemDto {
  return {
    id: log.id,
    food: { id: log.food.id, name: log.food.name },
    quantity: log.quantity,
    unit: log.unit,
    calories: log.calories,
    proteinG: log.proteinG,
    fatG: log.fatG,
    carbG: log.carbG,
  }
}
