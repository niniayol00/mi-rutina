import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { theme } from '../src/constants/theme';

export default function RootLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: theme.backgroundColor }}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.backgroundColor },
          headerTintColor: theme.textColor,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: theme.backgroundColor },
          headerShown: false,
        }}
      />
    </View>
  );
}
