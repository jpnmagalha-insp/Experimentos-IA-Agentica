import type { Food, FoodMeasure } from '@prisma/client'
import type { MacroResult } from '@nutri-ia/shared'

export function calculateFoodMacros(
  food: Pick<Food, 'caloriesPer100g' | 'proteinPer100g' | 'fatPer100g' | 'carbPer100g'>,
  quantity: number,
  unit: 'g' | 'measure',
  measure?: Pick<FoodMeasure, 'gramsEquivalent'> | null,
): MacroResult {
  if (unit === 'measure' && !measure) {
    throw new Error('measure is required when unit is "measure"')
  }
  const grams = unit === 'measure' && measure ? quantity * measure.gramsEquivalent : quantity
  const factor = grams / 100
  return {
    calories: round(food.caloriesPer100g * factor),
    proteinG: round(food.proteinPer100g * factor),
    fatG: round(food.fatPer100g * factor),
    carbG: round(food.carbPer100g * factor),
  }
}

const round = (n: number): number => Math.round(n * 10) / 10
