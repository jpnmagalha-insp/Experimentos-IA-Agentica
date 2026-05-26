import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

interface UserProfile {
  birthDate: string
  sex: string
  heightCm: number
  weightKg: number
  bodyFatPercent: number | null
  tmb: number
  age: number
}

interface CurrentGoal {
  calories: number
  proteinG: number
  fatG: number
  carbG: number
}

export interface CurrentUser {
  id: string
  name: string
  email: string
  emailVerified: boolean
  profile: UserProfile | null
  currentGoal: CurrentGoal | null
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ['user', 'me'],
    queryFn: () => api.get<CurrentUser>('/users/me').then((r) => r.data),
    staleTime: 1000 * 60 * 10,
  })
}
