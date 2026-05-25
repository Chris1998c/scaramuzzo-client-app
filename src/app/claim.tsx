import { useQueryClient } from '@tanstack/react-query';
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
import { profileLinkQueryKey } from '@/lib/queryKeys';
import {
  requestCustomerClaimOtpByPhone,
  verifyCustomerClaimOtpByPhone,
} from '@/services/customerApi';
import { CustomerApiError, type CustomerClaimErrorBody } from '@/types/customerApi';
import { colors } from '@/theme/colors';
import { inputStyle, screenPadding } from '@/theme/glass';

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
      return 'La sessione è scaduta. Esci e accedi di nuovo, poi riprova.';
    }

    if (error.status === 404) {
      return 'Non abbiamo trovato un profilo con questo numero. Controlla le cifre o chiedi al salone.';
    }

    if (error.status === 409 && getClaimErrorCode(error) === 'phone_ambiguous') {
      return 'Abbiamo trovato più profili con questo numero. Contatta il salone per assistenza.';
    }

    if (error.status === 400) {
      return 'Il codice non è valido o è scaduto. Richiedine uno nuovo.';
    }

    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Qualcosa non ha funzionato. Riprova tra poco.';
}

type ClaimStep = 1 | 2;

function ClaimStepIndicator({ step }: { step: ClaimStep }) {
  return (
    <View style={stepStyles.row}>
      <View style={stepStyles.item}>
        <View style={[stepStyles.dot, step >= 1 && stepStyles.dotActive]}>
          <Text style={[stepStyles.dotText, step >= 1 && stepStyles.dotTextActive]}>1</Text>
        </View>
        <Text style={[stepStyles.label, step === 1 && stepStyles.labelActive]}>Telefono</Text>
      </View>
      <View style={stepStyles.line} />
      <View style={stepStyles.item}>
        <View style={[stepStyles.dot, step >= 2 && stepStyles.dotActive]}>
          <Text style={[stepStyles.dotText, step >= 2 && stepStyles.dotTextActive]}>2</Text>
        </View>
        <Text style={[stepStyles.label, step === 2 && stepStyles.labelActive]}>Codice OTP</Text>
      </View>
    </View>
  );
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
  const currentStep: ClaimStep = otpSent ? 2 : 1;

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
          ? 'Codice pronto. Inseriscilo qui sotto.'
          : 'Ti abbiamo inviato un codice su WhatsApp.',
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
      setSuccessMessage('Profilo collegato. Ti portiamo alla home…');
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
        <AppHeader
          title="Collega il tuo profilo Scaramuzzo"
          subtitle="Inserisci il numero associato alla tua scheda cliente."
        />

        <View style={styles.body}>
          <ClaimStepIndicator step={currentStep} />

          <GlassCard>
            <View style={styles.field}>
              <Text style={styles.label}>Numero di telefono</Text>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="phone-pad"
                placeholder="Es. 3895817411"
                placeholderTextColor={colors.muted}
                style={inputStyle}
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
                placeholder="Codice ricevuto su WhatsApp"
                placeholderTextColor={colors.muted}
                style={[inputStyle, !otpSent && styles.inputDisabled]}
                value={otp}
                onChangeText={setOtp}
                editable={!isBusy && otpSent}
              />
            </View>

            {errorMessage ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {successMessage ? (
              <View style={styles.successBanner}>
                <Text style={styles.successText}>{successMessage}</Text>
              </View>
            ) : null}

            {!otpSent ? (
              <PrimaryButton
                label="Invia codice WhatsApp"
                onPress={handleRequestOtp}
                disabled={!canRequest}
                loading={isRequesting}
              />
            ) : (
              <PrimaryButton
                label="Verifica e collega profilo"
                onPress={handleVerifyOtp}
                disabled={!canVerify}
                loading={isVerifying}
              />
            )}

            {otpSent ? (
              <>
                <PrimaryButton
                  label="Invia di nuovo il codice"
                  variant="secondary"
                  onPress={handleRequestOtp}
                  disabled={!canRequest}
                  loading={isRequesting}
                />
                <Text style={styles.hint}>
                  Non arriva il messaggio? Controlla il numero e attendi qualche minuto prima di
                  richiedere un nuovo codice.
                </Text>
              </>
            ) : null}
          </GlassCard>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const stepStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    paddingHorizontal: screenPadding,
  },
  item: {
    alignItems: 'center',
    gap: 6,
    minWidth: 88,
  },
  dot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(27, 13, 8, 0.6)',
  },
  dotActive: {
    borderColor: colors.gold,
    backgroundColor: 'rgba(197, 165, 114, 0.2)',
  },
  dotText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.muted,
  },
  dotTextActive: {
    color: colors.gold,
  },
  label: {
    fontSize: 12,
    color: colors.muted,
  },
  labelActive: {
    color: colors.text,
    fontWeight: '600',
  },
  line: {
    width: 40,
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: 8,
    marginBottom: 20,
  },
});

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
  inputDisabled: {
    opacity: 0.5,
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
    lineHeight: 20,
  },
  successBanner: {
    backgroundColor: 'rgba(197, 165, 114, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(197, 165, 114, 0.4)',
    borderRadius: 16,
    padding: 14,
  },
  successText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  hint: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.muted,
    textAlign: 'center',
  },
});
