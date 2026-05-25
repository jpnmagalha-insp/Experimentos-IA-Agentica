import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { AppStackParamList } from '../../navigation'

type Props = NativeStackScreenProps<AppStackParamList, 'FoodSearch'>

export function FoodSearchScreen({ navigation, route }: Props) {
  const { mealType } = route.params
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Buscar alimento</Text>
      <Text style={styles.sub}>Refeição: {mealType}</Text>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.btn}>
        <Text style={styles.btnText}>Fechar</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: '600', color: '#333', marginBottom: 8 },
  sub: { fontSize: 14, color: '#888', marginBottom: 24 },
  btn: { backgroundColor: '#4CAF50', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 24 },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
})
