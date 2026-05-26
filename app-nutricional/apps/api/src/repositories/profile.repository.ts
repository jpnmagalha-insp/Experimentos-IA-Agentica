import { UserProfile } from '@prisma/client'
import { prisma } from '../lib/prisma'

type ProfileUpsertData = {
  birthDate: Date
  sex: 'male' | 'female'
  heightCm: number
  weightKg: number
  bodyFatPercent?: number | null
  tmb: number
}

export const profileRepository = {
  upsert(userId: string, data: ProfileUpsertData): Promise<UserProfile> {
    return prisma.userProfile.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    })
  },
}
