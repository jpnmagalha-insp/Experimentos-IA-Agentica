import React from 'react'
import { Alert } from 'react-native'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { EditProfileScreen } from '../EditProfileScreen'

jest.mock('../../../hooks/useCurrentUser')
jest.mock('../../../hooks/useUpdateProfile')
jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
}))

const mockUseCurrentUser = jest.requireMock('../../../hooks/useCurrentUser') as {
  useCurrentUser: jest.Mock
}
const mockUseUpdateProfile = jest.requireMock('../../../hooks/useUpdateProfile') as {
  useUpdateProfile: jest.Mock
}
const mockUseNavigation = jest.requireMock('@react-navigation/native') as {
  useNavigation: jest.Mock
}

const mockGoBack = jest.fn()
const mockMutate = jest.fn()

const BASE_PROFILE = {
  birthDate: '1990-05-15',
  sex: 'male',
  heightCm: 178,
  weightKg: 82,
  bodyFatPercent: 18,
  tmb: 1822,
  age: 35,
}

const BASE_USER = {
  id: 'user-1',
  name: 'Carlos Souza',
  email: 'carlos@email.com',
  emailVerified: true,
  profile: BASE_PROFILE,
  currentGoal: null,
}

beforeEach(() => {
  jest.clearAllMocks()
  mockUseNavigation.useNavigation.mockReturnValue({ goBack: mockGoBack })
  mockUseCurrentUser.useCurrentUser.mockReturnValue({
    data: BASE_USER,
    isLoading: false,
    isError: false,
  })
  mockUseUpdateProfile.useUpdateProfile.mockReturnValue({
    mutate: mockMutate,
    isPending: false,
  })
})

describe('EditProfileScreen', () => {
  it('exibe formulário pré-preenchido com dados do perfil atual', () => {
    render(<EditProfileScreen />)

    expect(screen.getByTestId('input-birth-date').props.value).toBe('1990-05-15')
    expect(screen.getByTestId('input-height').props.value).toBe('178')
    expect(screen.getByTestId('input-weight').props.value).toBe('82')
    expect(screen.getByTestId('input-body-fat').props.value).toBe('18')
  })

  it('campo data de nascimento está visível e é editável (R3.3)', () => {
    render(<EditProfileScreen />)

    const birthInput = screen.getByTestId('input-birth-date')
    expect(birthInput).toBeTruthy()

    fireEvent.changeText(birthInput, '1985-12-01')

    expect(screen.getByTestId('input-birth-date').props.value).toBe('1985-12-01')
  })

  it('exibe preview da TMB em tempo real com dados válidos', () => {
    render(<EditProfileScreen />)

    expect(screen.getByTestId('tmb-preview')).toBeTruthy()
    // lean = 82 * (1 - 18/100) = 67.24 → TMB = 370 + 21.6 * 67.24 ≈ 1822
    expect(screen.getByText('1822 kcal/dia')).toBeTruthy()
  })

  it('preview da TMB atualiza quando o peso muda', () => {
    render(<EditProfileScreen />)

    fireEvent.changeText(screen.getByTestId('input-weight'), '90')

    // lean = 90 * 0.82 = 73.8 → TMB = 370 + 21.6 * 73.8 ≈ 1964
    expect(screen.getByText('1964 kcal/dia')).toBeTruthy()
  })

  it('preview da TMB não é exibido quando campos estão incompletos', () => {
    render(<EditProfileScreen />)

    fireEvent.changeText(screen.getByTestId('input-weight'), '')

    expect(screen.queryByTestId('tmb-preview')).toBeNull()
  })

  it('botão salvar não chama mutate quando peso está fora do range DR-10 (< 30 kg)', () => {
    render(<EditProfileScreen />)

    fireEvent.changeText(screen.getByTestId('input-weight'), '5')
    fireEvent.press(screen.getByTestId('save-btn'))

    expect(mockMutate).not.toHaveBeenCalled()
  })

  it('botão salvar não chama mutate quando altura está fora do range DR-10 (> 250 cm)', () => {
    render(<EditProfileScreen />)

    fireEvent.changeText(screen.getByTestId('input-height'), '300')
    fireEvent.press(screen.getByTestId('save-btn'))

    expect(mockMutate).not.toHaveBeenCalled()
  })

  it('botão salvar chama mutate quando todos os campos são válidos', () => {
    render(<EditProfileScreen />)

    fireEvent.press(screen.getByTestId('save-btn'))

    expect(mockMutate).toHaveBeenCalledTimes(1)
  })

  it('chama mutate com os dados corretos ao pressionar salvar', () => {
    render(<EditProfileScreen />)

    fireEvent.press(screen.getByTestId('save-btn'))

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        birthDate: '1990-05-15',
        sex: 'male',
        heightCm: 178,
        weightKg: 82,
        bodyFatPercent: 18,
      }),
      expect.any(Object),
    )
  })

  it('navega de volta após salvar com sucesso', () => {
    render(<EditProfileScreen />)

    fireEvent.press(screen.getByTestId('save-btn'))

    const [, callbacks] = mockMutate.mock.calls[0] as [
      unknown,
      { onSuccess: () => void },
    ]
    callbacks.onSuccess()

    expect(mockGoBack).toHaveBeenCalledTimes(1)
  })

  it('exibe Alert com mensagem de erro da API quando mutação falha', () => {
    const alertSpy = jest.spyOn(Alert, 'alert')
    render(<EditProfileScreen />)

    fireEvent.press(screen.getByTestId('save-btn'))

    const [, callbacks] = mockMutate.mock.calls[0] as [
      unknown,
      { onError: (err: unknown) => void },
    ]
    callbacks.onError({ response: { data: { error: 'Dados inválidos' } } })

    expect(alertSpy).toHaveBeenCalledWith('Erro', 'Dados inválidos')
  })

  it('exibe Alert com mensagem genérica quando erro não tem detalhes', () => {
    const alertSpy = jest.spyOn(Alert, 'alert')
    render(<EditProfileScreen />)

    fireEvent.press(screen.getByTestId('save-btn'))

    const [, callbacks] = mockMutate.mock.calls[0] as [
      unknown,
      { onError: (err: unknown) => void },
    ]
    callbacks.onError(new Error('network error'))

    expect(alertSpy).toHaveBeenCalledWith('Erro', 'Erro ao salvar dados. Tente novamente.')
  })

  it('não chama mutate enquanto mutação está pendente', () => {
    mockUseUpdateProfile.useUpdateProfile.mockReturnValue({
      mutate: mockMutate,
      isPending: true,
    })

    render(<EditProfileScreen />)

    fireEvent.press(screen.getByTestId('save-btn'))

    expect(mockMutate).not.toHaveBeenCalled()
  })

  it('alterna sexo e mantém formulário válido', () => {
    render(<EditProfileScreen />)

    fireEvent.press(screen.getByTestId('toggle-female'))
    fireEvent.press(screen.getByTestId('save-btn'))

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({ sex: 'female' }),
      expect.any(Object),
    )
  })
})
