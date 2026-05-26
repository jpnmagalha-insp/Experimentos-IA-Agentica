import { describe, it, expect } from 'vitest'
import { calculateFoodMacros } from './food-macros.calculator'

const banana = {
  caloriesPer100g: 89,
  proteinPer100g: 1.1,
  fatPer100g: 0.3,
  carbPer100g: 22.8,
}

describe('calculateFoodMacros', () => {
  it('calcula macros corretamente no path gramas: 60g de banana', () => {
    const result = calculateFoodMacros(banana, 60, 'g')

    expect(result.calories).toBe(53.4)
    expect(result.proteinG).toBe(0.7)
    expect(result.fatG).toBe(0.2)
    expect(result.carbG).toBe(13.7)
  })

  it('calcula macros corretamente no path medida: 2 medidas de 120g de banana', () => {
    const result = calculateFoodMacros(banana, 2, 'measure', { gramsEquivalent: 120 })

    expect(result.calories).toBe(213.6)
    expect(result.proteinG).toBe(2.6)
    expect(result.fatG).toBe(0.7)
    expect(result.carbG).toBe(54.7)
  })

  it('arredonda para 1 decimal: 100g de alimento com calorias fracionadas (33.33)', () => {
    const food = {
      caloriesPer100g: 33.33,
      proteinPer100g: 0,
      fatPer100g: 0,
      carbPer100g: 0,
    }

    const result = calculateFoodMacros(food, 100, 'g')

    expect(result.calories).toBe(33.3)
  })

  it('lança erro quando unit="measure" e measure não é fornecida', () => {
    expect(() => calculateFoodMacros(banana, 60, 'measure', null)).toThrow(
      'measure is required when unit is "measure"',
    )
  })
})
