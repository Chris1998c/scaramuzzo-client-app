import { router } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/ui/AppHeader';
import { GlassCard } from '@/components/ui/GlassCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useProfileLinkStatus } from '@/hooks/useProfileLinkStatus';
import { useAuthStore } from '@/store/authStore';
import { CustomerApiError } from '@/types/customerApi';
import { colors } from '@/theme/colors';
import { screenPadding } from '@/theme/glass';

function getErrorMessage(error: unknown): string {
  if (error instanceof CustomerApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Si è verificato un errore imprevisto.';
}

export default function HomeScreen() {
  const user = useAuthStore((state) => state.user);
  const isAuthLoading = useAuthStore((state) => state.isLoading);
  const {
    isLoggedIn,
    isProfileLinked,
    isProfileUnlinked,
    isProfileLoading,
    profileError,
    salons,
  } = useProfileLinkStatus();

  if (isAuthLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.gold} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <AppHeader
          large
          title="Scaramuzzo"
          subtitle="Il tuo salone, sempre a portata di mano"
        />

        <View style={styles.heroAccent} />

        {!isLoggedIn ? (
          <GlassCard>
            <Text style={styles.cardTitle}>Benvenuto</Text>
            <Text style={styles.cardText}>
              Accedi per collegare il profilo cliente e prenotare i tuoi appuntamenti.
            </Text>
            <PrimaryButton label="Accedi" onPress={() => router.push('/login')} />
          </GlassCard>
        ) : isProfileLoading ? (
          <GlassCard contentStyle={styles.loadingCard}>
            <ActivityIndicator color={colors.gold} />
            <Text style={styles.cardText}>Verifica profilo in corso…</Text>
          </GlassCard>
        ) : isProfileUnlinked ? (
          <GlassCard>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>Profilo da collegare</Text>
            </View>
            <Text style={styles.cardTitle}>Collega il tuo profilo</Text>
            <Text style={styles.cardText}>
              Per prenotare devi associare il numero di telefono della tua scheda cliente Scaramuzzo.
            </Text>
            <PrimaryButton label="Collega profilo" onPress={() => router.push('/claim')} />
          </GlassCard>
        ) : profileError ? (
          <GlassCard>
            <Text style={styles.errorText}>{getErrorMessage(profileError)}</Text>
          </GlassCard>
        ) : isProfileLinked ? (
          <>
            <GlassCard>
              <View style={[styles.statusBadge, styles.statusBadgeLinked]}>
                <Text style={[styles.statusBadgeText, styles.statusBadgeTextLinked]}>
                  Profilo collegato
                </Text>
              </View>
              <Text style={styles.cardTitle}>
                Ciao{user?.email ? `, ${user.email.split('@')[0]}` : ''}
              </Text>
              <Text style={styles.cardText}>
                Prenota un nuovo appuntamento o consulta le tue prenotazioni.
              </Text>
              <PrimaryButton label="Prenota ora" onPress={() => router.push('/book')} />
              <PrimaryButton
                label="Le mie prenotazioni"
                variant="secondary"
                onPress={() => router.push('/bookings')}
              />
            </GlassCard>

            {(salons ?? []).length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Saloni</Text>
                {(salons ?? []).map((salon) => (
                  <GlassCard key={String(salon.id)} contentStyle={styles.salonCard}>
                    <Text style={styles.salonName}>{salon.name}</Text>
                    {salon.city || salon.address ? (
                      <Text style={styles.salonMeta}>
                        {[salon.address, salon.city].filter(Boolean).join(' · ')}
                      </Text>
                    ) : null}
                  </GlassCard>
                ))}
              </View>
            ) : (
              <GlassCard>
                <Text style={styles.cardText}>Nessun salone disponibile al momento.</Text>
              </GlassCard>
            )}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: screenPadding,
    paddingBottom: 40,
    gap: 16,
  },
  heroAccent: {
    height: 1,
    marginHorizontal: screenPadding,
    marginBottom: 20,
    backgroundColor: 'rgba(197, 165, 114, 0.35)',
  },
  section: {
    gap: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.text,
  },
  cardText: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
    opacity: 0.92,
  },
  loadingCard: {
    alignItems: 'center',
    gap: 12,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(197, 165, 114, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(197, 165, 114, 0.35)',
  },
  statusBadgeLinked: {
    backgroundColor: 'rgba(90, 53, 32, 0.5)',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.gold,
  },
  statusBadgeTextLinked: {
    color: colors.text,
  },
  salonCard: {
    gap: 6,
    paddingVertical: 16,
  },
  salonName: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  salonMeta: {
    fontSize: 14,
    color: colors.muted,
  },
  errorText: {
    color: '#f5c4c4',
    fontSize: 14,
    lineHeight: 20,
  },
});
