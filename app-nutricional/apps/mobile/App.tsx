import 'expo/build/Expo.fx'
import { registerRootComponent } from 'expo'
import { useFonts } from 'expo-font'
import {
  Newsreader_400Regular,
  Newsreader_700Bold,
} from '@expo-google-fonts/newsreader'
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans'
import React, { useEffect } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from './src/store/auth.store'
import { RootNavigator } from './src/navigation'
import { colors } from './src/theme/colors'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 1000 * 60 * 5 },
  },
})

function App() {
  const initialize = useAuthStore((s) => s.initialize)

  const [fontsLoaded] = useFonts({
    Newsreader_400Regular,
    Newsreader_700Bold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  })

  useEffect(() => {
    initialize()
  }, [initialize])

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.paper }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <RootNavigator />
    </QueryClientProvider>
  )
}

registerRootComponent(App)
