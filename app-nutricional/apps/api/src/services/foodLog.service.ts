import type { FoodLogRepository, FoodLogWithFood } from '../repositories/foodLog.repository'
import type { DailyLogsResponseDto, FoodLogItemDto } from '@nutri-ia/shared'
import { MealType } from '@prisma/client'

export class FoodLogService {
  constructor(private readonly foodLogRepository: FoodLogRepository) {}

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
