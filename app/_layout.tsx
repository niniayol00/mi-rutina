import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { theme } from '../src/constants/theme';
import OnboardingScreen from '../src/components/OnboardingScreen';
import { needsOnboarding, completeOnboarding } from '../src/utils/storage';

export default function RootLayout() {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    needsOnboarding().then(setShowOnboarding);
  }, []);

  const handleComplete = async (name: string) => {
    await completeOnboarding(name);
    setShowOnboarding(false);
  };

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
      {showOnboarding && <OnboardingScreen onComplete={handleComplete} />}
    </View>
  );
}
