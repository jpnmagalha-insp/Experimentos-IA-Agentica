import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { FoodSearchResponseDto } from '@nutri-ia/shared'

export function useFoodSearch(q: string) {
  return useQuery({
    queryKey: ['foods', 'search', q],
    queryFn: () =>
      api
        .get<FoodSearchResponseDto>(`/foods/search?q=${encodeURIComponent(q)}`)
        .then((r) => r.data),
    enabled: q.length >= 2,
  })
}
