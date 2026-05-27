import React from 'react'
import { ActivityIndicator, View, Text } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '../store/auth.store'
import { LoginScreen } from '../screens/auth/LoginScreen'
import { RegisterScreen } from '../screens/auth/RegisterScreen'
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen'
import { OnboardingScreen } from '../screens/auth/OnboardingScreen'
import { DailyLogScreen } from '../screens/home/DailyLogScreen'
import { FoodSearchScreen } from '../screens/home/FoodSearchScreen'
import { FoodDetailScreen } from '../screens/home/FoodDetailScreen'
import { DailyReportScreen } from '../screens/report/DailyReportScreen'
import { ProfileScreen } from '../screens/profile/ProfileScreen'
import { EditProfileScreen } from '../screens/profile/EditProfileScreen'
import { colors } from '../theme/colors'
import { typography } from '../theme/typography'
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
  EditProfile: undefined
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


function TabNavigator() {
  return (
    <AppTab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.ink3,
        tabBarStyle: { backgroundColor: colors.white, borderTopColor: colors.gray1 },
      }}
    >
      <AppTab.Screen
        name="Home"
        component={DailyLogScreen}
        options={{
          title: 'Início',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <AppTab.Screen
        name="Report"
        component={DailyReportScreen}
        options={{
          title: 'Relatório',
          tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart-outline" size={size} color={color} />,
        }}
      />
      <AppTab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
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
            options={{
              presentation: 'modal',
              headerShown: true,
              title: 'Buscar alimento',
              headerTintColor: colors.accent,
              headerStyle: { backgroundColor: colors.paper },
            }}
          />
          <AppStack.Screen
            name="FoodDetail"
            component={FoodDetailScreen}
            options={{
              presentation: 'modal',
              headerShown: true,
              title: 'Adicionar alimento',
              headerTintColor: colors.accent,
              headerStyle: { backgroundColor: colors.paper },
            }}
          />
          <AppStack.Screen
            name="EditProfile"
            component={EditProfileScreen}
            options={{
              presentation: 'modal',
              headerShown: true,
              title: 'Editar perfil',
              headerTintColor: colors.accent,
              headerStyle: { backgroundColor: colors.paper },
            }}
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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.paper }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    )
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  )
}
