import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useCurrentUser } from '../../hooks/useCurrentUser'
import { useAuthStore } from '../../store/auth.store'
import { colors } from '../../theme/colors'
import { typography } from '../../theme/typography'

const SEX_LABEL: Record<string, string> = {
  male: 'Masculino',
  female: 'Feminino',
}

function formatBodyFat(value: number | null): string {
  return value !== null ? `${value}%` : '—'
}

export function ProfileScreen() {
  const { data, isLoading, isError, refetch } = useCurrentUser()
  const logout = useAuthStore((s) => s.logout)

  const handleLogout = () => {
    Alert.alert('Sair', 'Deseja sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => { void logout() } },
    ])
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
      </SafeAreaView>
    )
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.errorText}>Não foi possível carregar o perfil.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => void refetch()}>
          <Text style={styles.retryButtonText}>Tentar novamente</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  const user = data
  const profile = user?.profile ?? null

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Perfil</Text>
          {user && (
            <>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
            </>
          )}
        </View>

        {profile === null ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Complete seu onboarding para ver os dados corporais.</Text>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Dados corporais</Text>
            <DataRow label="Idade" value={`${profile.age} anos`} testID="row-age" />
            <DataRow label="Sexo" value={SEX_LABEL[profile.sex] ?? profile.sex} testID="row-sex" />
            <DataRow label="Altura" value={`${profile.heightCm} cm`} testID="row-height" />
            <DataRow label="Peso" value={`${profile.weightKg} kg`} testID="row-weight" />
            <DataRow label="% Gordura" value={formatBodyFat(profile.bodyFatPercent)} testID="row-body-fat" />
            <DataRow label="TMB" value={`${Math.round(profile.tmb)} kcal/dia`} testID="row-tmb" last />
          </View>
        )}

        <View style={styles.actions}>
          {/* TODO: habilitar quando EditProfileScreen for implementado (NUT-147) */}
          <TouchableOpacity
            style={[styles.button, styles.buttonDisabled]}
            disabled
            testID="edit-profile-btn"
          >
            <Text style={[styles.buttonText, styles.buttonTextDisabled]}>Editar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.buttonDestructive]}
            onPress={handleLogout}
            testID="logout-btn"
          >
            <Text style={[styles.buttonText, styles.buttonTextDestructive]}>Sair</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

interface DataRowProps {
  label: string
  value: string
  testID?: string
  last?: boolean
}

function DataRow({ label, value, testID, last }: DataRowProps) {
  return (
    <View style={[styles.dataRow, !last && styles.dataRowBorder]} testID={testID}>
      <Text style={styles.dataLabel}>{label}</Text>
      <Text style={styles.dataValue}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.paper,
    gap: 16,
  },
  scroll: {
    padding: 20,
    gap: 16,
  },
  header: {
    paddingVertical: 12,
    gap: 4,
  },
  title: {
    ...typography.headingL,
    color: colors.ink,
    marginBottom: 8,
  },
  userName: {
    ...typography.headingM,
    color: colors.ink,
  },
  userEmail: {
    ...typography.bodyS,
    color: colors.ink2,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.gray1,
  },
  cardTitle: {
    ...typography.headingS,
    color: colors.ink,
    marginBottom: 12,
  },
  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.gray1,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.ink3,
    textAlign: 'center',
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  dataRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray1,
  },
  dataLabel: {
    ...typography.body,
    color: colors.ink2,
  },
  dataValue: {
    ...typography.bodyS,
    color: colors.ink,
    fontWeight: '600',
  },
  actions: {
    gap: 12,
    marginTop: 8,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: colors.gray1,
  },
  buttonDestructive: {
    backgroundColor: colors.accentLight,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  buttonText: {
    ...typography.button,
  },
  buttonTextDisabled: {
    color: colors.ink3,
  },
  buttonTextDestructive: {
    color: colors.accent,
  },
  errorText: {
    ...typography.body,
    color: colors.ink2,
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: colors.accentLight,
    borderRadius: 8,
  },
  retryButtonText: {
    ...typography.button,
    color: colors.accent,
  },
})
