import { typography, fontFamilies } from '../typography'

describe('fontFamilies', () => {
  it('exporta todas as variantes de fonte', () => {
    expect(fontFamilies.display).toBe('Newsreader_700Bold')
    expect(fontFamilies.displayRegular).toBe('Newsreader_400Regular')
    expect(fontFamilies.body).toBe('PlusJakartaSans_400Regular')
    expect(fontFamilies.bodyMedium).toBe('PlusJakartaSans_500Medium')
    expect(fontFamilies.bodySemibold).toBe('PlusJakartaSans_600SemiBold')
    expect(fontFamilies.bodyBold).toBe('PlusJakartaSans_700Bold')
  })
})

describe('typography', () => {
  it('todos os estilos têm fontFamily e fontSize', () => {
    Object.entries(typography).forEach(([_key, style]) => {
      expect(style).toHaveProperty('fontFamily')
      expect(style).toHaveProperty('fontSize')
      expect(typeof style.fontSize).toBe('number')
    })
  })

  it('heroNumber usa Newsreader e fontSize >= 32', () => {
    expect(typography.heroNumber.fontFamily).toBe('Newsreader_700Bold')
    expect(typography.heroNumber.fontSize).toBeGreaterThanOrEqual(32)
  })

  it('button usa PlusJakartaSans semibold', () => {
    expect(typography.button.fontFamily).toBe('PlusJakartaSans_600SemiBold')
  })
})
