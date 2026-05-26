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
import { api } from '../../lib/api'
import { useAuthStore } from '../../store/auth.store'
import { colors } from '../../theme/colors'
import { typography } from '../../theme/typography'

type Step = 'birthDate' | 'sex' | 'height' | 'weight' | 'bodyFat' | 'confirm'
const STEPS: Step[] = ['birthDate', 'sex', 'height', 'weight', 'bodyFat', 'confirm']

function calcAge(birthDate: string): number {
  const birth = new Date(birthDate)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

function calcTmb(
  sex: 'male' | 'female',
  weightKg: number,
  heightCm: number,
  ageYears: number,
  bodyFatPercent?: number,
): number {
  if (bodyFatPercent != null) {
    const lean = weightKg * (1 - bodyFatPercent / 100)
    return 370 + 21.6 * lean
  }
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears
  return sex === 'male' ? base + 5 : base - 161
}

export function OnboardingScreen() {
  const [step, setStep] = useState<Step>('birthDate')
  const [birthDate, setBirthDate] = useState('')
  const [sex, setSex] = useState<'male' | 'female' | null>(null)
  const [heightCm, setHeightCm] = useState('')
  const [weightKg, setWeightKg] = useState('')
  const [bodyFat, setBodyFat] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const setNeedsOnboarding = useAuthStore((s) => s.setNeedsOnboarding)

  const stepIndex = STEPS.indexOf(step)

  const tmb =
    sex && heightCm && weightKg && birthDate
      ? calcTmb(
          sex,
          parseFloat(weightKg),
          parseFloat(heightCm),
          calcAge(birthDate),
          bodyFat ? parseFloat(bodyFat) : undefined,
        )
      : null

  function next() {
    setError('')
    if (step === 'birthDate') {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate) || isNaN(new Date(birthDate).getTime())) {
        setError('Informe uma data válida no formato AAAA-MM-DD')
        return
      }
      if (calcAge(birthDate) < 10 || calcAge(birthDate) > 120) {
        setError('Idade deve ser entre 10 e 120 anos')
        return
      }
    }
    if (step === 'sex' && !sex) {
      setError('Selecione o sexo biológico')
      return
    }
    if (step === 'height') {
      const h = parseFloat(heightCm)
      if (isNaN(h) || h < 50 || h > 300) {
        setError('Informe uma altura válida (50–300 cm)')
        return
      }
    }
    if (step === 'weight') {
      const w = parseFloat(weightKg)
      if (isNaN(w) || w < 10 || w > 500) {
        setError('Informe um peso válido (10–500 kg)')
        return
      }
    }
    if (step === 'bodyFat' && bodyFat) {
      const bf = parseFloat(bodyFat)
      if (isNaN(bf) || bf < 1 || bf > 60) {
        setError('Informe um % de gordura válido (1–60)')
        return
      }
    }
    const nextIndex = stepIndex + 1
    if (nextIndex < STEPS.length) setStep(STEPS[nextIndex])
  }

  function back() {
    if (stepIndex > 0) setStep(STEPS[stepIndex - 1])
  }

  async function handleConfirm() {
    setLoading(true)
    try {
      await api.put('/users/me/profile', {
        birthDate,
        sex,
        heightCm: parseFloat(heightCm),
        weightKg: parseFloat(weightKg),
        bodyFatPercent: bodyFat ? parseFloat(bodyFat) : null,
      })
      setNeedsOnboarding(false)
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Erro ao salvar dados. Tente novamente.'
      Alert.alert('Erro', msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.progressRow}>
        {STEPS.map((s, i) => (
          <View
            key={s}
            style={[styles.progressDot, i <= stepIndex ? styles.progressDotActive : null]}
          />
        ))}
      </View>

      {step === 'birthDate' && (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>Qual é sua data de nascimento?</Text>
          <TextInput
            style={styles.input}
            placeholder="AAAA-MM-DD"
            placeholderTextColor={colors.ink3}
            value={birthDate}
            onChangeText={setBirthDate}
            keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default'}
            accessibilityLabel="Data de nascimento"
          />
        </View>
      )}

      {step === 'sex' && (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>Qual é seu sexo biológico?</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleButton, sex === 'male' ? styles.toggleActive : null]}
              onPress={() => setSex('male')}
              accessibilityLabel="Masculino"
            >
              <Text style={[styles.toggleText, sex === 'male' ? styles.toggleTextActive : null]}>
                Masculino
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, sex === 'female' ? styles.toggleActive : null]}
              onPress={() => setSex('female')}
              accessibilityLabel="Feminino"
            >
              <Text style={[styles.toggleText, sex === 'female' ? styles.toggleTextActive : null]}>
                Feminino
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {step === 'height' && (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>Qual é sua altura?</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, styles.inputFlex]}
              placeholder="Ex: 175"
              placeholderTextColor={colors.ink3}
              value={heightCm}
              onChangeText={setHeightCm}
              keyboardType="numeric"
              accessibilityLabel="Altura em centímetros"
            />
            <Text style={styles.unit}>cm</Text>
          </View>
        </View>
      )}

      {step === 'weight' && (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>Qual é seu peso atual?</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, styles.inputFlex]}
              placeholder="Ex: 75.5"
              placeholderTextColor={colors.ink3}
              value={weightKg}
              onChangeText={setWeightKg}
              keyboardType="numeric"
              accessibilityLabel="Peso em quilos"
            />
            <Text style={styles.unit}>kg</Text>
          </View>
        </View>
      )}

      {step === 'bodyFat' && (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>% de gordura corporal</Text>
          <Text style={styles.optional}>Opcional — melhora a precisão do cálculo</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, styles.inputFlex]}
              placeholder="Ex: 18"
              placeholderTextColor={colors.ink3}
              value={bodyFat}
              onChangeText={setBodyFat}
              keyboardType="numeric"
              accessibilityLabel="Percentual de gordura corporal"
            />
            <Text style={styles.unit}>%</Text>
          </View>
        </View>
      )}

      {step === 'confirm' && tmb != null && (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>Tudo certo!</Text>
          <View style={styles.tmbCard}>
            <Text style={styles.tmbLabel}>Sua Taxa Metabólica Basal</Text>
            <Text style={styles.tmbValue}>{Math.round(tmb)} kcal/dia</Text>
            <Text style={styles.tmbDescription}>
              Suas metas nutricionais serão calculadas com base nesse valor.
            </Text>
          </View>
          <Text style={styles.summary}>
            {sex === 'male' ? 'Masculino' : 'Feminino'} · {heightCm} cm · {weightKg} kg
            {bodyFat ? ` · ${bodyFat}% gordura` : ''}
          </Text>
        </View>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.navRow}>
        {stepIndex > 0 && (
          <TouchableOpacity style={styles.backButton} onPress={back}>
            <Text style={styles.backText}>Voltar</Text>
          </TouchableOpacity>
        )}

        {step !== 'confirm' ? (
          <TouchableOpacity
            style={[styles.continueButton, stepIndex === 0 ? styles.fullWidth : null]}
            onPress={next}
            accessibilityLabel="Continuar"
          >
            <Text style={styles.continueText}>
              {step === 'bodyFat' ? (bodyFat ? 'Continuar' : 'Pular') : 'Continuar'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.continueButton, loading ? styles.buttonDisabled : null]}
            onPress={handleConfirm}
            disabled={loading}
            accessibilityLabel="Confirmar e continuar"
          >
            {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.continueText}>Confirmar</Text>}
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.paper,
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 32,
  },
  progressRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 40 },
  progressDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.gray2 },
  progressDotActive: { backgroundColor: colors.accent },
  stepContainer: { flex: 1, marginBottom: 32 },
  stepTitle: { ...typography.displayS, color: colors.ink, marginBottom: 24 },
  optional: { ...typography.bodyS, color: colors.ink3, marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: colors.gray2,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 18,
    color: colors.ink,
    marginBottom: 4,
    backgroundColor: colors.white,
  },
  inputFlex: { flex: 1 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  unit: { fontSize: 18, color: colors.ink2, width: 32 },
  toggleRow: { flexDirection: 'row', gap: 12 },
  toggleButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: colors.gray2,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  toggleActive: { borderColor: colors.accent, backgroundColor: colors.accentLight },
  toggleText: { ...typography.bodyL, color: colors.ink2 },
  toggleTextActive: { color: colors.accent, fontWeight: '600' },
  tmbCard: {
    backgroundColor: colors.accentLight,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  tmbLabel: { ...typography.bodyS, color: colors.ink2, marginBottom: 8 },
  tmbValue: { ...typography.heroNumber, color: colors.accent, marginBottom: 8 },
  tmbDescription: { ...typography.bodyS, color: colors.ink2, textAlign: 'center' },
  summary: { ...typography.bodyS, color: colors.ink3, textAlign: 'center' },
  error: { ...typography.bodyS, color: colors.error, marginBottom: 12, textAlign: 'center' },
  navRow: { flexDirection: 'row', gap: 12, marginTop: 'auto' },
  backButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.gray2,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: 48,
    backgroundColor: colors.white,
  },
  backText: { ...typography.button, color: colors.ink2 },
  continueButton: {
    flex: 2,
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: 48,
  },
  fullWidth: { flex: 1 },
  buttonDisabled: { opacity: 0.6 },
  continueText: { ...typography.button, color: colors.white },
})
