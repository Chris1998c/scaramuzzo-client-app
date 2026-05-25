import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useMemo } from 'react';
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
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassErrorBanner } from '@/components/ui/GlassErrorBanner';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { getApiErrorMessage } from '@/lib/apiErrorMessage';
import {
  canContinueBooking,
  getBlowDryRequirementState,
} from '@/lib/bookingServiceRules';
import { fetchSalons, fetchServices } from '@/services/customerApi';
import { screenPadding } from '@/theme/glass';
import { useAuthStore } from '@/store/authStore';
import { useBookingStore } from '@/store/bookingStore';
import { CustomerApiError } from '@/types/customerApi';
import { colors } from '@/theme/colors';

function getBookErrorMessage(error: unknown): string {
  if (error instanceof CustomerApiError && error.status === 403) {
    return 'Prima collega il tuo profilo cliente.';
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

export default function BookScreen() {
  const isAuthLoading = useAuthStore((state) => state.isLoading);
  const session = useAuthStore((state) => state.session);
  const selectedSalonId = useBookingStore((state) => state.selectedSalonId);
  const selectedServiceIds = useBookingStore((state) => state.selectedServiceIds);
  const setSalon = useBookingStore((state) => state.setSalon);
  const toggleService = useBookingStore((state) => state.toggleService);

  const {
    data: salons,
    error: salonsError,
    isLoading: isSalonsLoading,
  } = useQuery({
    queryKey: ['customer', 'salons'],
    queryFn: fetchSalons,
    enabled: Boolean(session),
  });

  const {
    data: services,
    error: servicesError,
    isLoading: isServicesLoading,
  } = useQuery({
    queryKey: ['customer', 'services', selectedSalonId],
    queryFn: () => fetchServices(selectedSalonId!),
    enabled: selectedSalonId !== null,
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
  const hasSelectedServices = selectedServiceIds.length > 0;

  const blowDryState = useMemo(
    () => getBlowDryRequirementState(services ?? [], selectedServiceIds),
    [services, selectedServiceIds],
  );

  const canContinue = canContinueBooking(services ?? [], selectedServiceIds);

  function handleContinue() {
    if (!canContinue) {
      return;
    }

    router.push('/book-step-2');
  }

  function handleAddBlowDry() {
    if (blowDryState.status !== 'missing_blow_dry') {
      return;
    }

    const piegaId = blowDryState.blowDryService.id;
    const alreadySelected = selectedServiceIds.some((id) => String(id) === String(piegaId));

    if (!alreadySelected) {
      toggleService(piegaId);
    }
  }

  if (isAuthLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.gold} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader title="Prenota" subtitle="Scegli salone e servizi" />
        <View style={styles.content}>
          <GlassCard>
            <Text style={styles.cardText}>Accedi per avviare una prenotazione.</Text>
            <PrimaryButton label="Accedi" onPress={() => router.push('/login')} />
          </GlassCard>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Prenota" subtitle="Scegli salone e servizi" />
      <ScrollView contentContainerStyle={styles.scrollContent}>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Scegli salone</Text>

          {isSalonsLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.gold} />
              <Text style={styles.loadingText}>Caricamento saloni...</Text>
            </View>
          ) : null}

          {salonsError ? (
            <View style={styles.errorCard}>
              <GlassErrorBanner message={getBookErrorMessage(salonsError)} />
              {salonsError instanceof CustomerApiError && salonsError.status === 403 ? (
                <Pressable
                  style={({ pressed }) => [styles.linkButton, pressed && styles.buttonPressed]}
                  onPress={() => router.push('/claim')}>
                  <Text style={styles.linkButtonText}>Collega profilo</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {!isSalonsLoading && !salonsError && salons?.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Nessun salone disponibile.</Text>
            </View>
          ) : null}

          {salons?.map((salon) => {
            const isSelected =
              selectedSalonId !== null && String(selectedSalonId) === String(salon.id);

            return (
              <Pressable
                key={String(salon.id)}
                style={({ pressed }) => [
                  styles.salonCard,
                  isSelected && styles.salonCardSelected,
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => setSalon(salon.id, salon.name)}>
                <Text style={[styles.salonName, isSelected && styles.salonNameSelected]}>
                  {salon.name}
                </Text>
                {salon.city || salon.address ? (
                  <Text style={styles.salonMeta}>
                    {[salon.address, salon.city].filter(Boolean).join(' · ')}
                  </Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>

        {selectedSalonId !== null ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Scegli servizi</Text>

            {isServicesLoading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={colors.gold} />
                <Text style={styles.loadingText}>Caricamento servizi...</Text>
              </View>
            ) : null}

            {servicesError ? (
              <View style={styles.errorCard}>
                <GlassErrorBanner message={getBookErrorMessage(servicesError)} />
              </View>
            ) : null}

            {!isServicesLoading && !servicesError && services?.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>
                  Nessun servizio disponibile per questo salone.
                </Text>
              </View>
            ) : null}

            {services?.map((service) => {
              const isSelected = selectedServiceIds.some(
                (id) => String(id) === String(service.id),
              );

              return (
                <Pressable
                  key={service.id}
                  style={({ pressed }) => [
                    styles.serviceCard,
                    isSelected && styles.serviceCardSelected,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={() => toggleService(service.id)}>
                  <View style={styles.serviceHeader}>
                    <Text style={[styles.serviceName, isSelected && styles.serviceNameSelected]}>
                      {service.name}
                    </Text>
                    {isSelected ? <Text style={styles.checkmark}>✓</Text> : null}
                  </View>
                  {service.category_name ? (
                    <Text style={styles.serviceCategory}>{service.category_name}</Text>
                  ) : null}
                  <View style={styles.serviceMeta}>
                    <Text style={styles.serviceMetaText}>{formatDuration(service.duration)}</Text>
                    <Text style={styles.servicePrice}>{formatPrice(service.price)}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {hasSelectedServices ? (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Riepilogo</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Durata totale</Text>
              <Text style={styles.summaryValue}>{formatDuration(totalDuration)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Prezzo totale</Text>
              <Text style={styles.summaryValue}>{formatPrice(totalPrice)}</Text>
            </View>
          </View>
        ) : null}

        {blowDryState.status === 'missing_blow_dry' ? (
          <GlassCard contentStyle={styles.ruleCard}>
            <Text style={styles.ruleTitle}>Piega consigliata</Text>
            <Text style={styles.ruleText}>
              Per completare questo servizio è necessario aggiungere anche la piega.
            </Text>
            <PrimaryButton label="Aggiungi piega" onPress={handleAddBlowDry} />
          </GlassCard>
        ) : null}

        {blowDryState.status === 'blow_dry_unavailable' ? (
          <GlassCard contentStyle={styles.ruleCard}>
            <Text style={styles.ruleTitle}>Piega non disponibile online</Text>
            <Text style={styles.ruleText}>
              La piega non risulta disponibile online. Contatta il salone per completare la
              prenotazione.
            </Text>
          </GlassCard>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton label="Continua" onPress={handleContinue} disabled={!canContinue} />
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
  content: {
    flex: 1,
    paddingHorizontal: screenPadding,
    gap: 16,
  },
  scrollContent: {
    paddingHorizontal: screenPadding,
    paddingBottom: 24,
    gap: 24,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 24,
    gap: 16,
  },
  cardText: {
    fontSize: 16,
    lineHeight: 24,
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
  salonCard: {
    backgroundColor: 'rgba(36, 17, 9, 0.65)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
    gap: 4,
  },
  salonCardSelected: {
    borderColor: colors.gold,
    backgroundColor: 'rgba(197, 165, 114, 0.1)',
  },
  salonName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  salonNameSelected: {
    color: colors.gold,
  },
  salonMeta: {
    fontSize: 14,
    color: colors.muted,
  },
  serviceCard: {
    backgroundColor: 'rgba(36, 17, 9, 0.65)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
    gap: 6,
  },
  serviceCardSelected: {
    borderColor: colors.gold,
    backgroundColor: colors.surface,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  serviceName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  serviceNameSelected: {
    color: colors.gold,
  },
  checkmark: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gold,
  },
  serviceCategory: {
    fontSize: 13,
    color: colors.muted,
  },
  serviceMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceMetaText: {
    fontSize: 14,
    color: colors.muted,
  },
  servicePrice: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  summaryCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.muted,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  ruleCard: {
    gap: 12,
  },
  ruleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gold,
  },
  ruleText: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
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
