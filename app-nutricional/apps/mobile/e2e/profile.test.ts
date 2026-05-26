/// <reference types="detox" />

import { calcAge, calcTmb } from '../src/lib/tmb'
import { ensureTestUser, loginTestUser, updateProfile, TEST_EMAIL, TEST_PASSWORD } from './setup'

const BIRTH_DATE = '1990-05-15'
const BASE_PROFILE = {
  birthDate: BIRTH_DATE,
  sex: 'male' as const,
  heightCm: 175,
}

describe('Feature: Perfil do Usuário', () => {
  let apiToken: string

  beforeAll(async () => {
    await ensureTestUser()
    const { accessToken } = await loginTestUser()
    apiToken = accessToken
    await device.launchApp({ newInstance: true })
    await loginViaUI()
  })

  it('Scenario: Atualizar peso recalcula metas', async () => {
    // Pre-condition via API: profile with weight 82kg
    await updateProfile(apiToken, { ...BASE_PROFILE, weightKg: 82 })

    // Reload so React Query picks up the new server state
    await device.reloadReactNative()
    await waitFor(element(by.id('meal-section-breakfast'))).toBeVisible().withTimeout(10000)

    // Navigate to Profile tab
    await element(by.text('Perfil')).tap()
    await waitFor(element(by.id('edit-profile-btn'))).toBeVisible().withTimeout(8000)

    // Open EditProfile modal and change weight to 80
    await element(by.id('edit-profile-btn')).tap()
    await waitFor(element(by.id('input-weight'))).toBeVisible().withTimeout(5000)
    await element(by.id('input-weight')).clearText()
    await element(by.id('input-weight')).typeText('80')
    await element(by.id('save-btn')).tap()

    // Back in ProfileScreen — TMB row must reflect the new weight (DR-01)
    const expectedAge = calcAge(BIRTH_DATE)
    const tmb80 = calcTmb(BASE_PROFILE.sex, 80, BASE_PROFILE.heightCm, expectedAge)
    const expectedTmbText = `${Math.round(tmb80)} kcal/dia`
    await waitFor(element(by.text(expectedTmbText))).toBeVisible().withTimeout(8000)

    // Navigate to Home — caloric goal must match the new TMB (DR-04: meta = round(TMB))
    await element(by.text('Início')).tap()
    await waitFor(element(by.id('kcal-goal'))).toBeVisible().withTimeout(8000)
    await expect(element(by.id('kcal-goal'))).toHaveText(`${Math.round(tmb80)} kcal`)
  })

  it('Scenario: Visualização de idade calculada', async () => {
    // Pre-condition via API: ensure the test user has BIRTH_DATE in profile
    await updateProfile(apiToken, { ...BASE_PROFILE, weightKg: 75 })

    // Reload for fresh server data
    await device.reloadReactNative()
    await waitFor(element(by.id('meal-section-breakfast'))).toBeVisible().withTimeout(10000)

    // Navigate to Profile tab
    await element(by.text('Perfil')).tap()
    await waitFor(element(by.id('edit-profile-btn'))).toBeVisible().withTimeout(8000)

    // DR-03: age is computed at query time — Gherkin says "35 anos" but with
    // birthDate 1990-05-15 and today 2026-05-26 the correct value is 36.
    // We derive it dynamically to stay accurate as time passes.
    const expectedAge = calcAge(BIRTH_DATE)
    await expect(element(by.text(`${expectedAge} anos`))).toBeVisible()

    // birthDate must NOT be displayed directly in view mode (R3.2)
    await expect(element(by.id('input-birth-date'))).not.toExist()
    await expect(element(by.text(BIRTH_DATE))).not.toExist()
  })

  it('Scenario: Data de nascimento visível apenas no modo de edição', async () => {
    // Start fresh to avoid leftover state from previous test
    await device.reloadReactNative()
    await waitFor(element(by.id('meal-section-breakfast'))).toBeVisible().withTimeout(10000)

    // Navigate to Profile tab
    await element(by.text('Perfil')).tap()
    await waitFor(element(by.id('edit-profile-btn'))).toBeVisible().withTimeout(8000)

    // View mode: birthDate input absent (R3.2)
    await expect(element(by.id('input-birth-date'))).not.toExist()

    // Tap Edit — EditProfile modal opens
    await element(by.id('edit-profile-btn')).tap()

    // Edit mode: birthDate input is visible and editable (R3.3)
    await waitFor(element(by.id('input-birth-date'))).toBeVisible().withTimeout(5000)
    await expect(element(by.id('input-birth-date'))).toBeVisible()
  })
})

async function loginViaUI(): Promise<void> {
  try {
    await waitFor(element(by.id('meal-section-breakfast'))).toBeVisible().withTimeout(2000)
    return
  } catch {
    // Not on DailyLog yet — proceed with login
  }
  await waitFor(element(by.id('login-email-input'))).toBeVisible().withTimeout(8000)
  await element(by.id('login-email-input')).typeText(TEST_EMAIL)
  await element(by.id('login-password-input')).typeText(TEST_PASSWORD)
  await element(by.id('login-btn')).tap()
  await waitFor(element(by.id('meal-section-breakfast'))).toBeVisible().withTimeout(12000)
}
