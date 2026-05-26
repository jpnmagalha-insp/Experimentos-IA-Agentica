import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { CreateLogDto, CreateLogResponseDto } from '@nutri-ia/shared'

export function useCreateLog(date: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateLogDto) =>
      api.post<CreateLogResponseDto>('/logs', dto).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['logs', date] })
      void qc.invalidateQueries({ queryKey: ['report', date] })
    },
  })
}
