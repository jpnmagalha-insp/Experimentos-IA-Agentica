import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { z } from 'zod'
import { api } from '../../lib/api'
import { useAuthStore } from '../../store/auth.store'
import { colors } from '../../theme/colors'
import { typography } from '../../theme/typography'
import type { AuthStackParamList } from '../../navigation'

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>

const schema = z
  .object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    email: z.string().email('E-mail inválido'),
    password: z
      .string()
      .min(8, 'Mínimo 8 caracteres')
      .regex(/[A-Z]/, 'Deve conter letra maiúscula')
      .regex(/[0-9]/, 'Deve conter um número'),
    confirm: z.string().min(1, 'Confirme a senha'),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'Senhas não coincidem',
    path: ['confirm'],
  })

function passwordStrength(p: string): { label: string; color: string } {
  if (p.length === 0) return { label: '', color: colors.gray2 }
  const score = [p.length >= 8, /[A-Z]/.test(p), /[0-9]/.test(p), /[^A-Za-z0-9]/.test(p)].filter(Boolean).length
  if (score <= 1) return { label: 'Fraca', color: colors.error }
  if (score === 2) return { label: 'Média', color: '#FB8C00' }
  if (score === 3) return { label: 'Boa', color: '#43A047' }
  return { label: 'Forte', color: '#1B5E20' }
}

export function RegisterScreen({ navigation }: Props) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})
  const [loading, setLoading] = useState(false)
  const login = useAuthStore((s) => s.login)
  const strength = passwordStrength(password)

  async function handleRegister() {
    const result = schema.safeParse({ name, email, password, confirm })
    if (!result.success) {
      const fe = result.error.flatten().fieldErrors
      setErrors({
        name: fe.name?.[0],
        email: fe.email?.[0],
        password: fe.password?.[0],
        confirm: fe.confirm?.[0],
      })
      return
    }
    setErrors({})
    setLoading(true)
    try {
      const res = await api.post('/auth/register', { name, email, password })
      const { accessToken, refreshToken, user } = res.data as {
        accessToken: string
        refreshToken: string
        user: { id: string; name: string; email: string }
      }
      await login({ accessToken, refreshToken }, user, true)
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Erro ao criar conta. Tente novamente.'
      Alert.alert('Erro', msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Criar conta</Text>

        <TextInput
          style={[styles.input, errors.name ? styles.inputError : null]}
          placeholder="Nome completo"
          placeholderTextColor={colors.ink3}
          value={name}
          onChangeText={setName}
          accessibilityLabel="Campo nome"
        />
        {errors.name ? <Text style={styles.error}>{errors.name}</Text> : null}

        <TextInput
          style={[styles.input, errors.email ? styles.inputError : null]}
          placeholder="E-mail"
          placeholderTextColor={colors.ink3}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          accessibilityLabel="Campo e-mail"
        />
        {errors.email ? <Text style={styles.error}>{errors.email}</Text> : null}

        <TextInput
          style={[styles.input, errors.password ? styles.inputError : null]}
          placeholder="Senha"
          placeholderTextColor={colors.ink3}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          accessibilityLabel="Campo senha"
        />
        {password.length > 0 && (
          <View style={styles.strengthRow}>
            <View style={[styles.strengthBar, { backgroundColor: strength.color }]} />
            <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
          </View>
        )}
        {errors.password ? <Text style={styles.error}>{errors.password}</Text> : null}

        <TextInput
          style={[styles.input, errors.confirm ? styles.inputError : null]}
          placeholder="Confirmar senha"
          placeholderTextColor={colors.ink3}
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          accessibilityLabel="Campo confirmar senha"
        />
        {errors.confirm ? <Text style={styles.error}>{errors.confirm}</Text> : null}

        <TouchableOpacity
          style={[styles.button, loading ? styles.buttonDisabled : null]}
          onPress={handleRegister}
          disabled={loading}
          accessibilityLabel="Botão criar conta"
        >
          {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.buttonText}>Criar conta</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.loginLink} onPress={() => navigation.goBack()}>
          <Text style={styles.link}>Já tenho conta — Entrar</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  inner: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },
  title: { ...typography.displayL, color: colors.ink, marginBottom: 28, textAlign: 'center' },
  input: {
    borderWidth: 1,
    borderColor: colors.gray2,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...typography.inputText,
    color: colors.ink,
    marginBottom: 4,
    backgroundColor: colors.white,
  },
  inputError: { borderColor: colors.error },
  error: { ...typography.caption, color: colors.error, marginBottom: 8 },
  strengthRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  strengthBar: { height: 4, width: 60, borderRadius: 2, marginRight: 8 },
  strengthLabel: { ...typography.caption },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
    minHeight: 48,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { ...typography.button, color: colors.white },
  loginLink: { alignItems: 'center', marginTop: 4 },
  link: { ...typography.link, color: colors.accent },
})
