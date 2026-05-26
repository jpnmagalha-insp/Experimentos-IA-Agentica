/// <reference types="detox" />

import {
  clearLogs,
  ensureTestUser,
  findFood,
  loginTestUser,
  seedLog,
  TEST_EMAIL,
  TEST_PASSWORD,
} from './setup'

const TODAY = new Date().toISOString().slice(0, 10)

describe('Feature: Log Alimentar', () => {
  let apiToken: string

  beforeAll(async () => {
    await ensureTestUser()
    const { accessToken } = await loginTestUser()
    apiToken = accessToken

    await device.launchApp({ newInstance: true })
    await loginViaUI()
  })

  beforeEach(async () => {
    await clearLogs(apiToken, TODAY)
    await device.reloadReactNative()
    await waitFor(element(by.id('meal-section-breakfast')))
      .toBeVisible()
      .withTimeout(8000)
  })

  it('Scenario: Adicionar alimento por gramagem', async () => {
    await element(by.id('add-food-btn-lunch')).tap()

    await waitFor(element(by.id('food-search-input'))).toBeVisible().withTimeout(3000)
    await element(by.id('food-search-input')).typeText('arroz branco')

    await waitFor(element(by.text('Arroz, branco, cozido'))).toBeVisible().withTimeout(8000)
    await element(by.text('Arroz, branco, cozido')).tap()

    await waitFor(element(by.id('qty-input'))).toBeVisible().withTimeout(3000)
    await element(by.id('qty-input')).typeText('150')

    await waitFor(element(by.id('preview-kcal'))).toBeVisible().withTimeout(3000)
    await expect(element(by.id('preview-kcal'))).toHaveText('192 kcal')
    await expect(element(by.id('preview-macros'))).toHaveText('P: 3.8g · G: 0.3g · C: 42.2g')

    await element(by.id('submit-btn')).tap()

    await waitFor(element(by.id('meal-section-lunch'))).toBeVisible().withTimeout(8000)
    await expect(element(by.text('Arroz, branco, cozido'))).toBeVisible()
    await expect(element(by.id('kcal-consumed'))).toHaveText('192')
  })

  it('Scenario: Adicionar alimento por medida caseira', async () => {
    await element(by.id('add-food-btn-lunch')).tap()

    await waitFor(element(by.id('food-search-input'))).toBeVisible().withTimeout(3000)
    await element(by.id('food-search-input')).typeText('azeite de oliva')

    await waitFor(element(by.text('Azeite de oliva'))).toBeVisible().withTimeout(8000)
    await element(by.text('Azeite de oliva')).tap()

    await waitFor(element(by.id('toggle-measure'))).toBeVisible().withTimeout(3000)
    await element(by.id('toggle-measure')).tap()

    await waitFor(element(by.text('colher de sopa'))).toBeVisible().withTimeout(3000)
    await element(by.text('colher de sopa')).tap()

    await element(by.id('qty-input')).typeText('2')

    await waitFor(element(by.id('preview-kcal'))).toBeVisible().withTimeout(3000)
    await expect(element(by.id('preview-kcal'))).toBeVisible()
    await expect(element(by.id('preview-macros'))).toBeVisible()
  })

  it('Scenario: Busca sem resultados', async () => {
    await element(by.id('add-food-btn-lunch')).tap()

    await waitFor(element(by.id('food-search-input'))).toBeVisible().withTimeout(3000)
    await element(by.id('food-search-input')).typeText('xyzabc123')

    await waitFor(element(by.id('food-empty-state'))).toBeVisible().withTimeout(8000)
    await expect(element(by.id('food-empty-state'))).toBeVisible()
  })

  it('Scenario: Editar quantidade de item registrado', async () => {
    const ovoFrito = await findFood(apiToken, 'ovo frito')
    const log = await seedLog(apiToken, {
      foodId: ovoFrito.id,
      date: TODAY,
      mealType: 'breakfast',
      quantity: 60,
    })

    await device.reloadReactNative()
    await waitFor(element(by.id(`log-item-edit-${log.id}`)))
      .toBeVisible()
      .withTimeout(8000)
    await element(by.id(`log-item-edit-${log.id}`)).tap()

    await waitFor(element(by.id('edit-qty-input'))).toBeVisible().withTimeout(3000)
    await element(by.id('edit-qty-input')).clearText()
    await element(by.id('edit-qty-input')).typeText('90')
    await element(by.id('edit-save-btn')).tap()

    await waitFor(element(by.id('edit-qty-input'))).not.toBeVisible().withTimeout(5000)
    await expect(element(by.text('90g'))).toBeVisible()
  })

  it('Scenario: Excluir item do log', async () => {
    const paofrances = await findFood(apiToken, 'pão francês')
    const log = await seedLog(apiToken, {
      foodId: paofrances.id,
      date: TODAY,
      mealType: 'breakfast',
      quantity: 50,
    })

    await device.reloadReactNative()
    await waitFor(element(by.id(`log-item-${log.id}`)))
      .toBeVisible()
      .withTimeout(8000)

    await element(by.id(`log-item-${log.id}`)).swipe('left', 'fast', 0.75)
    await waitFor(element(by.id(`delete-btn-${log.id}`)))
      .toBeVisible()
      .withTimeout(3000)
    await element(by.id(`delete-btn-${log.id}`)).tap()

    await waitFor(element(by.text('Excluir'))).toBeVisible().withTimeout(3000)
    await element(by.text('Excluir')).tap()

    await waitFor(element(by.id(`log-item-${log.id}`)))
      .not.toBeVisible()
      .withTimeout(8000)
  })
})

async function loginViaUI(): Promise<void> {
  try {
    await waitFor(element(by.id('meal-section-breakfast'))).toBeVisible().withTimeout(2000)
    return
  } catch {
    // Not on DailyLog yet, proceed with login
  }

  await waitFor(element(by.id('login-email-input'))).toBeVisible().withTimeout(8000)
  await element(by.id('login-email-input')).typeText(TEST_EMAIL)
  await element(by.id('login-password-input')).typeText(TEST_PASSWORD)
  await element(by.id('login-btn')).tap()

  await waitFor(element(by.id('meal-section-breakfast'))).toBeVisible().withTimeout(12000)
}
