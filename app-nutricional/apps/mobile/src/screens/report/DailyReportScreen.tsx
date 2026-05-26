import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAppStore } from '../../store/app.store'
import { useDailyReport } from '../../hooks/useDailyReport'
import { colors } from '../../theme/colors'
import { typography } from '../../theme/typography'
import type { BalanceStatus } from '@nutri-ia/shared'

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function formatDateLabel(dateStr: string): string {
  if (dateStr === todayISO()) return 'Hoje'
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })
}

function shiftDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function statusColor(status: BalanceStatus): string {
  if (status === 'deficit') return colors.success
  if (status === 'surplus') return colors.error
  return colors.info
}

function statusLabel(status: BalanceStatus, balance: number): string {
  const abs = Math.abs(Math.round(balance))
  if (status === 'deficit') return `-${abs} kcal (déficit)`
  if (status === 'surplus') return `+${abs} kcal (superávit)`
  return `${Math.round(balance) >= 0 ? '+' : ''}${Math.round(balance)} kcal (na meta)`
}

interface MacroRowProps {
  label: string
  consumed: number
  goal: number
  progress: number
}

function MacroRow({ label, consumed, goal, progress }: MacroRowProps) {
  const pct = Math.min(1, progress)
  return (
    <View style={styles.macroRow} testID={`macro-row-${label.toLowerCase()}`}>
      <View style={styles.macroLabelRow}>
        <Text style={styles.macroLabel}>{label}</Text>
        <Text style={styles.macroValues}>
          {Math.round(consumed)} / {Math.round(goal)}g
        </Text>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${Math.round(pct * 100)}%` }]} />
      </View>
    </View>
  )
}

export function DailyReportScreen() {
  const { selectedDate, setSelectedDate } = useAppStore()
  const { data, isLoading } = useDailyReport(selectedDate)

  const isToday = selectedDate === todayISO()
  const cardColor = data ? statusColor(data.balance.status) : colors.accent
  const progressPct =
    data && data.goal.calories > 0
      ? Math.min(100, Math.round((data.consumed.calories / data.goal.calories) * 100))
      : 0

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.dateHeader}>
        <TouchableOpacity
          onPress={() => setSelectedDate(shiftDate(selectedDate, -1))}
          style={styles.dateArrow}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.dateArrowText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.dateLabel}>{formatDateLabel(selectedDate)}</Text>
        <TouchableOpacity
          onPress={() => setSelectedDate(shiftDate(selectedDate, 1))}
          style={styles.dateArrow}
          disabled={isToday}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[styles.dateArrowText, isToday && styles.dateArrowDisabled]}>›</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={colors.accent} />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={[styles.kcalCard, { borderColor: cardColor }]} testID="report-kcal-card">
            <View style={styles.kcalRow}>
              <Text style={[styles.kcalConsumed, { color: cardColor }]} testID="report-consumed">
                {Math.round(data?.consumed.calories ?? 0)}
              </Text>
              <Text style={styles.kcalSep}> / </Text>
              <Text style={styles.kcalGoal} testID="report-goal">
                {data?.goal.calories ?? 0} kcal
              </Text>
            </View>
            <View style={styles.barTrack}>
              <View
                style={[styles.barFill, { width: `${progressPct}%`, backgroundColor: cardColor }]}
              />
            </View>
            <Text style={styles.kcalPct}>{progressPct}%</Text>
            {data && (
              <Text style={[styles.balanceLabel, { color: cardColor }]} testID="report-balance">
                {statusLabel(data.balance.status, data.balance.calories)}
              </Text>
            )}
          </View>

          {data && (
            <View style={styles.macroSection}>
              <MacroRow
                label="Proteína"
                consumed={data.consumed.proteinG}
                goal={data.goal.proteinG}
                progress={data.progress.proteinG}
              />
              <MacroRow
                label="Gordura"
                consumed={data.consumed.fatG}
                goal={data.goal.fatG}
                progress={data.progress.fatG}
              />
              <MacroRow
                label="Carboidrato"
                consumed={data.consumed.carbG}
                goal={data.goal.carbG}
                progress={data.progress.carbG}
              />
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },

  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray1,
  },
  dateArrow: { padding: 4 },
  dateArrowText: { fontSize: 26, color: colors.ink, lineHeight: 30 },
  dateArrowDisabled: { color: colors.gray2 },
  dateLabel: { ...typography.headingS, color: colors.ink },

  loader: { marginTop: 40 },
  scrollContent: { padding: 16 },

  kcalCard: {
    padding: 20,
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 2,
    marginBottom: 16,
  },
  kcalRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 12 },
  kcalConsumed: { ...typography.heroNumber },
  kcalSep: { fontSize: 18, color: colors.gray2 },
  kcalGoal: { ...typography.bodyL, color: colors.ink2 },
  kcalPct: { ...typography.caption, color: colors.ink3, marginTop: 6 },
  balanceLabel: { ...typography.bodyS, fontWeight: '600', marginTop: 8 },

  barTrack: {
    height: 6,
    backgroundColor: colors.gray1,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: { height: '100%', backgroundColor: colors.accent, borderRadius: 3 },

  macroSection: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray1,
    padding: 16,
    gap: 16,
  },
  macroRow: { gap: 6 },
  macroLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  macroLabel: { ...typography.bodyS, color: colors.ink },
  macroValues: { ...typography.caption, color: colors.ink3 },
})
