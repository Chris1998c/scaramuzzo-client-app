import { router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/ui/AppHeader';
import { GlassCard } from '@/components/ui/GlassCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { GlassErrorBanner } from '@/components/ui/GlassErrorBanner';
import { getApiErrorMessage } from '@/lib/apiErrorMessage';
import { supabase } from '@/lib/supabase';
import { colors } from '@/theme/colors';
import { inputStyle, screenPadding } from '@/theme/glass';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !isLoading;

  async function handleSignIn() {
    setIsLoading(true);
    setErrorMessage(null);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setIsLoading(false);

    if (error) {
      setErrorMessage(getApiErrorMessage(error));
      return;
    }

    router.replace('/');
  }

  async function handleSignUp() {
    setIsLoading(true);
    setErrorMessage(null);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    setIsLoading(false);

    if (error) {
      setErrorMessage(getApiErrorMessage(error));
      return;
    }

    if (data.session) {
      router.replace('/');
      return;
    }

    setErrorMessage('Registrazione completata. Controlla la tua email per confermare l\'account.');
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}>
        <AppHeader title="Accedi" subtitle="Usa la tua email per accedere o registrarti" />

        <View style={styles.body}>
          <GlassCard>
            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                keyboardType="email-address"
                placeholder="nome@email.com"
                placeholderTextColor={colors.muted}
                style={inputStyle}
                value={email}
                onChangeText={setEmail}
                editable={!isLoading}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                autoCapitalize="none"
                autoComplete="password"
                placeholder="••••••••"
                placeholderTextColor={colors.muted}
                secureTextEntry
                style={inputStyle}
                value={password}
                onChangeText={setPassword}
                editable={!isLoading}
              />
            </View>

            {errorMessage ? <GlassErrorBanner message={errorMessage} /> : null}

            <PrimaryButton
              label="Accedi"
              onPress={handleSignIn}
              disabled={!canSubmit}
              loading={isLoading}
            />
            <PrimaryButton
              label="Registrati"
              variant="secondary"
              onPress={handleSignUp}
              disabled={!canSubmit}
            />
          </GlassCard>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  body: {
    paddingHorizontal: screenPadding,
    paddingBottom: 32,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.muted,
  },
  errorBanner: {
    backgroundColor: 'rgba(139, 58, 58, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(245, 165, 165, 0.35)',
    borderRadius: 16,
    padding: 14,
  },
  errorText: {
    color: '#f5c4c4',
    fontSize: 14,
  },
});
