export type TmbInput = {
  sex: 'male' | 'female'
  weightKg: number
  heightCm: number
  ageYears: number
  bodyFatPercent?: number | null
}

function mifflinStJeor({ sex, weightKg, heightCm, ageYears }: TmbInput): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears
  return sex === 'male' ? base + 5 : base - 161
}

function katchMcArdle({ weightKg, bodyFatPercent }: TmbInput): number {
  const leanMass = weightKg * (1 - bodyFatPercent! / 100)
  return 370 + 21.6 * leanMass
}

export function calculateTmb(input: TmbInput): number {
  return input.bodyFatPercent != null ? katchMcArdle(input) : mifflinStJeor(input)
}

export function calcAge(birthDate: Date): number {
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const m = today.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--
  return age
}
