import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';

import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { DataProvider } from '@/contexts/DataContext';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { setupNotificationChannel } from '@/utils/notifications';
import { ImportTripModal } from '@/components/ImportTripModal';
import { Brand, Colors } from '@/constants/theme';

const VehicloDark = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Brand.primary,
    background: '#0A0E17',
    card: '#131A2A',
    text: '#F1F5F9',
    border: '#1E293B',
    notification: Brand.danger,
  },
};

const VehicloLight = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Brand.primary,
    background: '#F8F9FA',
    card: '#FFFFFF',
    text: '#1A1A2E',
    border: '#E5E7EB',
    notification: Brand.danger,
  },
};

/** Inner layout that uses auth + theme contexts */
function RootLayoutNav() {
  const { status } = useAuth();
  const { isDark } = useTheme();
  const router = useRouter();
  const segments = useSegments();

  // Set up notification channel on mount
  useEffect(() => {
    setupNotificationChannel();
  }, []);

  // Redirect based on auth state
  useEffect(() => {
    if (status === 'loading') return;

    const inAuthScreen = segments[0] === 'welcome';

    if (status === 'unauthenticated' && !inAuthScreen) {
      router.replace('/welcome');
    } else if (status === 'authenticated' && inAuthScreen) {
      router.replace('/(tabs)');
    }
  }, [status, segments]);

  // Show loading spinner while checking auth
  if (status === 'loading') {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: Colors.dark.background,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator size="large" color={Brand.primary} />
      </View>
    );
  }

  return (
    <NavThemeProvider value={isDark ? VehicloDark : VehicloLight}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="welcome" options={{ animation: 'fade' }} />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="modals/add-vehicle"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="modals/add-fuel"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="modals/add-trip"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="modals/add-maintenance"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="modals/add-expense"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="modals/solo-driver"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="modals/trip-comparison"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="modals/documents"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="modals/voice-logger"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
      </Stack>
      <ImportTripModal />
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </NavThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SettingsProvider>
          <DataProvider>
            <RootLayoutNav />
          </DataProvider>
        </SettingsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
