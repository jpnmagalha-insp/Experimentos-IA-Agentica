export const colors = {
  accent: '#d97757',
  accentLight: '#faf0ec',
  paper: '#fafaf7',
  white: '#ffffff',
  ink: '#2a2a2a',
  ink2: '#555555',
  ink3: '#888888',
  gray1: '#ececea',
  gray2: '#d8d8d4',
  error: '#E53935',
} as const

export type ColorKey = keyof typeof colors
