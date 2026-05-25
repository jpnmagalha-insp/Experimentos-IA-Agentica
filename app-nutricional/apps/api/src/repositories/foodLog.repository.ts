import { prisma } from '../lib/prisma'
import type { FoodLog } from '@prisma/client'

export type FoodLogWithFood = FoodLog & { food: { id: string; name: string } }

export class FoodLogRepository {
  async findByUserAndDate(userId: string, logDate: string): Promise<FoodLogWithFood[]> {
    return prisma.foodLog.findMany({
      where: { userId, logDate: new Date(`${logDate}T00:00:00.000Z`) },
      include: { food: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'asc' },
    })
  }
}
