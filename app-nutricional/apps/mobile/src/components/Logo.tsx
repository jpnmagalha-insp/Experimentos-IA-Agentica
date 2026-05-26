import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors } from '../theme/colors'
import { fontFamilies } from '../theme/typography'

interface LogoProps {
  size?: 'standard' | 'hero'
}

export function Logo({ size = 'standard' }: LogoProps) {
  const fontSize = size === 'hero' ? 44 : 32
  const markSize = size === 'hero' ? 48 : 36
  return (
    <View style={styles.container}>
      <LogoMark size={markSize} />
      <Text style={[styles.name, { fontSize }]}>nutri.</Text>
    </View>
  )
}

function LogoMark({ size }: { size: number }) {
  const border = Math.max(1.5, size * 2 / 84)
  const tx = Math.round(size * 8 / 84)
  const ty = Math.round(size * 6 / 84)
  const totalSize = size + tx

  return (
    <View style={{ width: totalSize, height: size, marginBottom: 8 }}>
      {/* Círculo base — cinza escuro */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: border,
          borderColor: colors.ink,
        }}
      />
      {/* Círculo offset — terracota, deslocado 8px direita 6px baixo */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: border,
          borderColor: colors.accent,
          transform: [{ translateX: tx }, { translateY: ty }],
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  name: {
    fontFamily: fontFamilies.display,
    color: colors.ink,
    letterSpacing: -0.5,
  },
})
