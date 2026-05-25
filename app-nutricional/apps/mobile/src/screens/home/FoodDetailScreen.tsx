import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { AppStackParamList } from '../../navigation'

type Props = NativeStackScreenProps<AppStackParamList, 'FoodDetail'>

export function FoodDetailScreen({ route }: Props) {
  const { food } = route.params
  return (
    <View style={styles.container}>
      <Text style={styles.name}>{food.name}</Text>
      <Text style={styles.sub}>{Math.round(food.caloriesPer100g)} kcal/100g</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  name: { fontSize: 20, fontWeight: '600', color: '#333', marginBottom: 8 },
  sub: { fontSize: 14, color: '#888' },
})
