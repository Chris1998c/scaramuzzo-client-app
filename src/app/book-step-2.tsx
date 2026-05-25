import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/ui/AppHeader';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { getApiErrorMessage } from '@/lib/apiErrorMessage';
import { fetchAvailability, fetchStaff } from '@/services/customerApi';
import { GlassErrorBanner } from '@/components/ui/GlassErrorBanner';
import { screenPadding } from '@/theme/glass';
import { useBookingStore } from '@/store/bookingStore';
import { CustomerApiError, type CustomerAvailabilitySlot } from '@/types/customerApi';
import { colors } from '@/theme/colors';

function getStep2ErrorMessage(error: unknown): string {
  if (error instanceof CustomerApiError && error.status === 403) {
    return 'Prima collega il tuo profilo cliente.';
  }

  return getApiErrorMessage(error);
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDateOptions(count: number): { iso: string; label: string }[] {
  const quickLabels = ['Oggi', 'Domani', 'Dopodomani'];

  return Array.from({ length: count }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + index);

    const iso = toIsoDate(date);
    const label =
      quickLabels[index] ??
      new Intl.DateTimeFormat('it-IT', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      }).format(date);

    return { iso, label };
  });
}

function formatSlotTime(iso: string): string {
  const match = iso.match(/T(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : iso;
}

function isSameSlot(a: CustomerAvailabilitySlot, b: CustomerAvailabilitySlot): boolean {
  return a.start_time === b.start_time && a.staff_id === b.staff_id;
}

export default function BookStep2Screen() {
  const selectedSalonId = useBookingStore((state) => state.selectedSalonId);
  const selectedSalonName = useBookingStore((state) => state.selectedSalonName);
  const selectedServiceIds = useBookingStore((state) => state.selectedServiceIds);
  const selectedStaffId = useBookingStore((state) => state.selectedStaffId);
  const selectedDate = useBookingStore((state) => state.selectedDate);
  const selectedSlot = useBookingStore((state) => state.selectedSlot);
  const setStaff = useBookingStore((state) => state.setStaff);
  const setDate = useBookingStore((state) => state.setDate);
  const setSlot = useBookingStore((state) => state.setSlot);

  const dateOptions = getDateOptions(7);
  const primaryServiceId = selectedServiceIds[0];

  useEffect(() => {
    if (!selectedSalonId || selectedServiceIds.length === 0) {
      router.replace('/book');
    }
  }, [selectedSalonId, selectedServiceIds.length]);

  const {
    data: staff,
    error: staffError,
    isLoading: isStaffLoading,
  } = useQuery({
    queryKey: ['customer', 'staff', selectedSalonId, primaryServiceId],
    queryFn: () => fetchStaff(selectedSalonId!, primaryServiceId),
    enabled: selectedSalonId !== null,
  });

  const canFetchAvailability =
    selectedSalonId !== null &&
    selectedServiceIds.length > 0 &&
    selectedStaffId !== null &&
    selectedDate !== null;

  const {
    data: slots,
    error: availabilityError,
    isLoading: isAvailabilityLoading,
  } = useQuery({
    queryKey: [
      'customer',
      'availability',
      selectedSalonId,
      selectedServiceIds,
      selectedStaffId,
      selectedDate,
    ],
    queryFn: () =>
      fetchAvailability({
        salonId: selectedSalonId!,
        serviceIds: selectedServiceIds,
        date: selectedDate!,
        staffId: selectedStaffId!,
      }),
    enabled: canFetchAvailability,
  });

  if (!selectedSalonId || selectedServiceIds.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.gold} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader
        title="Scegli orario"
        subtitle={`${selectedSalonName} · ${selectedServiceIds.length} servizi selezionati`}
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Collaboratore</Text>

          {isStaffLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.gold} />
              <Text style={styles.loadingText}>Caricamento collaboratori...</Text>
            </View>
          ) : null}

          {staffError ? (
            <View style={styles.errorCard}>
              <GlassErrorBanner message={getStep2ErrorMessage(staffError)} />
              {staffError instanceof CustomerApiError && staffError.status === 403 ? (
                <Pressable
                  style={({ pressed }) => [styles.linkButton, pressed && styles.buttonPressed]}
                  onPress={() => router.push('/claim')}>
                  <Text style={styles.linkButtonText}>Collega profilo</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {!isStaffLoading && !staffError && staff?.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Nessun collaboratore disponibile.</Text>
            </View>
          ) : null}

          {staff?.map((member) => {
            const isSelected =
              selectedStaffId !== null && String(selectedStaffId) === String(member.id);

            return (
              <Pressable
                key={member.id}
                style={({ pressed }) => [
                  styles.optionCard,
                  isSelected && styles.optionCardSelected,
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => setStaff(member.id, member.display_name)}>
                <Text style={[styles.optionTitle, isSelected && styles.optionTitleSelected]}>
                  {member.display_name}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data</Text>
          <View style={styles.dateGrid}>
            {dateOptions.map((option) => {
              const isSelected = selectedDate === option.iso;

              return (
                <Pressable
                  key={option.iso}
                  style={({ pressed }) => [
                    styles.dateChip,
                    isSelected && styles.dateChipSelected,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={() => setDate(option.iso)}>
                  <Text style={[styles.dateChipText, isSelected && styles.dateChipTextSelected]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {canFetchAvailability ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Orari disponibili</Text>

            {isAvailabilityLoading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={colors.gold} />
                <Text style={styles.loadingText}>Caricamento slot...</Text>
              </View>
            ) : null}

            {availabilityError ? (
              <View style={styles.errorCard}>
                <GlassErrorBanner message={getStep2ErrorMessage(availabilityError)} />
              </View>
            ) : null}

            {!isAvailabilityLoading && !availabilityError && slots?.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>
                  Nessuno slot disponibile per questa data. Prova un&apos;altra data o collaboratore.
                </Text>
              </View>
            ) : null}

            <View style={styles.slotGrid}>
              {slots?.map((slot) => {
                const isSelected = selectedSlot !== null && isSameSlot(selectedSlot, slot);

                return (
                  <Pressable
                    key={`${slot.staff_id}-${slot.start_time}`}
                    style={({ pressed }) => [
                      styles.slotChip,
                      isSelected && styles.slotChipSelected,
                      pressed && styles.buttonPressed,
                    ]}
                    onPress={() => setSlot(slot)}>
                    <Text style={[styles.slotText, isSelected && styles.slotTextSelected]}>
                      {formatSlotTime(slot.start_time)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          label="Continua"
          onPress={() => router.push('/book-confirm')}
          disabled={!selectedSlot}
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
  scrollContent: {
    paddingHorizontal: screenPadding,
    paddingBottom: 24,
    gap: 24,
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
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  loadingText: {
    fontSize: 14,
    color: colors.muted,
  },
  emptyCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
  },
  emptyText: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
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
  optionCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
  },
  optionCardSelected: {
    borderColor: colors.gold,
    backgroundColor: colors.surface,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  optionTitleSelected: {
    color: colors.gold,
  },
  dateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dateChip: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  dateChipSelected: {
    borderColor: colors.gold,
    backgroundColor: colors.surface,
  },
  dateChipText: {
    fontSize: 14,
    color: colors.text,
  },
  dateChipTextSelected: {
    color: colors.gold,
    fontWeight: '600',
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotChip: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 72,
    alignItems: 'center',
  },
  slotChipSelected: {
    borderColor: colors.gold,
    backgroundColor: colors.surface,
  },
  slotText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  slotTextSelected: {
    color: colors.gold,
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
    opacity: 0.4,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
});
