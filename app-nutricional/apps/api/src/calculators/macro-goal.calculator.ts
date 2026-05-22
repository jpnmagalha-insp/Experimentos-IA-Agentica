export function calculateMacroGoal(tmb: number) {
  return {
    calories: Math.round(tmb),
    proteinG: Math.round((tmb * 0.30) / 4),
    fatG: Math.round((tmb * 0.25) / 9),
    carbG: Math.round((tmb * 0.45) / 4),
  }
}
