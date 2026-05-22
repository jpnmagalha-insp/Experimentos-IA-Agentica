import { prisma } from '../lib/prisma'

export const userRepository = {
  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } })
  },

  findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: { profile: true, goals: { orderBy: { calculatedAt: 'desc' }, take: 1 } },
    })
  },

  findByProvider(provider: string, providerId: string) {
    return prisma.user.findFirst({ where: { provider, providerId } })
  },

  create(data: {
    name: string
    email: string
    passwordHash?: string
    provider?: string
    providerId?: string
    emailVerified?: boolean
  }) {
    return prisma.user.create({ data })
  },
}
