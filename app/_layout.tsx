import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerTintColor: '#FFFFFF',
          headerStyle: { backgroundColor: '#2C6E49' },
          headerTitleStyle: { fontWeight: '600' },
        }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="food-finder" options={{ title: 'Food Finder', headerShown: true }} />
        <Stack.Screen name="classifieds" options={{ title: 'Classifieds', headerShown: true }} />
        <Stack.Screen name="members" options={{ title: 'Members', headerShown: true }} />
        <Stack.Screen name="my-dogs/index" options={{ title: 'My Dogs', headerShown: true }} />
        <Stack.Screen name="my-dogs/new" options={{ title: 'Add Dog', headerShown: true }} />
        <Stack.Screen name="my-dogs/[id]" options={{ title: 'Dog Details', headerShown: true }} />
        <Stack.Screen name="my-dogs/[id]/edit" options={{ title: 'Edit Dog', headerShown: true }} />
        <Stack.Screen
          name="modal"
          options={{ presentation: 'modal', title: 'Modal', headerShown: true }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
