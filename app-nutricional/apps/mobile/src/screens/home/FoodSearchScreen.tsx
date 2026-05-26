import React, { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { AppStackParamList } from '../../navigation'
import type { FoodDto } from '@nutri-ia/shared'
import { useFoodSearch } from '../../hooks/useFoodSearch'
import { colors } from '../../theme/colors'
import { typography } from '../../theme/typography'

type Props = NativeStackScreenProps<AppStackParamList, 'FoodSearch'>

const SKELETON_COUNT = 6

function SkeletonItem() {
  return (
    <View style={styles.skeletonItem}>
      <View style={styles.skeletonLine} />
      <View style={styles.skeletonLineSub} />
    </View>
  )
}

export function FoodSearchScreen({ navigation, route }: Props) {
  const { mealType, date } = route.params
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { data, isLoading } = useFoodSearch(debouncedQuery)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const handleChange = (text: string) => {
    setQuery(text)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setDebouncedQuery(text), 300)
  }

  const handleSelect = (food: FoodDto) => {
    navigation.navigate('FoodDetail', { food, mealType, date })
  }

  const foods = data?.foods ?? []
  const showHint = query.length < 2
  const showSkeleton = !showHint && isLoading
  const showEmpty = !showHint && !isLoading && debouncedQuery.length >= 2 && foods.length === 0
  const showResults = !showHint && !isLoading && foods.length > 0

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={handleChange}
          placeholder="Digite o nome do alimento..."
          placeholderTextColor={colors.ink3}
          autoFocus
          returnKeyType="search"
          clearButtonMode="while-editing"
          testID="food-search-input"
        />
      </View>

      {showHint && (
        <View style={styles.centeredState}>
          <Text style={styles.hintText}>Digite pelo menos 2 caracteres para buscar</Text>
        </View>
      )}

      {showSkeleton && (
        <View>
          {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <SkeletonItem key={i} />
          ))}
        </View>
      )}

      {showEmpty && (
        <View style={styles.centeredState} testID="food-empty-state">
          <Text style={styles.emptyText}>Nenhum alimento encontrado</Text>
        </View>
      )}

      {showResults && (
        <FlatList
          data={foods}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.resultItem}
              onPress={() => handleSelect(item)}
              activeOpacity={0.7}
              testID={`food-result-${item.id}`}
            >
              <View style={styles.resultLeft}>
                <Text style={styles.resultName} numberOfLines={1}>
                  {item.name}
                </Text>
                {item.category ? (
                  <Text style={styles.resultCategory}>{item.category}</Text>
                ) : null}
              </View>
              <Text style={styles.resultKcal}>{Math.round(item.caloriesPer100g)} kcal/100g</Text>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },

  inputWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray1,
  },
  input: {
    backgroundColor: colors.gray1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    ...typography.inputText,
    color: colors.ink,
  },

  centeredState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  hintText: { ...typography.bodyS, color: colors.gray2, textAlign: 'center' },
  emptyText: { ...typography.body, color: colors.ink3, textAlign: 'center' },

  skeletonItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.paper,
  },
  skeletonLine: {
    height: 14,
    width: '60%',
    backgroundColor: colors.gray1,
    borderRadius: 6,
    marginBottom: 8,
  },
  skeletonLineSub: {
    height: 11,
    width: '35%',
    backgroundColor: colors.gray1,
    borderRadius: 6,
  },

  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.paper,
  },
  resultLeft: { flex: 1, marginRight: 12 },
  resultName: { ...typography.body, color: colors.ink },
  resultCategory: { ...typography.caption, color: colors.ink3, marginTop: 3 },
  resultKcal: { ...typography.caption, color: colors.ink2, fontWeight: '500' },
  separator: { height: 1, backgroundColor: colors.gray1, marginHorizontal: 16 },
})
