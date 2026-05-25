import React from 'react'
import { ActivityIndicator, View, Text } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { useAuthStore } from '../store/auth.store'
import { LoginScreen } from '../screens/auth/LoginScreen'
import { RegisterScreen } from '../screens/auth/RegisterScreen'
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen'
import { OnboardingScreen } from '../screens/auth/OnboardingScreen'
import { DailyLogScreen } from '../screens/home/DailyLogScreen'
import { FoodSearchScreen } from '../screens/home/FoodSearchScreen'
import { FoodDetailScreen } from '../screens/home/FoodDetailScreen'
import type { MealType, FoodDto } from '@nutri-ia/shared'

export type AuthStackParamList = {
  Login: undefined
  Register: undefined
  ForgotPassword: undefined
}

export type AppStackParamList = {
  Onboarding: undefined
  MainTabs: undefined
  FoodSearch: { mealType: MealType; date: string }
  FoodDetail: { food: FoodDto; mealType: MealType; date: string }
}

export type AppTabParamList = {
  Home: undefined
  Report: undefined
  Profile: undefined
}

const AuthStack = createNativeStackNavigator<AuthStackParamList>()
const AppStack = createNativeStackNavigator<AppStackParamList>()
const AppTab = createBottomTabNavigator<AppTabParamList>()

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  )
}

function ReportPlaceholder() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 16, color: '#888' }}>Relatório — Em breve</Text>
    </View>
  )
}

function ProfilePlaceholder() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 16, color: '#888' }}>Perfil — Em breve</Text>
    </View>
  )
}

function TabNavigator() {
  return (
    <AppTab.Navigator screenOptions={{ headerShown: false }}>
      <AppTab.Screen name="Home" component={DailyLogScreen} options={{ title: 'Início' }} />
      <AppTab.Screen name="Report" component={ReportPlaceholder} options={{ title: 'Relatório' }} />
      <AppTab.Screen name="Profile" component={ProfilePlaceholder} options={{ title: 'Perfil' }} />
    </AppTab.Navigator>
  )
}

function AppNavigator() {
  const needsOnboarding = useAuthStore((s) => s.needsOnboarding)
  return (
    <AppStack.Navigator screenOptions={{ headerShown: false }}>
      {needsOnboarding ? (
        <AppStack.Screen name="Onboarding" component={OnboardingScreen} />
      ) : (
        <>
          <AppStack.Screen name="MainTabs" component={TabNavigator} />
          <AppStack.Screen
            name="FoodSearch"
            component={FoodSearchScreen}
            options={{ presentation: 'modal', headerShown: true, title: 'Buscar alimento' }}
          />
          <AppStack.Screen
            name="FoodDetail"
            component={FoodDetailScreen}
            options={{ presentation: 'modal', headerShown: true, title: 'Adicionar alimento' }}
          />
        </>
      )}
    </AppStack.Navigator>
  )
}

export function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    )
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  )
}
