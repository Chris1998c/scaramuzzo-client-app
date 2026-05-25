import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '@/lib/supabase';
import { profileLinkQueryKey } from '@/lib/queryKeys';
import { fetchSalons } from '@/services/customerApi';
import { useAuthStore } from '@/store/authStore';
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

export default function HomeScreen() {
  const session = useAuthStore((state) => state.session);
  const user = useAuthStore((state) => state.user);
  const isAuthLoading = useAuthStore((state) => state.isLoading);
  const clearSession = useAuthStore((state) => state.clearSession);
  const isLoggedIn = Boolean(session);
  const queryClient = useQueryClient();

  const {
    data: salons,
    error: profileError,
    isLoading: isProfileLoading,
  } = useQuery({
    queryKey: profileLinkQueryKey,
    queryFn: fetchSalons,
    enabled: isLoggedIn,
    retry: (failureCount, err) => {
      if (err instanceof CustomerApiError && err.status === 403) {
        return false;
      }

      return failureCount < 1;
    },
  });

  const isProfileUnlinked =
    profileError instanceof CustomerApiError && profileError.status === 403;
  const isProfileLinked = isLoggedIn && !isProfileLoading && !profileError && Boolean(salons);

  async function handleLogout() {
    await supabase.auth.signOut();
    clearSession();
    queryClient.removeQueries({ queryKey: profileLinkQueryKey });
  }

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
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Scaramuzzo</Text>
        <Text style={styles.subtitle}>Prenota il tuo appuntamento</Text>

        {!isLoggedIn ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Accedi per prenotare</Text>
            <Text style={styles.cardText}>
              Effettua l&apos;accesso per consultare i saloni e prenotare il tuo appuntamento.
            </Text>
            <Pressable
              style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
              onPress={() => router.push('/login')}>
              <Text style={styles.buttonText}>Accedi</Text>
            </Pressable>
          </View>
        ) : isProfileLoading ? (
          <View style={styles.card}>
            <ActivityIndicator color={colors.gold} />
            <Text style={styles.cardText}>Verifica profilo in corso...</Text>
          </View>
        ) : isProfileUnlinked ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Collega il tuo profilo</Text>
            <Text style={styles.cardText}>
              Per prenotare devi collegare il tuo account cliente Scaramuzzo con il codice che ti
              ha fornito il salone.
            </Text>
            <Pressable
              style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
              onPress={() => router.push('/claim')}>
              <Text style={styles.buttonText}>Collega profilo</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
              onPress={handleLogout}>
              <Text style={styles.secondaryButtonText}>Esci</Text>
            </Pressable>
          </View>
        ) : profileError ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{getErrorMessage(profileError)}</Text>
            <Pressable
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
              onPress={handleLogout}>
              <Text style={styles.secondaryButtonText}>Esci</Text>
            </Pressable>
          </View>
        ) : isProfileLinked ? (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Ciao{user?.email ? `, ${user.email}` : ''}</Text>
              <Text style={styles.cardText}>
                Profilo collegato. Prenota un appuntamento o consulta le tue prenotazioni.
              </Text>
              <View style={styles.buttonRow}>
                <Pressable
                  style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
                  onPress={() => router.push('/book')}>
                  <Text style={styles.buttonText}>Prenota ora</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
                  onPress={() => router.push('/bookings')}>
                  <Text style={styles.buttonText}>Le mie prenotazioni</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={handleLogout}>
                  <Text style={styles.secondaryButtonText}>Esci</Text>
                </Pressable>
              </View>
            </View>

            {(salons ?? []).length > 0 ? (
              <View style={styles.list}>
                <Text style={styles.listTitle}>Saloni disponibili</Text>
                {(salons ?? []).map((salon) => (
                  <View key={String(salon.id)} style={styles.salonCard}>
                    <Text style={styles.salonName}>{salon.name}</Text>
                    {salon.city || salon.address ? (
                      <Text style={styles.salonMeta}>
                        {[salon.address, salon.city].filter(Boolean).join(' · ')}
                      </Text>
                    ) : null}
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.card}>
                <Text style={styles.cardText}>Nessun salone disponibile al momento.</Text>
              </View>
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
  content: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 32,
    gap: 12,
  },
  title: {
    fontSize: 40,
    fontWeight: '600',
    color: colors.text,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 18,
    color: colors.muted,
    marginBottom: 24,
  },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 24,
    gap: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  cardText: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
  },
  button: {
    backgroundColor: colors.gold,
    borderRadius: 12,
    paddingHorizontal: 28,
    paddingVertical: 14,
    minWidth: 140,
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 28,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
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
  list: {
    gap: 12,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 8,
  },
  salonCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    gap: 4,
  },
  salonName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  salonMeta: {
    fontSize: 14,
    color: colors.muted,
  },
});
