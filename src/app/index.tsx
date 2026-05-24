import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/theme/colors';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Scaramuzzo</Text>
        <Text style={styles.subtitle}>Prenota il tuo appuntamento</Text>

        <View style={styles.card}>
          <Text style={styles.cardText}>
            Benvenuto nell&apos;app clienti Scaramuzzo. Il percorso di prenotazione sarà
            disponibile a breve.
          </Text>
          <Pressable
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            onPress={() => {}}>
            <Text style={styles.buttonText}>Inizia</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
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
    gap: 24,
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
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
});
