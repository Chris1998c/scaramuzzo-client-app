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

import { GlassSurface } from '@/components/ui/GlassSurface';
import { useProfileLinkStatus } from '@/hooks/useProfileLinkStatus';
import { profileLinkQueryKey } from '@/lib/queryKeys';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { colors } from '@/theme/colors';
import { glass, screenPadding } from '@/theme/glass';

type MenuItem = {
  key: string;
  label: string;
  icon: string;
  onPress: () => void;
  destructive?: boolean;
};

const MENU_ICONS: Record<string, string> = {
  home: '⌂',
  book: '✦',
  bookings: '◷',
  claim: '◎',
  login: '→',
  logout: '⎋',
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

  const items: MenuItem[] = [
    {
      key: 'home',
      label: 'Home',
      icon: MENU_ICONS.home,
      onPress: () => closeAndNavigate(() => router.push('/')),
    },
  ];

  if (!isLoggedIn) {
    items.push({
      key: 'login',
      label: 'Accedi',
      icon: MENU_ICONS.login,
      onPress: () => closeAndNavigate(() => router.push('/login')),
    });
  } else if (isProfileUnlinked) {
    items.push(
      {
        key: 'claim',
        label: 'Collega profilo',
        icon: MENU_ICONS.claim,
        onPress: () => closeAndNavigate(() => router.push('/claim')),
      },
      {
        key: 'logout',
        label: 'Esci',
        icon: MENU_ICONS.logout,
        onPress: () => handleLogout(),
        destructive: true,
      },
    );
  } else if (isProfileLinked) {
    items.push(
      {
        key: 'book',
        label: 'Prenota',
        icon: MENU_ICONS.book,
        onPress: () => closeAndNavigate(() => router.push('/book')),
      },
      {
        key: 'bookings',
        label: 'Le mie prenotazioni',
        icon: MENU_ICONS.bookings,
        onPress: () => closeAndNavigate(() => router.push('/bookings')),
      },
      {
        key: 'claim',
        label: 'Collega profilo',
        icon: MENU_ICONS.claim,
        onPress: () => closeAndNavigate(() => router.push('/claim')),
      },
      {
        key: 'logout',
        label: 'Esci',
        icon: MENU_ICONS.logout,
        onPress: () => handleLogout(),
        destructive: true,
      },
    );
  } else {
    items.push({
      key: 'logout',
      label: 'Esci',
      icon: MENU_ICONS.logout,
      onPress: () => handleLogout(),
      destructive: true,
    });
  }

  return (
    <>
      <Pressable
        accessibilityLabel="Menu"
        accessibilityRole="button"
        style={({ pressed }) => [styles.triggerOuter, pressed && styles.triggerPressed]}
        onPress={() => setOpen(true)}>
        <GlassSurface
          borderRadius={glass.radius.pill}
          intensity={glass.blur.trigger}
          contentStyle={styles.triggerInner}>
          <View style={styles.barsColumn}>
            <View style={styles.bar} />
            <View style={styles.bar} />
            <View style={styles.bar} />
          </View>
        </GlassSurface>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View
            style={[
              styles.panelAnchor,
              {
                paddingBottom: insets.bottom + 16,
                paddingRight: screenPadding,
                paddingLeft: screenPadding,
              },
            ]}
            pointerEvents="box-none">
            <Pressable onPress={(e) => e.stopPropagation()}>
              <GlassSurface
                borderRadius={glass.radius.xl}
                intensity={glass.blur.menu}
                contentStyle={styles.panelContent}>
                <Text style={styles.menuTitle}>Navigazione</Text>
                <View style={styles.menuList}>
                  {items.map((item) => (
                    <Pressable
                      key={item.key}
                      style={({ pressed }) => [
                        styles.menuPill,
                        pressed && styles.menuPillPressed,
                      ]}
                      onPress={item.onPress}>
                      <View style={styles.menuIconWrap}>
                        <Text style={styles.menuIcon}>{item.icon}</Text>
                      </View>
                      <Text
                        style={[
                          styles.menuItemText,
                          item.destructive && styles.menuItemDestructive,
                        ]}>
                        {item.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </GlassSurface>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  triggerOuter: {
    width: 48,
    height: 48,
  },
  triggerPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.96 }],
  },
  triggerInner: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barsColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  bar: {
    width: 18,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.gold,
    opacity: 0.95,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(8, 4, 2, 0.55)',
    justifyContent: 'flex-end',
  },
  panelAnchor: {
    alignItems: 'stretch',
  },
  panelContent: {
    padding: 14,
    gap: 10,
  },
  menuTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.muted,
    paddingHorizontal: 6,
    paddingTop: 4,
  },
  menuList: {
    gap: 8,
  },
  menuPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: glass.radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(197, 165, 114, 0.14)',
  },
  menuPillPressed: {
    backgroundColor: 'rgba(197, 165, 114, 0.14)',
    borderColor: 'rgba(197, 165, 114, 0.28)',
  },
  menuIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(197, 165, 114, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(197, 165, 114, 0.2)',
  },
  menuIcon: {
    fontSize: 16,
    color: colors.gold,
  },
  menuItemText: {
    flex: 1,
    fontSize: 18,
    fontWeight: '500',
    color: colors.text,
    letterSpacing: 0.2,
  },
  menuItemDestructive: {
    color: '#f0b8b8',
  },
});
