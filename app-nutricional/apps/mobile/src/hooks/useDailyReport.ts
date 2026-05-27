import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { DailyReportResponseDto } from '@nutri-ia/shared'

export function useDailyReport(date: string) {
  return useQuery({
    queryKey: ['report', date],
    queryFn: () =>
      api.get<DailyReportResponseDto>(`/reports/daily?date=${date}`).then((r) => r.data),
  })
}
