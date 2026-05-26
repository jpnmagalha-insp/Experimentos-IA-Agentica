import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { DailyLogsResponseDto } from '@nutri-ia/shared'

export function useDailyLog(date: string) {
  return useQuery({
    queryKey: ['logs', date],
    queryFn: () => api.get<DailyLogsResponseDto>(`/logs?date=${date}`).then((r) => r.data),
  })
}

export function useDeleteLog(date: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (logId: string) => api.delete(`/logs/${logId}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['logs', date] })
      void qc.invalidateQueries({ queryKey: ['report', date] })
    },
  })
}

export function useUpdateLog(date: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ logId, quantity }: { logId: string; quantity: number }) =>
      api.put(`/logs/${logId}`, { quantity, unit: 'g' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['logs', date] })
      void qc.invalidateQueries({ queryKey: ['report', date] })
    },
  })
}
