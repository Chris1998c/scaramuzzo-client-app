import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/ui/AppHeader';
import { GlassCard } from '@/components/ui/GlassCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { getApiErrorMessage } from '@/lib/apiErrorMessage';
import { buildBookingPayloadFingerprint } from '@/lib/bookingIdempotency';
import { createBooking, fetchServices, generateIdempotencyKey } from '@/services/customerApi';
import { GlassErrorBanner } from '@/components/ui/GlassErrorBanner';
import { inputStyle, screenPadding } from '@/theme/glass';
import { useBookingStore } from '@/store/bookingStore';
import { CustomerApiError } from '@/types/customerApi';
import { colors } from '@/theme/colors';

function getSubmitErrorMessage(error: unknown): string {
  if (error instanceof CustomerApiError) {
    if (error.status === 409) {
      return 'Questo orario non è più disponibile. Torna agli orari e scegline un altro.';
    }

    if (error.status === 403) {
      return 'Prima collega il tuo profilo cliente.';
    }
  }

  return getApiErrorMessage(error);
}

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  if (remainder === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainder} min`;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
  }).format(price);
}

function formatDateTime(iso: string): string {
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!match) {
    return iso;
  }

  const [, year, month, day, hour, minute] = match;
  return `${day}/${month}/${year} · ${hour}:${minute}`;
}

export default function BookConfirmScreen() {
  const selectedSalonId = useBookingStore((state) => state.selectedSalonId);
  const selectedSalonName = useBookingStore((state) => state.selectedSalonName);
  const selectedServiceIds = useBookingStore((state) => state.selectedServiceIds);
  const selectedStaffId = useBookingStore((state) => state.selectedStaffId);
  const selectedStaffName = useBookingStore((state) => state.selectedStaffName);
  const selectedSlot = useBookingStore((state) => state.selectedSlot);
  const notes = useBookingStore((state) => state.notes);
  const lastCreatedBooking = useBookingStore((state) => state.lastCreatedBooking);
  const setNotes = useBookingStore((state) => state.setNotes);
  const setLastCreatedBooking = useBookingStore((state) => state.setLastCreatedBooking);
  const resetBooking = useBookingStore((state) => state.resetBooking);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const idempotencyKeyRef = useRef<string | null>(null);
  const idempotencyFingerprintRef = useRef<string | null>(null);

  const isBookingComplete = Boolean(lastCreatedBooking);

  const bookingPayloadFingerprint = useMemo(
    () =>
      buildBookingPayloadFingerprint({
        salonId: selectedSalonId,
        serviceIds: selectedServiceIds,
        staffId: selectedStaffId,
        startTime: selectedSlot?.start_time,
        notes,
      }),
    [
      selectedSalonId,
      selectedServiceIds,
      selectedStaffId,
      selectedSlot?.start_time,
      notes,
    ],
  );

  useEffect(() => {
    if (isBookingComplete) {
      return;
    }

    if (idempotencyFingerprintRef.current === bookingPayloadFingerprint) {
      return;
    }

    idempotencyFingerprintRef.current = bookingPayloadFingerprint;
    idempotencyKeyRef.current = generateIdempotencyKey();
  }, [bookingPayloadFingerprint, isBookingComplete]);

  function clearIdempotencyKey() {
    idempotencyKeyRef.current = null;
    idempotencyFingerprintRef.current = null;
  }

  function getSubmitIdempotencyKey(): string {
    if (
      idempotencyKeyRef.current &&
      idempotencyFingerprintRef.current === bookingPayloadFingerprint
    ) {
      return idempotencyKeyRef.current;
    }

    const key = generateIdempotencyKey();
    idempotencyKeyRef.current = key;
    idempotencyFingerprintRef.current = bookingPayloadFingerprint;
    return key;
  }

  useEffect(() => {
    if (isBookingComplete) {
      return;
    }

    if (
      !selectedSalonId ||
      selectedServiceIds.length === 0 ||
      !selectedStaffId ||
      !selectedSlot
    ) {
      router.replace('/book');
    }
  }, [
    isBookingComplete,
    selectedSalonId,
    selectedServiceIds.length,
    selectedStaffId,
    selectedSlot,
  ]);

  const { data: services } = useQuery({
    queryKey: ['customer', 'services', selectedSalonId],
    queryFn: () => fetchServices(selectedSalonId!),
    enabled: selectedSalonId !== null && !isBookingComplete,
  });

  const selectedServices = useMemo(() => {
    if (!services?.length) {
      return [];
    }

    return services.filter((service) =>
      selectedServiceIds.some((id) => String(id) === String(service.id)),
    );
  }, [services, selectedServiceIds]);

  const totalDuration = selectedServices.reduce((sum, service) => sum + service.duration, 0);
  const totalPrice = selectedServices.reduce((sum, service) => sum + service.price, 0);

  async function handleConfirm() {
    if (isSubmitting) {
      return;
    }

    if (!selectedSalonId || !selectedStaffId || !selectedSlot || selectedServiceIds.length === 0) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const idempotencyKey = getSubmitIdempotencyKey();

    try {
      const booking = await createBooking(
        {
          salon_id: Number(selectedSalonId),
          service_ids: selectedServiceIds.map((id) => Number(id)),
          staff_id: Number(selectedStaffId),
          start_time: selectedSlot.start_time,
          notes: notes.trim() || undefined,
        },
        idempotencyKey,
      );

      clearIdempotencyKey();
      setLastCreatedBooking(booking);
    } catch (error) {
      setSubmitError(getSubmitErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleGoHome() {
    clearIdempotencyKey();
    resetBooking();
    router.replace('/');
  }

  if (
    !isBookingComplete &&
    (!selectedSalonId || selectedServiceIds.length === 0 || !selectedStaffId || !selectedSlot)
  ) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.gold} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (isBookingComplete && lastCreatedBooking) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader title="Prenotazione confermata" subtitle="Tutto pronto per il tuo appuntamento" />
        <View style={styles.successContent}>
          <GlassCard>
            <Text style={styles.successText}>
              La tua prenotazione è stata registrata con successo.
            </Text>
            <Text style={styles.bookingId}>ID prenotazione: {lastCreatedBooking.id}</Text>
            <Text style={styles.bookingMeta}>
              {formatDateTime(lastCreatedBooking.start_time)}
            </Text>
            <PrimaryButton label="Torna alla home" onPress={handleGoHome} />
          </GlassCard>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader
        title="Conferma prenotazione"
        subtitle="Controlla i dettagli prima di confermare"
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <GlassCard contentStyle={styles.cardInner}>
          <View style={styles.row}>
            <Text style={styles.label}>Salone</Text>
            <Text style={styles.value}>{selectedSalonName}</Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.label}>Servizi</Text>
          {selectedServices.map((service) => (
            <View key={service.id} style={styles.serviceRow}>
              <Text style={styles.serviceName}>{service.name}</Text>
              <Text style={styles.serviceMeta}>
                {formatDuration(service.duration)} · {formatPrice(service.price)}
              </Text>
            </View>
          ))}

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>Collaboratore</Text>
            <Text style={styles.value}>{selectedStaffName}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Data e ora</Text>
            <Text style={styles.value}>
              {selectedSlot ? formatDateTime(selectedSlot.start_time) : '—'}
            </Text>
          </View>

          {selectedServices.length > 0 ? (
            <>
              <View style={styles.divider} />
              <View style={styles.row}>
                <Text style={styles.label}>Durata totale</Text>
                <Text style={styles.value}>{formatDuration(totalDuration)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Prezzo totale</Text>
                <Text style={styles.valueHighlight}>{formatPrice(totalPrice)}</Text>
              </View>
            </>
          ) : null}
        </GlassCard>

        <View style={styles.field}>
          <Text style={styles.label}>Note (opzionale)</Text>
          <TextInput
            multiline
            numberOfLines={3}
            placeholder="Aggiungi una nota per il salone..."
            placeholderTextColor={colors.muted}
            style={[inputStyle, styles.notesInput]}
            value={notes}
            onChangeText={setNotes}
            editable={!isSubmitting}
          />
        </View>

        {submitError ? (
          <View style={styles.errorBlock}>
            <GlassErrorBanner message={submitError} />
            {submitError.includes('orario non è più disponibile') ? (
              <Pressable
                style={({ pressed }) => [styles.linkButton, pressed && styles.buttonPressed]}
                onPress={() => router.push('/book-step-2')}>
                <Text style={styles.linkButtonText}>Torna agli orari</Text>
              </Pressable>
            ) : null}
            {submitError.includes('profilo cliente') ? (
              <Pressable
                style={({ pressed }) => [styles.linkButton, pressed && styles.buttonPressed]}
                onPress={() => router.push('/claim')}>
                <Text style={styles.linkButtonText}>Collega profilo</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          label="Conferma prenotazione"
          onPress={handleConfirm}
          disabled={isSubmitting}
          loading={isSubmitting}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successContent: {
    flex: 1,
    paddingHorizontal: screenPadding,
    paddingTop: 48,
    gap: 24,
  },
  scrollContent: {
    paddingHorizontal: screenPadding,
    paddingBottom: 24,
    gap: 20,
  },
  cardInner: {
    gap: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
    color: colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: colors.muted,
  },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  label: {
    fontSize: 14,
    color: colors.muted,
    flex: 1,
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    flex: 1,
    textAlign: 'right',
  },
  valueHighlight: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gold,
    flex: 1,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  serviceRow: {
    gap: 2,
    paddingLeft: 4,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
  },
  serviceMeta: {
    fontSize: 13,
    color: colors.muted,
  },
  field: {
    gap: 8,
  },
  notesInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
    minHeight: 96,
    textAlignVertical: 'top',
  },
  errorBlock: {
    gap: 12,
  },
  errorCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: '#8b3a3a',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  errorText: {
    color: '#f5a5a5',
    fontSize: 14,
  },
  linkButton: {
    alignSelf: 'flex-start',
  },
  linkButtonText: {
    color: colors.gold,
    fontSize: 14,
    fontWeight: '600',
  },
  successCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: 16,
    padding: 24,
    gap: 12,
  },
  successText: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
  },
  bookingId: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gold,
  },
  bookingMeta: {
    fontSize: 14,
    color: colors.muted,
  },
  footer: {
    paddingHorizontal: screenPadding,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  button: {
    backgroundColor: colors.gold,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
});
