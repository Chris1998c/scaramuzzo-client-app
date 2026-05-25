import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/ui/AppHeader';
import { GlassCard } from '@/components/ui/GlassCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { cancelBooking, fetchBookings } from '@/services/customerApi';
import { screenPadding } from '@/theme/glass';
import { useAuthStore } from '@/store/authStore';
import {
  CustomerApiError,
  type BookingTab,
  type CustomerBookingListItem,
} from '@/types/customerApi';
import { colors } from '@/theme/colors';

const BOOKINGS_QUERY_KEY = ['customer', 'bookings'] as const;

function getApiErrorMessage(error: unknown): string {
  if (error instanceof CustomerApiError && error.status === 403) {
    return 'Prima collega il tuo profilo cliente.';
  }

  if (error instanceof CustomerApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Si è verificato un errore imprevisto.';
}

function isCancelledStatus(status: string): boolean {
  const normalized = status.toLowerCase();
  return normalized === 'cancelled' || normalized === 'no_show' || normalized === 'noshow';
}

function categorizeBooking(booking: CustomerBookingListItem): BookingTab {
  if (isCancelledStatus(booking.status)) {
    return 'cancelled';
  }

  const startMs = new Date(booking.start_time).getTime();
  const normalized = booking.status.toLowerCase();

  if (
    (normalized === 'scheduled' || normalized === 'in_sala') &&
    Number.isFinite(startMs) &&
    startMs >= Date.now()
  ) {
    return 'upcoming';
  }

  return 'past';
}

function canCancelBooking(booking: CustomerBookingListItem): boolean {
  if (booking.status.toLowerCase() !== 'scheduled') {
    return false;
  }

  const startMs = new Date(booking.start_time).getTime();
  return Number.isFinite(startMs) && startMs > Date.now();
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  return new Intl.DateTimeFormat('it-IT', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function formatTimeRange(start: string, end: string): string {
  const startMatch = start.match(/T(\d{2}):(\d{2})/);
  const endMatch = end.match(/T(\d{2}):(\d{2})/);

  if (startMatch && endMatch) {
    return `${startMatch[1]}:${startMatch[2]} – ${endMatch[1]}:${endMatch[2]}`;
  }

  return start;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
  }).format(price);
}

function getStaffLabel(booking: CustomerBookingListItem): string {
  const names = [
    ...new Set(
      booking.services
        .map((service) => service.staff_name?.trim())
        .filter((name): name is string => Boolean(name)),
    ),
  ];

  return names.length > 0 ? names.join(', ') : '—';
}

function getTotalPrice(booking: CustomerBookingListItem): number {
  return booking.services.reduce((sum, service) => sum + service.price, 0);
}

function getStatusLabel(status: string): string {
  switch (status.toLowerCase()) {
    case 'scheduled':
      return 'Programmato';
    case 'cancelled':
      return 'Annullato';
    case 'done':
      return 'Completato';
    case 'in_sala':
      return 'In salone';
    case 'no_show':
    case 'noshow':
      return 'Assente';
    default:
      return status;
  }
}

function getBadgeStyle(status: string) {
  const normalized = status.toLowerCase();

  if (normalized === 'cancelled' || normalized === 'no_show' || normalized === 'noshow') {
    return styles.badgeCancelled;
  }

  if (normalized === 'done') {
    return styles.badgeDone;
  }

  return styles.badgeScheduled;
}

type BookingCardProps = {
  booking: CustomerBookingListItem;
  onCancel: (booking: CustomerBookingListItem) => void;
  isCancelling: boolean;
};

function BookingCard({ booking, onCancel, isCancelling }: BookingCardProps) {
  const serviceNames = booking.services.map((service) => service.service_name).join(' · ');

  return (
    <View style={styles.bookingCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.salonName}>{booking.salon_name}</Text>
        <View style={[styles.badge, getBadgeStyle(booking.status)]}>
          <Text style={styles.badgeText}>{getStatusLabel(booking.status)}</Text>
        </View>
      </View>

      <Text style={styles.dateText}>{formatDate(booking.start_time)}</Text>
      <Text style={styles.timeText}>{formatTimeRange(booking.start_time, booking.end_time)}</Text>

      {serviceNames ? <Text style={styles.servicesText}>{serviceNames}</Text> : null}

      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>Collaboratore</Text>
        <Text style={styles.metaValue}>{getStaffLabel(booking)}</Text>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>Totale</Text>
        <Text style={styles.totalValue}>{formatPrice(getTotalPrice(booking))}</Text>
      </View>

      {canCancelBooking(booking) ? (
        <Pressable
          style={({ pressed }) => [
            styles.cancelButton,
            (isCancelling || pressed) && styles.buttonPressed,
            isCancelling && styles.buttonDisabled,
          ]}
          onPress={() => onCancel(booking)}
          disabled={isCancelling}>
          {isCancelling ? (
            <ActivityIndicator color="#f5a5a5" size="small" />
          ) : (
            <Text style={styles.cancelButtonText}>Annulla prenotazione</Text>
          )}
        </Pressable>
      ) : null}
    </View>
  );
}

function BookingSkeleton() {
  return (
    <View style={styles.skeletonList}>
      {[0, 1, 2].map((key) => (
        <View key={key} style={styles.skeletonCard}>
          <View style={styles.skeletonLineWide} />
          <View style={styles.skeletonLine} />
          <View style={styles.skeletonLineShort} />
        </View>
      ))}
    </View>
  );
}

export default function BookingsScreen() {
  const session = useAuthStore((state) => state.session);
  const isAuthLoading = useAuthStore((state) => state.isLoading);
  const [activeTab, setActiveTab] = useState<BookingTab>('upcoming');
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const {
    data: bookings,
    error,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: BOOKINGS_QUERY_KEY,
    queryFn: () => fetchBookings({ limit: 100 }),
    enabled: Boolean(session),
  });

  const cancelMutation = useMutation({
    mutationFn: (bookingId: number) => cancelBooking(bookingId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: BOOKINGS_QUERY_KEY });
    },
  });

  const grouped = useMemo(() => {
    const upcoming: CustomerBookingListItem[] = [];
    const past: CustomerBookingListItem[] = [];
    const cancelled: CustomerBookingListItem[] = [];

    for (const booking of bookings ?? []) {
      const tab = categorizeBooking(booking);
      if (tab === 'upcoming') upcoming.push(booking);
      else if (tab === 'cancelled') cancelled.push(booking);
      else past.push(booking);
    }

    const byStartDesc = (a: CustomerBookingListItem, b: CustomerBookingListItem) =>
      new Date(b.start_time).getTime() - new Date(a.start_time).getTime();

    upcoming.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
    past.sort(byStartDesc);
    cancelled.sort(byStartDesc);

    return { upcoming, past, cancelled };
  }, [bookings]);

  const visibleBookings = grouped[activeTab];
  const tabs: { key: BookingTab; label: string; count: number }[] = [
    { key: 'upcoming', label: 'Prossime', count: grouped.upcoming.length },
    { key: 'past', label: 'Passate', count: grouped.past.length },
    { key: 'cancelled', label: 'Annullate', count: grouped.cancelled.length },
  ];

  function handleCancelPress(booking: CustomerBookingListItem) {
    Alert.alert(
      'Annulla prenotazione',
      `Vuoi annullare l'appuntamento del ${formatDate(booking.start_time)}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Annulla prenotazione',
          style: 'destructive',
          onPress: async () => {
            setCancellingId(booking.id);
            try {
              await cancelMutation.mutateAsync(booking.id);
            } catch (cancelError) {
              Alert.alert('Impossibile annullare', getApiErrorMessage(cancelError));
            } finally {
              setCancellingId(null);
            }
          },
        },
      ],
    );
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
        <AppHeader
          title="Le mie prenotazioni"
          subtitle="Gestisci i tuoi appuntamenti Scaramuzzo"
        />
        <View style={styles.content}>
          <GlassCard>
            <Text style={styles.emptyTitle}>Accedi per vedere i tuoi appuntamenti</Text>
            <PrimaryButton label="Accedi" onPress={() => router.push('/login')} />
          </GlassCard>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader
        title="Le mie prenotazioni"
        subtitle="Gestisci i tuoi appuntamenti Scaramuzzo"
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => refetch()}
            tintColor={colors.gold}
          />
        }>

        <View style={styles.tabRow}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;

            return (
              <Pressable
                key={tab.key}
                style={({ pressed }) => [
                  styles.tabChip,
                  isActive && styles.tabChipActive,
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => setActiveTab(tab.key)}>
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {tab.label} ({tab.count})
                </Text>
              </Pressable>
            );
          })}
        </View>

        {isLoading ? <BookingSkeleton /> : null}

        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{getApiErrorMessage(error)}</Text>
            {error instanceof CustomerApiError && error.status === 403 ? (
              <Pressable
                style={({ pressed }) => [styles.linkButton, pressed && styles.buttonPressed]}
                onPress={() => router.push('/claim')}>
                <Text style={styles.linkButtonText}>Collega profilo</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {!isLoading && !error && visibleBookings.length === 0 ? (
          <GlassCard>
            <Text style={styles.emptyTitle}>
              {activeTab === 'upcoming'
                ? 'Nessuna prenotazione in programma'
                : activeTab === 'past'
                  ? 'Nessuna prenotazione passata'
                  : 'Nessuna prenotazione annullata'}
            </Text>
            <Text style={styles.emptyText}>
              {activeTab === 'upcoming'
                ? 'Prenota il tuo prossimo appuntamento in pochi tap.'
                : 'Qui compariranno i tuoi appuntamenti.'}
            </Text>
            {activeTab === 'upcoming' ? (
              <PrimaryButton label="Prenota ora" onPress={() => router.push('/book')} />
            ) : null}
          </GlassCard>
        ) : null}

        {!isLoading && !error
          ? visibleBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onCancel={handleCancelPress}
                isCancelling={cancellingId === booking.id}
              />
            ))
          : null}
      </ScrollView>
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
    paddingBottom: 32,
    gap: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
    color: colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: colors.muted,
    marginBottom: 8,
  },
  tabRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tabChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.card,
  },
  tabChipActive: {
    borderColor: colors.gold,
    backgroundColor: colors.surface,
  },
  tabText: {
    fontSize: 13,
    color: colors.muted,
    fontWeight: '500',
  },
  tabTextActive: {
    color: colors.gold,
    fontWeight: '600',
  },
  bookingCard: {
    backgroundColor: 'rgba(36, 17, 9, 0.65)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 20,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  salonName: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeScheduled: {
    backgroundColor: 'rgba(197, 165, 114, 0.2)',
    borderWidth: 1,
    borderColor: colors.gold,
  },
  badgeCancelled: {
    backgroundColor: 'rgba(139, 58, 58, 0.25)',
    borderWidth: 1,
    borderColor: '#8b3a3a',
  },
  badgeDone: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#6ee7b7',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  dateText: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
  },
  timeText: {
    fontSize: 14,
    color: colors.muted,
  },
  servicesText: {
    fontSize: 14,
    color: colors.muted,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  metaLabel: {
    fontSize: 13,
    color: colors.muted,
  },
  metaValue: {
    fontSize: 13,
    color: colors.text,
    flex: 1,
    textAlign: 'right',
  },
  totalValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gold,
  },
  cancelButton: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#8b3a3a',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f5a5a5',
  },
  skeletonList: {
    gap: 12,
  },
  skeletonCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 20,
    gap: 10,
  },
  skeletonLineWide: {
    height: 16,
    width: '70%',
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  skeletonLine: {
    height: 12,
    width: '50%',
    borderRadius: 6,
    backgroundColor: colors.surface,
  },
  skeletonLineShort: {
    height: 12,
    width: '35%',
    borderRadius: 6,
    backgroundColor: colors.surface,
  },
  emptyCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 28,
    gap: 12,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 20,
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
  primaryButton: {
    backgroundColor: colors.gold,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 4,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.background,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
