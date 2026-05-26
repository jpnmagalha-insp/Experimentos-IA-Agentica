export const fontFamilies = {
  display: 'Newsreader_700Bold',
  displayRegular: 'Newsreader_400Regular',
  body: 'PlusJakartaSans_400Regular',
  bodyMedium: 'PlusJakartaSans_500Medium',
  bodySemibold: 'PlusJakartaSans_600SemiBold',
  bodyBold: 'PlusJakartaSans_700Bold',
} as const

export const typography = {
  // Display — Newsreader (números hero, títulos auth)
  heroNumber: { fontFamily: fontFamilies.display,        fontSize: 36 },
  displayXL:  { fontFamily: fontFamilies.display,        fontSize: 32 },
  displayL:   { fontFamily: fontFamilies.display,        fontSize: 28 },
  displayM:   { fontFamily: fontFamilies.display,        fontSize: 26 },
  displayS:   { fontFamily: fontFamilies.display,        fontSize: 24 },

  // Headings — Plus Jakarta Sans
  headingL: { fontFamily: fontFamilies.bodyBold,      fontSize: 22 },
  headingM: { fontFamily: fontFamilies.bodySemibold,  fontSize: 18 },
  headingS: { fontFamily: fontFamilies.bodySemibold,  fontSize: 16 },

  // Body — Plus Jakarta Sans
  bodyL:   { fontFamily: fontFamilies.bodyMedium, fontSize: 16 },
  body:    { fontFamily: fontFamilies.body,        fontSize: 15 },
  bodyS:   { fontFamily: fontFamilies.body,        fontSize: 14 },
  caption: { fontFamily: fontFamilies.body,        fontSize: 12 },
  overline:{ fontFamily: fontFamilies.bodyMedium,  fontSize: 11, letterSpacing: 0.5 },

  // Interativos
  button:    { fontFamily: fontFamilies.bodySemibold, fontSize: 16 },
  link:      { fontFamily: fontFamilies.bodyMedium,   fontSize: 15 },
  inputText: { fontFamily: fontFamilies.body,          fontSize: 16 },
} as const
