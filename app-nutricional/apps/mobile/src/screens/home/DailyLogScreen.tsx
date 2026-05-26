import React, { useState, useRef, useCallback, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  PanResponder,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { CompositeNavigationProp } from '@react-navigation/native'
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useAppStore } from '../../store/app.store'
import { useDailyLog, useDeleteLog, useUpdateLog } from '../../hooks/useDailyLog'
import { useCurrentUser } from '../../hooks/useCurrentUser'
import { colors } from '../../theme/colors'
import { typography } from '../../theme/typography'
import type { FoodLogItemDto, MealType } from '@nutri-ia/shared'
import type { AppTabParamList, AppStackParamList } from '../../navigation'

type DailyLogNavProp = CompositeNavigationProp<
  BottomTabNavigationProp<AppTabParamList, 'Home'>,
  NativeStackNavigationProp<AppStackParamList>
>

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Café da Manhã',
  lunch: 'Almoço',
  dinner: 'Jantar',
  snack: 'Lanche',
}

const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']
const DELETE_BTN_WIDTH = 80
const SWIPE_THRESHOLD = DELETE_BTN_WIDTH / 2

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

// ---------------------------------------------------------------------------

interface LogItemProps {
  item: FoodLogItemDto
  onDelete: () => void
  onEdit: () => void
}

function LogItem({ item, onDelete, onEdit }: LogItemProps) {
  const translateX = useRef(new Animated.Value(0)).current
  const isOpen = useRef(false)

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > 5 && Math.abs(gs.dx) > Math.abs(gs.dy),
      onPanResponderMove: (_, gs) => {
        const base = isOpen.current ? -DELETE_BTN_WIDTH : 0
        const next = Math.min(0, Math.max(-DELETE_BTN_WIDTH, base + gs.dx))
        translateX.setValue(next)
      },
      onPanResponderRelease: (_, gs) => {
        const base = isOpen.current ? -DELETE_BTN_WIDTH : 0
        const final = base + gs.dx
        const shouldOpen = final < -SWIPE_THRESHOLD
        isOpen.current = shouldOpen
        Animated.spring(translateX, {
          toValue: shouldOpen ? -DELETE_BTN_WIDTH : 0,
          useNativeDriver: true,
        }).start()
      },
    })
  ).current

  const closeSwipe = useCallback(() => {
    isOpen.current = false
    Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start()
  }, [translateX])

  return (
    <View style={styles.logItemWrapper}>
      <TouchableOpacity
        style={styles.deleteBtn}
        testID={`delete-btn-${item.id}`}
        onPress={() => {
          closeSwipe()
          onDelete()
        }}
      >
        <Text style={styles.deleteBtnText}>Excluir</Text>
      </TouchableOpacity>
      <Animated.View
        style={[styles.logItem, { transform: [{ translateX }] }]}
        testID={`log-item-${item.id}`}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity style={styles.logItemInner} onPress={onEdit} activeOpacity={0.7} testID={`log-item-edit-${item.id}`}>
          <View style={styles.logItemLeft}>
            <Text style={styles.logItemName} numberOfLines={1}>
              {item.food.name}
            </Text>
            <Text style={styles.logItemQty}>
              {item.quantity}
              {item.unit === 'g' ? 'g' : ' porção'}
            </Text>
          </View>
          <Text style={styles.logItemKcal}>{Math.round(item.calories)} kcal</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  )
}

// ---------------------------------------------------------------------------

interface EditModalProps {
  item: FoodLogItemDto | null
  onClose: () => void
  onSave: (quantity: number) => void
  isLoading: boolean
}

