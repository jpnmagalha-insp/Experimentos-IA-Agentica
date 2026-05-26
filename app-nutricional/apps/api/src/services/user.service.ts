import { userRepository } from '../repositories/user.repository'
import { goalRepository } from '../repositories/goal.repository'
import { profileRepository } from '../repositories/profile.repository'
import { calculateTmb, calcAge } from '../calculators/tmb.calculator'
import { calculateMacroGoal } from '../calculators/macro-goal.calculator'
import { NotFoundError } from '../lib/errors'

export const userService = {
  async getMe(userId: string) {
    const user = await userRepository.findById(userId)
    if (!user) throw new NotFoundError('Usuário não encontrado')

    const goal = user.goals[0] ?? null
    const profile = user.profile

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      profile: profile
        ? {
            birthDate: profile.birthDate.toISOString().split('T')[0],
            sex: profile.sex,
            heightCm: profile.heightCm,
            weightKg: profile.weightKg,
            bodyFatPercent: profile.bodyFatPercent,
            tmb: profile.tmb,
            age: calcAge(profile.birthDate),
          }
        : null,
      currentGoal: goal
        ? {
            calories: goal.calories,
            proteinG: goal.proteinG,
            fatG: goal.fatG,
            carbG: goal.carbG,
          }
        : null,
    }
  },

  async upsertProfile(
    userId: string,
    data: {
      birthDate: string
      sex: 'male' | 'female'
      heightCm: number
      weightKg: number
      bodyFatPercent?: number | null
    },
  ) {
    const birthDate = new Date(data.birthDate)
    const ageYears = calcAge(birthDate)

    const tmb = calculateTmb({
      sex: data.sex,
      weightKg: data.weightKg,
      heightCm: data.heightCm,
      ageYears,
      bodyFatPercent: data.bodyFatPercent,
    })

    const profile = await profileRepository.upsert(userId, {
      birthDate,
      sex: data.sex,
      heightCm: data.heightCm,
      weightKg: data.weightKg,
      bodyFatPercent: data.bodyFatPercent ?? null,
      tmb,
    })

    const macros = calculateMacroGoal(tmb)
    const goal = await goalRepository.create({ userId, ...macros })

    return {
      profile: {
        birthDate: profile.birthDate.toISOString().split('T')[0],
        sex: profile.sex,
        heightCm: profile.heightCm,
        weightKg: profile.weightKg,
        bodyFatPercent: profile.bodyFatPercent,
        tmb: profile.tmb,
        age: ageYears,
      },
      currentGoal: {
        calories: goal.calories,
        proteinG: goal.proteinG,
        fatG: goal.fatG,
        carbG: goal.carbG,
      },
    }
  },
}
