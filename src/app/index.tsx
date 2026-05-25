import { router } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/ui/AppHeader';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassErrorBanner } from '@/components/ui/GlassErrorBanner';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useProfileLinkStatus } from '@/hooks/useProfileLinkStatus';
import { getApiErrorMessage } from '@/lib/apiErrorMessage';
import { formatGreeting } from '@/lib/formatUserDisplayName';
import { useAuthStore } from '@/store/authStore';
import { colors } from '@/theme/colors';
import { glass, screenPadding } from '@/theme/glass';

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

  const greeting = formatGreeting({
    email: user?.email,
    userMetadata: user?.user_metadata ?? null,
  });

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
      <View style={styles.frostLayer} pointerEvents="none" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <AppHeader
          large
          showBrandLogo
          title="Scaramuzzo"
          subtitle="Bellezza e cura, con eleganza"
        />

        <View style={styles.heroLine} />

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
            <Text style={styles.cardTitle}>{greeting}</Text>
            <Text style={styles.cardText}>
              Per prenotare associa il numero di telefono della tua scheda cliente Scaramuzzo.
            </Text>
            <PrimaryButton label="Collega profilo" onPress={() => router.push('/claim')} />
          </GlassCard>
        ) : profileError ? (
          <GlassErrorBanner message={getApiErrorMessage(profileError)} />
        ) : isProfileLinked ? (
          <>
            <GlassCard>
              <View style={[styles.statusBadge, styles.statusBadgeLinked]}>
                <Text style={[styles.statusBadgeText, styles.statusBadgeTextLinked]}>
                  Profilo collegato
                </Text>
              </View>
              <Text style={styles.cardTitle}>{greeting}</Text>
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
              <GlassCard contentStyle={styles.salonsCard}>
                <Text style={styles.sectionTitle}>Saloni</Text>
                <View style={styles.salonList}>
                  {(salons ?? []).map((salon) => (
                    <View key={String(salon.id)} style={styles.salonPill}>
                      <Text style={styles.salonName}>{salon.name}</Text>
                      {salon.city || salon.address ? (
                        <Text style={styles.salonMeta}>
                          {[salon.address, salon.city].filter(Boolean).join(' · ')}
                        </Text>
                      ) : null}
                    </View>
                  ))}
                </View>
              </GlassCard>
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
  frostLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(197, 165, 114, 0.04)',
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
  heroLine: {
    height: 1,
    marginBottom: 4,
    backgroundColor: 'rgba(197, 165, 114, 0.28)',
    shadowColor: colors.gold,
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
    letterSpacing: 0.3,
  },
  cardText: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
    opacity: 0.9,
  },
  loadingCard: {
    alignItems: 'center',
    gap: 12,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: glass.radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: glass.borderGlow,
  },
  statusBadgeLinked: {
    backgroundColor: 'rgba(197, 165, 114, 0.12)',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.gold,
  },
  statusBadgeTextLinked: {
    color: colors.text,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  salonsCard: {
    gap: 14,
  },
  salonList: {
    gap: 10,
  },
  salonPill: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: glass.radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(197, 165, 114, 0.16)',
    gap: 4,
  },
  salonName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  salonMeta: {
    fontSize: 13,
    color: colors.muted,
    lineHeight: 18,
  },
});
