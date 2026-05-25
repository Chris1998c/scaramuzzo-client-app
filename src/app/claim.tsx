import { useQueryClient } from '@tanstack/react-query';
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

import { profileLinkQueryKey } from '@/lib/queryKeys';
import {
  requestCustomerClaimOtpByPhone,
  verifyCustomerClaimOtpByPhone,
} from '@/services/customerApi';
import { CustomerApiError, type CustomerClaimErrorBody } from '@/types/customerApi';
import { colors } from '@/theme/colors';

function getClaimErrorCode(error: CustomerApiError): string | undefined {
  const body = error.body;

  if (typeof body === 'object' && body !== null && 'code' in body) {
    const code = (body as CustomerClaimErrorBody).code;
    return code ? String(code) : undefined;
  }

  return undefined;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof CustomerApiError) {
    if (error.message.includes('protezione Vercel') || error.message.includes('non è raggiungibile')) {
      return error.message;
    }

    if (error.status === 401) {
      return 'Sessione scaduta. Esci e accedi di nuovo.';
    }

    if (error.status === 404) {
      return 'Non abbiamo trovato un profilo associato a questo numero.';
    }

    if (error.status === 409 && getClaimErrorCode(error) === 'phone_ambiguous') {
      return 'Abbiamo trovato più profili con questo numero. Contatta il salone.';
    }

    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Si è verificato un errore imprevisto.';
}

export default function ClaimScreen() {
  const [phone, setPhone] = useState('');
  const [claimPhone, setClaimPhone] = useState<string | null>(null);
  const [otp, setOtp] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const queryClient = useQueryClient();

  const trimmedPhone = phone.trim();
  const trimmedOtp = otp.trim();
  const isBusy = isRequesting || isVerifying;
  const canRequest = trimmedPhone.length > 0 && !isBusy;
  const canVerify = Boolean(claimPhone) && trimmedOtp.length > 0 && !isBusy;

  function handlePhoneChange(value: string) {
    setPhone(value);
    setClaimPhone(null);
    setOtpSent(false);
    setOtp('');
  }

  async function handleRequestOtp() {
    setIsRequesting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setClaimPhone(null);
    setOtp('');

    try {
      const result = await requestCustomerClaimOtpByPhone({ phone: trimmedPhone });
      setClaimPhone(trimmedPhone);
      setOtpSent(true);

      setSuccessMessage(
        result.delivery?.status === 'skipped'
          ? 'Codice generato. Inserisci il codice OTP ricevuto.'
          : 'Codice inviato via WhatsApp.',
      );
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
      setOtpSent(false);
    } finally {
      setIsRequesting(false);
    }
  }

  async function handleVerifyOtp() {
    if (!claimPhone) {
      return;
    }

    setIsVerifying(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await verifyCustomerClaimOtpByPhone({
        phone: claimPhone,
        otp: trimmedOtp,
      });
      await queryClient.invalidateQueries({ queryKey: profileLinkQueryKey });
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
            Inserisci il numero di telefono associato alla tua scheda cliente.
          </Text>

          <View style={styles.card}>
            <View style={styles.field}>
              <Text style={styles.label}>Numero di telefono</Text>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="phone-pad"
                placeholder="Es. 3895817411"
                placeholderTextColor={colors.muted}
                style={styles.input}
                value={phone}
                onChangeText={handlePhoneChange}
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
                editable={!isBusy && otpSent}
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
                Non hai ricevuto il codice? Verifica il numero e riprova tra qualche minuto.
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
