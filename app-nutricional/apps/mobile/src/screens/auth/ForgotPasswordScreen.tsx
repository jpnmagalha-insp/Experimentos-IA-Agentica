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
} from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { z } from 'zod'
import { api } from '../../lib/api'
import { colors } from '../../theme/colors'
import { typography } from '../../theme/typography'
import type { AuthStackParamList } from '../../navigation'

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>

const schema = z.object({ email: z.string().email('E-mail inválido') })

export function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState<string | undefined>()
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit() {
    const result = schema.safeParse({ email })
    if (!result.success) {
      setEmailError(result.error.flatten().fieldErrors.email?.[0])
      return
    }
    setEmailError(undefined)
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
      setSent(true)
    } catch {
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <View style={styles.container}>
        <View style={styles.inner}>
          <Text style={styles.title}>E-mail enviado</Text>
          <Text style={styles.message}>
            Se o e-mail estiver cadastrado, você receberá as instruções para redefinir sua senha.
          </Text>
          <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
            <Text style={styles.buttonText}>Voltar para login</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.link}>← Voltar</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Esqueci minha senha</Text>
        <Text style={styles.description}>
          Informe seu e-mail e enviaremos as instruções para redefinir sua senha.
        </Text>

        <TextInput
          style={[styles.input, emailError ? styles.inputError : null]}
          placeholder="E-mail"
          placeholderTextColor={colors.ink3}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          accessibilityLabel="Campo e-mail"
        />
        {emailError ? <Text style={styles.error}>{emailError}</Text> : null}

        <TouchableOpacity
          style={[styles.button, loading ? styles.buttonDisabled : null]}
          onPress={handleSubmit}
          disabled={loading}
          accessibilityLabel="Botão enviar instruções"
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.buttonText}>Enviar instruções</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  backButton: { position: 'absolute', top: 56, left: 24 },
  title: { ...typography.displayM, color: colors.ink, marginBottom: 12 },
  description: { ...typography.bodyS, color: colors.ink2, marginBottom: 24, lineHeight: 22 },
  message: { ...typography.bodyS, color: colors.ink2, marginBottom: 32, lineHeight: 22 },
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
  button: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
    minHeight: 48,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { ...typography.button, color: colors.white },
  link: { ...typography.link, color: colors.accent },
})
