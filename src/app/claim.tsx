import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  requestCustomerClaimOtp,
  verifyCustomerClaimOtp,
} from '@/services/customerApi';
import { CustomerApiError } from '@/types/customerApi';
import { colors } from '@/theme/colors';

function getErrorMessage(error: unknown): string {
  if (error instanceof CustomerApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Si è verificato un errore imprevisto.';
}

export default function ClaimScreen() {
  const [customerCode, setCustomerCode] = useState('');
  const [otp, setOtp] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);

  const trimmedCode = customerCode.trim();
  const trimmedOtp = otp.trim();
  const isBusy = isRequesting || isVerifying;
  const canRequest = trimmedCode.length > 0 && !isBusy;
  const canVerify = trimmedCode.length > 0 && trimmedOtp.length > 0 && !isBusy;

  async function handleRequestOtp() {
    setIsRequesting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const result = await requestCustomerClaimOtp({ customer_code: trimmedCode });
      setOtpSent(true);
      setSuccessMessage(
        result.delivery?.status === 'skipped'
          ? 'Codice generato. Inserisci il codice OTP ricevuto.'
          : 'Codice inviato via WhatsApp al numero in anagrafica.',
      );
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsRequesting(false);
    }
  }

  async function handleVerifyOtp() {
    setIsVerifying(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await verifyCustomerClaimOtp({
        customer_code: trimmedCode,
        otp: trimmedOtp,
      });
      setSuccessMessage('Profilo collegato con successo.');
      setTimeout(() => router.replace('/'), 1200);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsVerifying(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}>
        <View style={styles.content}>
          <Text style={styles.title}>Collega il tuo profilo</Text>
          <Text style={styles.subtitle}>
            Inserisci il codice cliente che ti è stato comunicato dal salone. Riceverai un codice OTP
            via WhatsApp per confermare il collegamento.
          </Text>

          <View style={styles.card}>
            <View style={styles.field}>
              <Text style={styles.label}>Codice cliente</Text>
              <TextInput
                autoCapitalize="characters"
                autoCorrect={false}
                placeholder="Es. SC-12345"
                placeholderTextColor={colors.muted}
                style={styles.input}
                value={customerCode}
                onChangeText={setCustomerCode}
                editable={!isBusy}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Codice OTP</Text>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="number-pad"
                maxLength={8}
                placeholder="Codice a 4-8 cifre"
                placeholderTextColor={colors.muted}
                style={styles.input}
                value={otp}
                onChangeText={setOtp}
                editable={!isBusy}
              />
            </View>

            {errorMessage ? (
              <View style={styles.errorCard}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {successMessage ? (
              <View style={styles.successCard}>
                <Text style={styles.successText}>{successMessage}</Text>
              </View>
            ) : null}

            <Pressable
              style={({ pressed }) => [
                styles.button,
                (!canRequest || pressed) && styles.buttonPressed,
                !canRequest && styles.buttonDisabled,
              ]}
              onPress={handleRequestOtp}
              disabled={!canRequest}>
              {isRequesting ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <Text style={styles.buttonText}>Invia codice</Text>
              )}
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.secondaryButton,
                (!canVerify || pressed) && styles.buttonPressed,
                !canVerify && styles.buttonDisabled,
              ]}
              onPress={handleVerifyOtp}
              disabled={!canVerify}>
              {isVerifying ? (
                <ActivityIndicator color={colors.text} />
              ) : (
                <Text style={styles.secondaryButtonText}>Verifica</Text>
              )}
            </Pressable>

            {otpSent ? (
              <Text style={styles.hint}>
                Non hai ricevuto il codice? Verifica il numero in anagrafica e riprova tra qualche
                minuto.
              </Text>
            ) : null}
          </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    gap: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
    color: colors.text,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.muted,
    marginBottom: 16,
  },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 24,
    gap: 16,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.muted,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
  },
  button: {
    backgroundColor: colors.gold,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  errorCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#8b3a3a',
    borderRadius: 12,
    padding: 12,
  },
  errorText: {
    color: '#f5a5a5',
    fontSize: 14,
  },
  successCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: 12,
    padding: 12,
  },
  successText: {
    color: colors.text,
    fontSize: 14,
  },
  hint: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.muted,
  },
});
