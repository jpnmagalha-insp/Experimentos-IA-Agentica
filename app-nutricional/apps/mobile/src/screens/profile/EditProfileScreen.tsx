import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { updateProfileSchema } from '@nutri-ia/shared'
import { useCurrentUser } from '../../hooks/useCurrentUser'
import { useUpdateProfile } from '../../hooks/useUpdateProfile'
import { calcAge, calcTmb } from '../../lib/tmb'
import type { AppStackParamList } from '../../navigation'
import { colors } from '../../theme/colors'
import { typography } from '../../theme/typography'

export function EditProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList, 'EditProfile'>>()
  const { data } = useCurrentUser()
  const { mutate, isPending } = useUpdateProfile()

  const profile = data?.profile

  const [birthDate, setBirthDate] = useState(profile?.birthDate ?? '')
  const [sex, setSex] = useState<'male' | 'female'>((profile?.sex as 'male' | 'female') ?? 'male')
  const [heightCm, setHeightCm] = useState(profile != null ? String(profile.heightCm) : '')
  const [weightKg, setWeightKg] = useState(profile != null ? String(profile.weightKg) : '')
  const [bodyFat, setBodyFat] = useState(
    profile?.bodyFatPercent != null ? String(profile.bodyFatPercent) : '',
  )

  const heightNum = parseFloat(heightCm)
  const weightNum = parseFloat(weightKg)
  const bfPercent = bodyFat !== '' ? parseFloat(bodyFat) : null

  const canPreview =
    !isNaN(weightNum) && !isNaN(heightNum) && /^\d{4}-\d{2}-\d{2}$/.test(birthDate)
  const tmbPreview = canPreview
    ? calcTmb(sex, weightNum, heightNum, calcAge(birthDate), bfPercent ?? undefined)
    : null

  const isFormValid = updateProfileSchema.safeParse({
    birthDate,
    sex,
    heightCm: heightNum,
    weightKg: weightNum,
    bodyFatPercent: bfPercent,
  }).success

  function handleSave() {
    if (!isFormValid || isPending) return
    mutate(
      { birthDate, sex, heightCm: heightNum, weightKg: weightNum, bodyFatPercent: bfPercent },
      {
        onSuccess: () => navigation.goBack(),
        onError: (err: unknown) => {
          const msg =
            (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
            'Erro ao salvar dados. Tente novamente.'
          Alert.alert('Erro', msg)
        },
      },
    )
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.field}>
        <Text style={styles.label}>Data de nascimento</Text>
        <TextInput
          style={styles.input}
          placeholder="AAAA-MM-DD"
          placeholderTextColor={colors.ink3}
          value={birthDate}
          onChangeText={setBirthDate}
          keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default'}
          accessibilityLabel="Data de nascimento"
          testID="input-birth-date"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Sexo biológico</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleButton, sex === 'male' ? styles.toggleActive : null]}
            onPress={() => setSex('male')}
            accessibilityLabel="Masculino"
            testID="toggle-male"
          >
            <Text style={[styles.toggleText, sex === 'male' ? styles.toggleTextActive : null]}>
              Masculino
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, sex === 'female' ? styles.toggleActive : null]}
            onPress={() => setSex('female')}
            accessibilityLabel="Feminino"
            testID="toggle-female"
          >
            <Text style={[styles.toggleText, sex === 'female' ? styles.toggleTextActive : null]}>
              Feminino
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Altura</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, styles.inputFlex]}
            placeholder="Ex: 175"
            placeholderTextColor={colors.ink3}
            value={heightCm}
            onChangeText={setHeightCm}
            keyboardType="numeric"
            accessibilityLabel="Altura em centímetros"
            testID="input-height"
          />
          <Text style={styles.unit}>cm</Text>
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Peso</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, styles.inputFlex]}
            placeholder="Ex: 75.5"
            placeholderTextColor={colors.ink3}
            value={weightKg}
            onChangeText={setWeightKg}
            keyboardType="numeric"
            accessibilityLabel="Peso em quilos"
            testID="input-weight"
          />
          <Text style={styles.unit}>kg</Text>
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>
          % Gordura corporal{' '}
          <Text style={styles.optional}>(opcional)</Text>
        </Text>
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, styles.inputFlex]}
            placeholder="Ex: 18"
            placeholderTextColor={colors.ink3}
            value={bodyFat}
            onChangeText={setBodyFat}
            keyboardType="numeric"
            accessibilityLabel="Percentual de gordura corporal"
            testID="input-body-fat"
          />
          <Text style={styles.unit}>%</Text>
        </View>
      </View>

      {tmbPreview != null && (
        <View style={styles.tmbCard} testID="tmb-preview">
          <Text style={styles.tmbLabel}>Nova TMB prevista</Text>
          <Text style={styles.tmbValue} testID="tmb-preview-value">
            {Math.round(tmbPreview)} kcal/dia
          </Text>
          <Text style={styles.tmbDescription}>
            Suas metas serão recalculadas ao salvar.
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.saveButton, !isFormValid || isPending ? styles.saveButtonDisabled : null]}
        onPress={handleSave}
        disabled={!isFormValid || isPending}
        testID="save-btn"
        accessibilityLabel="Salvar alterações"
      >
        {isPending ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.saveButtonText}>Salvar alterações</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 20,
    paddingBottom: 40,
    backgroundColor: colors.paper,
  },
  field: {
    gap: 8,
  },
  label: {
    ...typography.headingS,
    color: colors.ink,
  },
  optional: {
    ...typography.bodyS,
    color: colors.ink3,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.gray2,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 18,
    color: colors.ink,
    backgroundColor: colors.white,
  },
  inputFlex: {
    flex: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  unit: {
    fontSize: 18,
    color: colors.ink2,
    width: 32,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 12,
  },
  toggleButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: colors.gray2,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  toggleActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentLight,
  },
  toggleText: {
    ...typography.bodyL,
    color: colors.ink2,
  },
  toggleTextActive: {
    color: colors.accent,
    fontWeight: '600',
  },
  tmbCard: {
    backgroundColor: colors.accentLight,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  tmbLabel: {
    ...typography.bodyS,
    color: colors.ink2,
    marginBottom: 6,
  },
  tmbValue: {
    ...typography.heroNumber,
    color: colors.accent,
    marginBottom: 6,
  },
  tmbDescription: {
    ...typography.bodyS,
    color: colors.ink2,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: 48,
  },
  saveButtonDisabled: {
    opacity: 0.45,
  },
  saveButtonText: {
    ...typography.button,
    color: colors.white,
  },
})
