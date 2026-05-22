import { prisma } from '../lib/prisma'

export const goalRepository = {
  create(data: {
    userId: string
    calories: number
    proteinG: number
    fatG: number
    carbG: number
  }) {
    return prisma.nutritionalGoal.create({ data })
  },

  findLatestByUser(userId: string) {
    return prisma.nutritionalGoal.findFirst({
      where: { userId },
      orderBy: { calculatedAt: 'desc' },
    })
  },
}
