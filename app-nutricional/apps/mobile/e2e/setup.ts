import axios from 'axios'

const BASE = process.env.DETOX_API_URL ?? 'http://localhost:3000/v1'

export const TEST_EMAIL = process.env.E2E_TEST_EMAIL ?? 'e2e@nutria-ia.test'
export const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD ?? 'E2eTest@123'

interface AuthResult {
  accessToken: string
  refreshToken: string
}

interface Food {
  id: string
  name: string
}

interface LogEntry {
  id: string
}

export async function ensureTestUser(): Promise<void> {
  try {
    await axios.post(`${BASE}/auth/register`, {
      name: 'E2E Test User',
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    })
  } catch {
    // User already exists — ignore
  }

  // Always upsert profile so the user lands on DailyLogScreen (not Onboarding)
  const { accessToken } = await loginTestUser()
  await axios.put(
    `${BASE}/users/me/profile`,
    {
      birthDate: '1990-01-01',
      sex: 'male',
      heightCm: 175,
      weightKg: 75,
    },
    { headers: { Authorization: `Bearer ${accessToken}` } },
  )
}

export async function loginTestUser(): Promise<AuthResult> {
  const res = await axios.post<AuthResult & { user: unknown }>(`${BASE}/auth/login`, {
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  })
  return { accessToken: res.data.accessToken, refreshToken: res.data.refreshToken }
}

export async function findFood(accessToken: string, query: string): Promise<Food> {
  const res = await axios.get<{ foods: Food[] }>(
    `${BASE}/foods/search?q=${encodeURIComponent(query)}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  )
  const food = res.data.foods[0]
  if (!food) throw new Error(`Food not found for query: "${query}"`)
  return food
}

export async function seedLog(
  accessToken: string,
  params: { foodId: string; date: string; mealType: string; quantity: number },
): Promise<LogEntry> {
  const res = await axios.post<LogEntry>(
    `${BASE}/logs`,
    {
      foodId: params.foodId,
      logDate: params.date,
      mealType: params.mealType,
      quantity: params.quantity,
      unit: 'g',
    },
    { headers: { Authorization: `Bearer ${accessToken}` } },
  )
  return { id: res.data.id }
}

export async function updateProfile(
  accessToken: string,
  payload: {
    birthDate: string
    sex: 'male' | 'female'
    heightCm: number
    weightKg: number
    bodyFatPercent?: number | null
  },
): Promise<void> {
  await axios.put(`${BASE}/users/me/profile`, payload, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export async function clearLogs(accessToken: string, date: string): Promise<void> {
  const res = await axios.get<{ meals: Record<string, Array<{ id: string }>> }>(
    `${BASE}/logs?date=${date}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  )
  await Promise.all(
    Object.values(res.data.meals)
      .flat()
      .map((item) =>
        axios.delete(`${BASE}/logs/${item.id}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      ),
  )
}
