import { z } from 'zod'

// --- Auth ---

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
})

// --- User Profile ---

export const sexSchema = z.enum(['male', 'female'])

export const onboardingSchema = z.object({
  birthDate: z.string().date(),
  sex: sexSchema,
  heightCm: z.number().positive(),
  weightKg: z.number().positive(),
  bodyFatPercent: z.number().min(1).max(60).optional(),
})

// --- Food ---

export const foodMeasureSchema = z.object({
  id: z.string().uuid(),
  description: z.string(),
  gramsEquivalent: z.number().positive(),
})

export const foodSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  caloriesPer100g: z.number(),
  proteinPer100g: z.number(),
  fatPer100g: z.number(),
  carbPer100g: z.number(),
  category: z.string().nullable(),
  measures: z.array(foodMeasureSchema),
})

export const foodSearchQuerySchema = z.object({
  q: z.string().min(2, 'q deve ter pelo menos 2 caracteres'),
  limit: z.coerce.number().int().min(1).max(30).default(10),
})

export const foodSearchResponseSchema = z.object({
  foods: z.array(foodSchema),
})

export const foodIdParamSchema = z.object({
  id: z.string().uuid(),
})

// --- Food Log ---

export const mealTypeSchema = z.enum(['breakfast', 'lunch', 'dinner', 'snack'])

export const createLogSchema = z.object({
  foodId: z.string().uuid(),
  logDate: z.string().date(),
  mealType: mealTypeSchema,
  quantity: z.number().positive(),
  unit: z.string().default('g'),
  foodMeasureId: z.string().uuid().optional(),
})

export const macroResultSchema = z.object({
  calories: z.number(),
  proteinG: z.number(),
  fatG: z.number(),
  carbG: z.number(),
})

// --- Types ---

export type LoginDto = z.infer<typeof loginSchema>
export type RegisterDto = z.infer<typeof registerSchema>
export type OnboardingDto = z.infer<typeof onboardingSchema>
export type Sex = z.infer<typeof sexSchema>
export type MealType = z.infer<typeof mealTypeSchema>
export type FoodDto = z.infer<typeof foodSchema>
export type FoodMeasureDto = z.infer<typeof foodMeasureSchema>
export type CreateLogDto = z.infer<typeof createLogSchema>
export type MacroResult = z.infer<typeof macroResultSchema>
export type FoodSearchQueryDto = z.infer<typeof foodSearchQuerySchema>
export type FoodSearchResponseDto = z.infer<typeof foodSearchResponseSchema>
export type FoodIdParamDto = z.infer<typeof foodIdParamSchema>
