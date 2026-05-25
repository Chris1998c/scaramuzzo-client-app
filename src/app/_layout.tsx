import { Stack } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { LogoIntroOverlay } from '@/components/ui/LogoIntroOverlay';
import { hasIntroPlayed, markIntroPlayed } from '@/lib/appIntroSession';
import { AppProviders } from '@/providers/AppProviders';
import { colors } from '@/theme/colors';

function RootNavigator() {
  const [introComplete, setIntroComplete] = useState(hasIntroPlayed());
  const showIntro = !introComplete;

  const handleIntroComplete = useCallback(() => {
    markIntroPlayed();
    setIntroComplete(true);
  }, []);

  return (
    <View style={styles.root}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
      {showIntro ? <LogoIntroOverlay onComplete={handleIntroComplete} /> : null}
      <StatusBar style="light" />
    </View>
  );
}

export default function RootLayout() {
  return (
    <AppProviders>
      <RootNavigator />
    </AppProviders>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
