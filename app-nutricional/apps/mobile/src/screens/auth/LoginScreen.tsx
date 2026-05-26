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
} from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { z } from 'zod'
import { api } from '../../lib/api'
import { useAuthStore } from '../../store/auth.store'
import { Logo } from '../../components/Logo'
import { colors } from '../../theme/colors'
import { typography } from '../../theme/typography'
import type { AuthStackParamList } from '../../navigation'

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
})

export function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [loading, setLoading] = useState(false)
  const login = useAuthStore((s) => s.login)

  async function handleLogin() {
    const result = schema.safeParse({ email, password })
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors
      setErrors({ email: fieldErrors.email?.[0], password: fieldErrors.password?.[0] })
      return
    }
    setErrors({})
    setLoading(true)
    try {
      const res = await api.post('/auth/login', { email, password })
      const { accessToken, refreshToken, user } = res.data as {
        accessToken: string
        refreshToken: string
        user: { id: string; name: string; email: string }
      }
      await login({ accessToken, refreshToken }, user, false)
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Erro ao entrar. Tente novamente.'
      Alert.alert('Erro', msg)
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleLogin() {
    Alert.alert('Em breve', 'Login com Google disponível em breve.')
  }

  async function handleAppleLogin() {
    Alert.alert('Em breve', 'Login com Apple disponível em breve.')
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <View style={styles.logoWrapper}>
          <Logo size="hero" />
        </View>
        <Text style={styles.subtitle}>Entrar na sua conta</Text>

        <TextInput
          style={[styles.input, errors.email ? styles.inputError : null]}
          placeholder="E-mail"
          placeholderTextColor={colors.ink3}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          accessibilityLabel="Campo de e-mail"
          testID="login-email-input"
        />
        {errors.email ? <Text style={styles.error}>{errors.email}</Text> : null}

        <TextInput
          style={[styles.input, errors.password ? styles.inputError : null]}
          placeholder="Senha"
          placeholderTextColor={colors.ink3}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          accessibilityLabel="Campo de senha"
          testID="login-password-input"
        />
        {errors.password ? <Text style={styles.error}>{errors.password}</Text> : null}

        <TouchableOpacity
          style={styles.forgotLink}
          onPress={() => navigation.navigate('ForgotPassword')}
        >
          <Text style={styles.link}>Esqueci minha senha</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, loading ? styles.buttonDisabled : null]}
          onPress={handleLogin}
          disabled={loading}
          accessibilityLabel="Botão entrar"
          testID="login-btn"
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.buttonText}>Entrar</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.socialButton} onPress={handleGoogleLogin}>
          <Text style={styles.socialButtonText}>Entrar com Google</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.socialButton} onPress={handleAppleLogin}>
          <Text style={styles.socialButtonText}>Entrar com Apple</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.registerLink}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.link}>Criar conta</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  logoWrapper: { alignItems: 'center', marginBottom: 32 },
  subtitle: { ...typography.body, color: colors.ink2, textAlign: 'center', marginBottom: 32 },
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
  forgotLink: { alignSelf: 'flex-end', marginBottom: 16 },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
    minHeight: 48,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { ...typography.button, color: colors.white },
  socialButton: {
    borderWidth: 1,
    borderColor: colors.gray2,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
    minHeight: 48,
    backgroundColor: colors.white,
  },
  socialButtonText: { ...typography.body, color: colors.ink },
  registerLink: { alignItems: 'center', marginTop: 8 },
  link: { ...typography.link, color: colors.accent },
})
