import type { ReportRepository } from '../repositories/report.repository'
import { NotFoundError } from '../lib/errors'
import type { DailyReportResponseDto } from '@nutri-ia/shared'

export class ReportService {
  constructor(private reportRepository: ReportRepository) {}

  async getDailyReport(userId: string, date: string): Promise<DailyReportResponseDto> {
    const [goal, consumed] = await Promise.all([
      this.reportRepository.getLatestGoal(userId),
      this.reportRepository.getConsumedByUserAndDate(userId, date),
    ])

    if (!goal) {
      throw new NotFoundError('Nenhuma meta nutricional encontrada para este usuário')
    }

    const balanceCalories = consumed.calories - goal.calories

    let status: 'deficit' | 'surplus' | 'on_target'
    if (balanceCalories < -50) {
      status = 'deficit'
    } else if (balanceCalories > 50) {
      status = 'surplus'
    } else {
      status = 'on_target'
    }

    const safeDiv = (a: number, b: number) => (b > 0 ? a / b : 0)

    return {
      date,
      goal: {
        calories: goal.calories,
        proteinG: goal.proteinG,
        fatG: goal.fatG,
        carbG: goal.carbG,
      },
      consumed,
      balance: { calories: balanceCalories, status },
      progress: {
        calories: safeDiv(consumed.calories, goal.calories),
        proteinG: safeDiv(consumed.proteinG, goal.proteinG),
        fatG: safeDiv(consumed.fatG, goal.fatG),
        carbG: safeDiv(consumed.carbG, goal.carbG),
      },
    }
  }
}
