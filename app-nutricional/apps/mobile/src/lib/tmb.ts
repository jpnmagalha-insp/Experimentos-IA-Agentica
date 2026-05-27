export function calcAge(birthDate: string): number {
  const birth = new Date(birthDate)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

export function calcTmb(
  sex: 'male' | 'female',
  weightKg: number,
  heightCm: number,
  ageYears: number,
  bodyFatPercent?: number,
): number {
  if (bodyFatPercent != null) {
    const lean = weightKg * (1 - bodyFatPercent / 100)
    return 370 + 21.6 * lean
  }
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears
  return sex === 'male' ? base + 5 : base - 161
}