function EditModal({ item, onClose, onSave, isLoading }: EditModalProps) {
  const [qty, setQty] = useState('')

  useEffect(() => {
    if (item) setQty(String(item.quantity))
  }, [item])

  const handleSave = () => {
    const num = parseFloat(qty)
    if (!isNaN(num) && num > 0) onSave(num)
  }

  return (
    <Modal
      visible={item !== null}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          onPress={onClose}
          activeOpacity={1}
        />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>{item?.food.name}</Text>
          <Text style={styles.modalLabel}>Quantidade (g)</Text>
          <TextInput
            style={styles.modalInput}
            value={qty}
            onChangeText={setQty}
            keyboardType="numeric"
            autoFocus
            selectTextOnFocus
            testID="edit-qty-input"
          />
          <TouchableOpacity
            style={[styles.modalSaveBtn, isLoading && styles.modalSaveBtnDisabled]}
            onPress={handleSave}
            disabled={isLoading}
            testID="edit-save-btn"
          >
            {isLoading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.modalSaveBtnText}>Salvar</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

// ---------------------------------------------------------------------------

interface MealSectionProps {
  title: string
  mealType: MealType
  items: FoodLogItemDto[]
  onAdd: () => void
  onDelete: (id: string) => void
  onEdit: (item: FoodLogItemDto) => void
}

function MealSection({ title, mealType, items, onAdd, onDelete, onEdit }: MealSectionProps) {
  const totalKcal = items.reduce((sum, i) => sum + i.calories, 0)

  return (
    <View style={styles.mealSection} testID={`meal-section-${mealType}`}>
      <View style={styles.mealHeader}>
        <View>
          <Text style={styles.mealTitle}>{title}</Text>
          {items.length > 0 && (
            <Text style={styles.mealTotal}>{Math.round(totalKcal)} kcal</Text>
          )}
        </View>
        <TouchableOpacity onPress={onAdd} style={styles.addBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} testID={`add-food-btn-${mealType}`}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>
      {items.length === 0 ? (
        <Text style={styles.mealEmpty}>Nenhum item registrado</Text>
      ) : (
        items.map((item) => (
          <LogItem
            key={item.id}
            item={item}
            onDelete={() => onDelete(item.id)}
            onEdit={() => onEdit(item)}
          />
        ))
      )}
    </View>
  )
}

// ---------------------------------------------------------------------------

export function DailyLogScreen({ navigation }: { navigation: DailyLogNavProp }) {
  const { selectedDate, setSelectedDate } = useAppStore()
  const { data, isLoading } = useDailyLog(selectedDate)
  const { data: user } = useCurrentUser()
  const deleteLog = useDeleteLog(selectedDate)
  const updateLog = useUpdateLog(selectedDate)
  const [editingItem, setEditingItem] = useState<FoodLogItemDto | null>(null)

  const isToday = selectedDate === todayISO()
  const goalCalories = user?.currentGoal?.calories ?? 0
  const totalCalories = data?.totals.calories ?? 0
  const progressPercent =
    goalCalories > 0 ? Math.min(100, Math.round((totalCalories / goalCalories) * 100)) : 0

  const handleDelete = useCallback(
    (logId: string) => {
      Alert.alert('Excluir item', 'Tem certeza que deseja remover este item?', [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => deleteLog.mutate(logId),
        },
      ])
    },
    [deleteLog]
  )

  const handleUpdateQty = useCallback(
    (quantity: number) => {
      if (!editingItem) return
      updateLog.mutate(
        { logId: editingItem.id, quantity },
        { onSuccess: () => setEditingItem(null) }
      )
    },
    [editingItem, updateLog]
  )

  const handleAdd = useCallback(
    (mealType: MealType) => {
      navigation.navigate('FoodSearch', { mealType, date: selectedDate })
    },
    [navigation, selectedDate]
  )

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

      <TouchableOpacity
        style={styles.kcalCard}
        onPress={() => navigation.navigate('Report')}
        activeOpacity={0.85}
      >
        <View style={styles.kcalRow}>
          <Text style={styles.kcalConsumed} testID="kcal-consumed">{Math.round(totalCalories)}</Text>
          <Text style={styles.kcalSep}> / </Text>
          <Text style={styles.kcalGoal}>{goalCalories} kcal</Text>
        </View>
        <View style={styles.kcalBarTrack}>
          <View style={[styles.kcalBarFill, { width: `${progressPercent}%` }]} />
        </View>
        <Text style={styles.kcalSub}>{progressPercent}% da meta · toque para relatório</Text>
      </TouchableOpacity>

      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={colors.accent} />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {MEAL_ORDER.map((mealType) => (
            <MealSection
              key={mealType}
              title={MEAL_LABELS[mealType]}
              mealType={mealType}
              items={data?.meals[mealType] ?? []}
              onAdd={() => handleAdd(mealType)}
              onDelete={handleDelete}
              onEdit={setEditingItem}
            />
          ))}
        </ScrollView>
      )}

      <EditModal
        item={editingItem}
        onClose={() => setEditingItem(null)}
        onSave={handleUpdateQty}
        isLoading={updateLog.isPending}
      />
    </SafeAreaView>
  )
}

// ---------------------------------------------------------------------------

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

  kcalCard: {
    margin: 16,
    padding: 16,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray1,
  },
  kcalRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 10 },
  kcalConsumed: { ...typography.heroNumber, color: colors.ink },
  kcalSep: { fontSize: 18, color: colors.gray2 },
  kcalGoal: { ...typography.bodyL, color: colors.ink2 },
  kcalBarTrack: {
    height: 6,
    backgroundColor: colors.gray1,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  kcalBarFill: { height: '100%', backgroundColor: colors.accent, borderRadius: 3 },
  kcalSub: { ...typography.caption, color: colors.ink3 },

  loader: { marginTop: 40 },
  scrollContent: { paddingBottom: 32 },

  mealSection: {
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.gray1,
    overflow: 'hidden',
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11,
    backgroundColor: colors.paper,
  },
  mealTitle: { ...typography.headingS, color: colors.ink },
  mealTotal: { ...typography.caption, color: colors.ink3, marginTop: 1 },
  addBtn: { paddingVertical: 2, paddingHorizontal: 6 },
  addBtnText: { ...typography.bodyS, color: colors.accent, fontWeight: '600' },
  mealEmpty: { ...typography.caption, color: colors.gray2, paddingVertical: 14, textAlign: 'center' },

  logItemWrapper: {
    position: 'relative',
    borderTopWidth: 1,
    borderTopColor: colors.gray1,
    overflow: 'hidden',
  },
  deleteBtn: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: DELETE_BTN_WIDTH,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtnText: { color: colors.white, fontSize: 13, fontWeight: '600' },
  logItem: { backgroundColor: colors.white },
  logItemInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  logItemLeft: { flex: 1, marginRight: 8 },
  logItemName: { ...typography.bodyS, color: colors.ink },
  logItemQty: { ...typography.caption, color: colors.ink3, marginTop: 2 },
  logItemKcal: { ...typography.bodyS, color: colors.ink2 },

  modalOverlay: { flex: 1 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: {
    backgroundColor: colors.paper,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.gray2,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: { ...typography.headingS, color: colors.ink, marginBottom: 16 },
  modalLabel: { ...typography.caption, color: colors.ink3, marginBottom: 6 },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.gray2,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    ...typography.inputText,
    color: colors.ink,
    marginBottom: 16,
    backgroundColor: colors.white,
  },
  modalSaveBtn: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalSaveBtnDisabled: { opacity: 0.6 },
  modalSaveBtnText: { ...typography.button, color: colors.white },
})
