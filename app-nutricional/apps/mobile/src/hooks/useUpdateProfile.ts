import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { UpdateProfileDto, UpdateProfileResponseDto } from '@nutri-ia/shared'

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: UpdateProfileDto) =>
      api.put<UpdateProfileResponseDto>('/users/me/profile', dto).then((r) => r.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['user', 'me'] })
    },
  })
}
