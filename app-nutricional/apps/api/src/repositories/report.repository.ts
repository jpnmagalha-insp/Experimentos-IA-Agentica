import { prisma } from '../lib/prisma'
import { goalRepository } from './goal.repository'

export type ConsumedMacros = {
  calories: number
  proteinG: number
  fatG: number
  carbG: number
}

export class ReportRepository {
  async getConsumedByUserAndDate(userId: string, logDate: string): Promise<ConsumedMacros> {
    const result = await prisma.foodLog.aggregate({
      _sum: { calories: true, proteinG: true, fatG: true, carbG: true },
      where: { userId, logDate: new Date(`${logDate}T00:00:00.000Z`) },
    })
    return {
      calories: result._sum.calories ?? 0,
      proteinG: result._sum.proteinG ?? 0,
      fatG: result._sum.fatG ?? 0,
      carbG: result._sum.carbG ?? 0,
    }
  }

  async getLatestGoal(userId: string) {
    return goalRepository.findLatestByUser(userId)
  }
}
