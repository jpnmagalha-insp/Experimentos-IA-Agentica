import React, { useState, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { AppStackParamList } from '../../navigation'
import type { FoodDto, FoodMeasureDto, MealType } from '@nutri-ia/shared'
import { useCreateLog } from '../../hooks/useCreateLog'

type Props = NativeStackScreenProps<AppStackParamList, 'FoodDetail'>

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Café da manhã',
  lunch: 'Almoço',
  dinner: 'Jantar',
  snack: 'Lanche',
}

// Mirrors the backend calculateFoodMacros (DR-06 / DR-07) — must stay in sync
function calcPreview(
  food: Pick<FoodDto, 'caloriesPer100g' | 'proteinPer100g' | 'fatPer100g' | 'carbPer100g'>,
  qty: number,
  mode: 'g' | 'measure',
  measure: FoodMeasureDto | null,
) {
  const grams = mode === 'measure' && measure ? qty * measure.gramsEquivalent : qty
  const factor = grams / 100
  const r = (n: number) => Math.round(n * 10) / 10
  return {
    calories: r(food.caloriesPer100g * factor),
    protein: r(food.proteinPer100g * factor),
    fat: r(food.fatPer100g * factor),
    carb: r(food.carbPer100g * factor),
  }
}

export function FoodDetailScreen({ navigation, route }: Props) {
  const { food, mealType, date } = route.params
  const hasMeasures = food.measures.length > 0

  const [quantity, setQuantity] = useState('')
  const [mode, setMode] = useState<'g' | 'measure'>('g')
  const [selectedMeasure, setSelectedMeasure] = useState<FoodMeasureDto | null>(null)

  const { mutate: createLog, isPending } = useCreateLog(date)

  const qty = parseFloat(quantity) || 0

  const preview = useMemo(() => {
    if (qty <= 0) return null
    if (mode === 'measure' && !selectedMeasure) return null
    return calcPreview(food, qty, mode, selectedMeasure)
  }, [food, qty, mode, selectedMeasure])

  const canSubmit = qty > 0 && (mode === 'g' || selectedMeasure !== null) && !isPending

  const handleToggle = (next: 'g' | 'measure') => {
    setMode(next)
    if (next === 'g') setSelectedMeasure(null)
  }

  const handleSubmit = () => {
    if (!canSubmit) return
    const base = { foodId: food.id, logDate: date, mealType, quantity: qty }
    if (mode === 'measure' && selectedMeasure) {
      createLog(
        { ...base, unit: 'measure', foodMeasureId: selectedMeasure.id },
        { onSuccess: () => navigation.goBack() },
      )
    } else {
      createLog({ ...base, unit: 'g' }, { onSuccess: () => navigation.goBack() })
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerCard}>
          <Text style={styles.foodName}>{food.name}</Text>
          {food.category ? <Text style={styles.category}>{food.category}</Text> : null}
          <Text style={styles.mealLabel}>
            Adicionando em:{' '}
            <Text style={styles.mealLabelBold}>{MEAL_LABELS[mealType]}</Text>
          </Text>
        </View>

        <View style={styles.tableCard}>
          <Text style={styles.sectionTitle}>Informação nutricional — por 100g</Text>
          <View style={styles.tableRow}>
            <MacroCell label="Kcal" value={Math.round(food.caloriesPer100g * 10) / 10} />
            <MacroCell label="Proteína" value={Math.round(food.proteinPer100g * 10) / 10} suffix="g" />
            <MacroCell label="Gordura" value={Math.round(food.fatPer100g * 10) / 10} suffix="g" />
            <MacroCell label="Carboidrato" value={Math.round(food.carbPer100g * 10) / 10} suffix="g" />
          </View>
        </View>

        <View style={styles.toggleRow}>
          <ToggleButton
            label="Gramas"
            testID="toggle-grams"
            active={mode === 'g'}
            onPress={() => handleToggle('g')}
          />
          <ToggleButton
            label="Medidas caseiras"
            testID="toggle-measure"
            active={mode === 'measure'}
            onPress={() => handleToggle('measure')}
            disabled={!hasMeasures}
          />
        </View>

        <View style={styles.inputCard}>
          <Text style={styles.sectionTitle}>
            {mode === 'g' ? 'Quantidade (gramas)' : 'Quantidade'}
          </Text>
          <TextInput
            style={styles.input}
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
            placeholder={mode === 'g' ? 'Ex: 150' : 'Ex: 2'}
            placeholderTextColor="#bbb"
            testID="qty-input"
          />
        </View>

        {mode === 'measure' && (
          <View style={styles.measureCard}>
            <Text style={styles.sectionTitle}>Medida caseira</Text>
            {food.measures.map((m, index) => (
              <TouchableOpacity
                key={m.id}
                testID={`measure-item-${m.id}`}
                style={[
                  styles.measureItem,
                  index === food.measures.length - 1 && styles.measureItemLast,
                  selectedMeasure?.id === m.id && styles.measureItemActive,
                ]}
                onPress={() => setSelectedMeasure(m)}
                activeOpacity={0.7}
              >
                <View style={[styles.radio, selectedMeasure?.id === m.id && styles.radioActive]} />
                <Text style={styles.measureText}>{m.description}</Text>
                <Text style={styles.measureGrams}>{m.gramsEquivalent}g</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {preview ? (
          <View style={styles.previewCard}>
            <Text style={styles.previewKcal} testID="preview-kcal">{preview.calories} kcal</Text>
            <Text style={styles.previewMacros} testID="preview-macros">
              P: {preview.protein}g · G: {preview.fat}g · C: {preview.carb}g
            </Text>
          </View>
        ) : (
          <View style={styles.previewPlaceholder}>
            <Text style={styles.previewHint}>
              {mode === 'measure' && !selectedMeasure
                ? 'Selecione uma medida para ver o preview'
                : 'Informe a quantidade para ver o preview'}
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit}
          activeOpacity={0.8}
          testID="submit-btn"
        >
          {isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>Adicionar ao log</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

function MacroCell({
  label,
  value,
  suffix = '',
}: {
  label: string
  value: number
  suffix?: string
}) {
  return (
    <View style={styles.macroCell}>
      <Text style={styles.macroValue}>
        {value}
        {suffix}
      </Text>
      <Text style={styles.macroLabel}>{label}</Text>
    </View>
  )
}

function ToggleButton({
  label,
  active,
  onPress,
  disabled,
  testID,
}: {
  label: string
  active: boolean
  onPress: () => void
  disabled?: boolean
  testID?: string
}) {
  return (
    <TouchableOpacity
      style={[
        styles.toggleBtn,
        active && styles.toggleBtnActive,
        disabled === true && styles.toggleBtnDisabled,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      testID={testID}
    >
      <Text
        style={[
          styles.toggleText,
          active && styles.toggleTextActive,
          disabled === true && styles.toggleTextDisabled,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, paddingBottom: 32 },

  headerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  foodName: { fontSize: 18, fontWeight: '700', color: '#111', marginBottom: 4 },
  category: { fontSize: 13, color: '#aaa', marginBottom: 6 },
  mealLabel: { fontSize: 13, color: '#888' },
  mealLabelBold: { fontWeight: '600', color: '#555' },

  tableCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    color: '#aaa',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  tableRow: { flexDirection: 'row', justifyContent: 'space-around' },
  macroCell: { alignItems: 'center' },
  macroValue: { fontSize: 16, fontWeight: '700', color: '#333' },
  macroLabel: { fontSize: 11, color: '#aaa', marginTop: 4 },

  toggleRow: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  toggleBtnActive: { borderColor: '#4CAF50', backgroundColor: '#f0faf0' },
  toggleBtnDisabled: { borderColor: '#f0f0f0', backgroundColor: '#fafafa' },
  toggleText: { fontSize: 14, color: '#555', fontWeight: '500' },
  toggleTextActive: { color: '#4CAF50', fontWeight: '600' },
  toggleTextDisabled: { color: '#ccc' },

  inputCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#e8e8e8',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 16,
    color: '#111',
  },

  measureCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  measureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
    paddingHorizontal: 4,
    borderRadius: 6,
  },
  measureItemLast: { borderBottomWidth: 0 },
  measureItemActive: { backgroundColor: '#f0faf0' },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#ccc',
    marginRight: 12,
  },
  radioActive: { borderColor: '#4CAF50', backgroundColor: '#4CAF50' },
  measureText: { flex: 1, fontSize: 14, color: '#333' },
  measureGrams: { fontSize: 13, color: '#999' },

  previewCard: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
  },
  previewKcal: { fontSize: 26, fontWeight: '700', color: '#fff' },
  previewMacros: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 6 },
  previewPlaceholder: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ebebeb',
  },
  previewHint: { fontSize: 13, color: '#bbb', textAlign: 'center' },

  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: { backgroundColor: '#c8e6c9' },
  submitText: { fontSize: 16, fontWeight: '700', color: '#fff' },
})
