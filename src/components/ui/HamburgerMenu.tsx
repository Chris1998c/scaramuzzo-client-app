import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassCard } from '@/components/ui/GlassCard';
import { useProfileLinkStatus } from '@/hooks/useProfileLinkStatus';
import { profileLinkQueryKey } from '@/lib/queryKeys';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { colors } from '@/theme/colors';
import { glass, screenPadding } from '@/theme/glass';

type MenuItem = {
  key: string;
  label: string;
  onPress: () => void;
};

export function HamburgerMenu() {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const clearSession = useAuthStore((state) => state.clearSession);
  const queryClient = useQueryClient();
  const { isLoggedIn, isProfileLinked, isProfileUnlinked } = useProfileLinkStatus();

  function closeAndNavigate(action: () => void) {
    setOpen(false);
    action();
  }

  async function handleLogout() {
    setOpen(false);
    await supabase.auth.signOut();
    clearSession();
    queryClient.removeQueries({ queryKey: profileLinkQueryKey });
    router.replace('/');
  }

  const items: MenuItem[] = [];

  items.push({
    key: 'home',
    label: 'Home',
    onPress: () => closeAndNavigate(() => router.push('/')),
  });

  if (!isLoggedIn) {
    items.push({
      key: 'login',
      label: 'Accedi',
      onPress: () => closeAndNavigate(() => router.push('/login')),
    });
  } else if (isProfileUnlinked) {
    items.push({
      key: 'claim',
      label: 'Collega profilo',
      onPress: () => closeAndNavigate(() => router.push('/claim')),
    });
    items.push({
      key: 'logout',
      label: 'Esci',
      onPress: () => handleLogout(),
    });
  } else if (isProfileLinked) {
    items.push({
      key: 'book',
      label: 'Prenota',
      onPress: () => closeAndNavigate(() => router.push('/book')),
    });
    items.push({
      key: 'bookings',
      label: 'Le mie prenotazioni',
      onPress: () => closeAndNavigate(() => router.push('/bookings')),
    });
    items.push({
      key: 'claim',
      label: 'Collega profilo',
      onPress: () => closeAndNavigate(() => router.push('/claim')),
    });
    items.push({
      key: 'logout',
      label: 'Esci',
      onPress: () => handleLogout(),
    });
  } else {
    items.push({
      key: 'logout',
      label: 'Esci',
      onPress: () => handleLogout(),
    });
  }

  return (
    <>
      <Pressable
        accessibilityLabel="Menu"
        accessibilityRole="button"
        style={({ pressed }) => [styles.trigger, pressed && styles.triggerPressed]}
        onPress={() => setOpen(true)}>
        <View style={styles.bar} />
        <View style={[styles.bar, styles.barMiddle]} />
        <View style={styles.bar} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable
            style={[styles.panelWrap, { paddingTop: insets.top + 12, paddingRight: screenPadding }]}
            onPress={(e) => e.stopPropagation()}>
            <GlassCard style={styles.panel} contentStyle={styles.panelContent}>
              <Text style={styles.menuTitle}>Menu</Text>
              {items.map((item) => (
                <Pressable
                  key={item.key}
                  style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
                  onPress={item.onPress}>
                  <Text style={styles.menuItemText}>{item.label}</Text>
                </Pressable>
              ))}
            </GlassCard>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    width: 44,
    height: 44,
    borderRadius: glass.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(197, 165, 114, 0.25)',
    backgroundColor: 'rgba(36, 17, 9, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  triggerPressed: {
    opacity: 0.85,
  },
  bar: {
    width: 18,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.gold,
  },
  barMiddle: {
    width: 14,
    alignSelf: 'flex-end',
    marginRight: 2,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(8, 4, 2, 0.72)',
    alignItems: 'flex-end',
  },
  panelWrap: {
    width: '78%',
    maxWidth: 300,
  },
  panel: {
    width: '100%',
  },
  panelContent: {
    gap: 4,
    paddingVertical: 8,
  },
  menuTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.muted,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  menuItem: {
    borderRadius: glass.radius.md,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  menuItemPressed: {
    backgroundColor: 'rgba(197, 165, 114, 0.12)',
  },
  menuItemText: {
    fontSize: 17,
    fontWeight: '500',
    color: colors.text,
  },
});
