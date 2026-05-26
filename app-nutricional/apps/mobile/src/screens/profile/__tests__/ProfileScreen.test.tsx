import React from 'react'
import { Alert } from 'react-native'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { ProfileScreen } from '../ProfileScreen'

jest.mock('../../../hooks/useCurrentUser')
jest.mock('../../../store/auth.store')

const mockUseCurrentUser = jest.requireMock('../../../hooks/useCurrentUser') as {
  useCurrentUser: jest.Mock
}
const mockUseAuthStore = jest.requireMock('../../../store/auth.store') as {
  useAuthStore: jest.Mock
}

const MOCK_LOGOUT = jest.fn()

const BASE_USER = {
  id: 'user-1',
  name: 'Ana Lima',
  email: 'ana@email.com',
  emailVerified: true,
  profile: {
    birthDate: '1995-03-10',
    sex: 'female',
    heightCm: 165,
    weightKg: 62,
    bodyFatPercent: 22,
    tmb: 1480,
    age: 30,
  },
  currentGoal: null,
}

beforeEach(() => {
  jest.clearAllMocks()
  mockUseAuthStore.useAuthStore.mockImplementation((selector: (s: { logout: jest.Mock }) => unknown) =>
    selector({ logout: MOCK_LOGOUT })
  )
})

describe('ProfileScreen', () => {
  it('renderiza dados do perfil corretamente', () => {
    mockUseCurrentUser.useCurrentUser.mockReturnValue({
      data: BASE_USER,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    })

    render(<ProfileScreen />)

    expect(screen.getByText('Ana Lima')).toBeTruthy()
    expect(screen.getByText('ana@email.com')).toBeTruthy()
    expect(screen.getByText('30 anos')).toBeTruthy()
    expect(screen.getByText('Feminino')).toBeTruthy()
    expect(screen.getByText('165 cm')).toBeTruthy()
    expect(screen.getByText('62 kg')).toBeTruthy()
    expect(screen.getByText('22%')).toBeTruthy()
    expect(screen.getByText('1480 kcal/dia')).toBeTruthy()
  })

  it('exibe idade calculada e não exibe a data de nascimento (R3.2 / DR-03)', () => {
    mockUseCurrentUser.useCurrentUser.mockReturnValue({
      data: BASE_USER,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    })

    render(<ProfileScreen />)

    // Idade deve aparecer
    expect(screen.getByText('30 anos')).toBeTruthy()
    // A data de nascimento não deve aparecer em nenhum formato
    expect(screen.queryByText('1995-03-10')).toBeNull()
    expect(screen.queryByText('10/03/1995')).toBeNull()
    expect(screen.queryByText('1995')).toBeNull()
  })

  it('exibe "—" quando bodyFatPercent é null', () => {
    const userWithNullFat = {
      ...BASE_USER,
      profile: { ...BASE_USER.profile, bodyFatPercent: null },
    }
    mockUseCurrentUser.useCurrentUser.mockReturnValue({
      data: userWithNullFat,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    })

    render(<ProfileScreen />)

    const row = screen.getByTestId('row-body-fat')
    expect(row).toBeTruthy()
    expect(screen.getByText('—')).toBeTruthy()
  })

  it('logout abre dialog de confirmação e dispara logout() ao confirmar', () => {
    mockUseCurrentUser.useCurrentUser.mockReturnValue({
      data: BASE_USER,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    })

    const alertSpy = jest.spyOn(Alert, 'alert')

    render(<ProfileScreen />)

    fireEvent.press(screen.getByTestId('logout-btn'))

    expect(alertSpy).toHaveBeenCalledWith(
      'Sair',
      'Deseja sair da sua conta?',
      expect.arrayContaining([
        expect.objectContaining({ text: 'Cancelar', style: 'cancel' }),
        expect.objectContaining({ text: 'Sair', style: 'destructive' }),
      ])
    )

    // Simula confirmação: chama o onPress do botão destrutivo
    const [, , buttons] = alertSpy.mock.calls[0] as [string, string, { text: string; onPress?: () => void }[]]
    const confirmBtn = buttons.find((b) => b.text === 'Sair')
    confirmBtn?.onPress?.()

    expect(MOCK_LOGOUT).toHaveBeenCalledTimes(1)
  })
})
