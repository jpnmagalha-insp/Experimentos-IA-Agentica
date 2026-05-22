import axios from 'axios'
import { useAuthStore } from '../store/auth.store'

export const API_URL = (process.env.EXPO_PUBLIC_API_URL as string | undefined) ?? 'http://localhost:3000/v1'

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10_000,
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let isRefreshing = false
let failedQueue: Array<{ resolve: (t: string) => void; reject: (e: unknown) => void }> = []

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)))
  failedQueue = []
}

api.interceptors.response.use(
  (res) => res,
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) return Promise.reject(error)

    const originalRequest = error.config as typeof error.config & { _retry?: boolean }
    if (error.response?.status !== 401 || originalRequest?._retry) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then((token) => {
        originalRequest!.headers!['Authorization'] = `Bearer ${token}`
        return api(originalRequest!)
      })
    }

    originalRequest!._retry = true
    isRefreshing = true

    const { refreshToken, setTokens, logout } = useAuthStore.getState()
    if (!refreshToken) {
      isRefreshing = false
      await logout()
      return Promise.reject(error)
    }

    try {
      const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken })
      const { accessToken, refreshToken: newRefresh } = res.data as {
        accessToken: string
        refreshToken: string
      }
      await setTokens({ accessToken, refreshToken: newRefresh })
      processQueue(null, accessToken)
      originalRequest!.headers!['Authorization'] = `Bearer ${accessToken}`
      return api(originalRequest!)
    } catch (e) {
      processQueue(e, null)
      await logout()
      return Promise.reject(e)
    } finally {
      isRefreshing = false
    }
  },
)
