import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  const isLoading = useAuthStore((state) => state.isLoading);
  const isLoggedIn = Boolean(session);

  const {
    data: salons,
    error,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['customer', 'salons'],
    queryFn: fetchSalons,
    enabled: false,
  });

  const salonsError = error ? getErrorMessage(error) : null;

  if (isLoading) {
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
          </View>
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Ciao{user?.email ? `, ${user.email}` : ''}</Text>
              <Text style={styles.cardText}>
                Sei connesso. Carica i saloni disponibili dal backend Manager.
              </Text>
              <Pressable
                style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
                onPress={() => refetch()}
                disabled={isFetching}>
                {isFetching ? (
                  <ActivityIndicator color={colors.background} />
                ) : (
                  <Text style={styles.buttonText}>Carica saloni</Text>
                )}
              </Pressable>
            </View>

            {salonsError ? (
              <View style={styles.errorCard}>
                <Text style={styles.errorText}>{salonsError}</Text>
              </View>
            ) : null}

            {salons && salons.length > 0 ? (
              <View style={styles.list}>
                <Text style={styles.listTitle}>Saloni</Text>
                {salons.map((salon) => (
                  <View key={salon.id} style={styles.salonCard}>
                    <Text style={styles.salonName}>{salon.name}</Text>
                    {salon.city || salon.address ? (
                      <Text style={styles.salonMeta}>
                        {[salon.address, salon.city].filter(Boolean).join(' · ')}
                      </Text>
                    ) : null}
                  </View>
                ))}
              </View>
            ) : null}

            {salons && salons.length === 0 ? (
              <View style={styles.card}>
                <Text style={styles.cardText}>Nessun salone trovato.</Text>
              </View>
            ) : null}
          </>
        )}
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
    alignSelf: 'flex-start',
    backgroundColor: colors.gold,
    borderRadius: 12,
    paddingHorizontal: 28,
    paddingVertical: 14,
    minWidth: 140,
    alignItems: 'center',
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
