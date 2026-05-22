import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'

interface User {
  id: string
  name: string
  email: string
}

interface Tokens {
  accessToken: string
  refreshToken: string
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  needsOnboarding: boolean
  isLoading: boolean
  login: (tokens: Tokens, user: User, isNewUser?: boolean) => Promise<void>
  logout: () => Promise<void>
  setTokens: (tokens: Tokens) => Promise<void>
  setNeedsOnboarding: (v: boolean) => void
  initialize: () => Promise<void>
}

const KEYS = {
  access: 'nutria_access_token',
  refresh: 'nutria_refresh_token',
  user: 'nutria_user',
  onboarding: 'nutria_needs_onboarding',
} as const

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  needsOnboarding: false,
  isLoading: true,

  login: async (tokens, user, isNewUser = false) => {
    await Promise.all([
      SecureStore.setItemAsync(KEYS.access, tokens.accessToken),
      SecureStore.setItemAsync(KEYS.refresh, tokens.refreshToken),
      SecureStore.setItemAsync(KEYS.user, JSON.stringify(user)),
      SecureStore.setItemAsync(KEYS.onboarding, String(isNewUser)),
    ])
    set({
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      isAuthenticated: true,
      needsOnboarding: isNewUser,
    })
  },

  logout: async () => {
    await Promise.all(Object.values(KEYS).map((k) => SecureStore.deleteItemAsync(k)))
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, needsOnboarding: false })
  },

  setTokens: async (tokens) => {
    await Promise.all([
      SecureStore.setItemAsync(KEYS.access, tokens.accessToken),
      SecureStore.setItemAsync(KEYS.refresh, tokens.refreshToken),
    ])
    set({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken })
  },

  setNeedsOnboarding: (v) => {
    SecureStore.setItemAsync(KEYS.onboarding, String(v))
    set({ needsOnboarding: v })
  },

  initialize: async () => {
    try {
      const [accessToken, refreshToken, userJson, needsOnboardingStr] = await Promise.all([
        SecureStore.getItemAsync(KEYS.access),
        SecureStore.getItemAsync(KEYS.refresh),
        SecureStore.getItemAsync(KEYS.user),
        SecureStore.getItemAsync(KEYS.onboarding),
      ])

      if (accessToken && refreshToken && userJson) {
        const user = JSON.parse(userJson) as User
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          needsOnboarding: needsOnboardingStr === 'true',
        })
      }
    } finally {
      set({ isLoading: false })
    }
  },
}))
