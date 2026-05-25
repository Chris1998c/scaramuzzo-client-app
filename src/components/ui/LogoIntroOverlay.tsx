import { Image } from 'expo-image';
import { useEffect, useMemo, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { BRAND_LOGO_WEBP } from '@/lib/brandAssets';
import { colors } from '@/theme/colors';

const INTRO_TOTAL_MS = 1100;

type LogoIntroOverlayProps = {
  onComplete: () => void;
};

export function LogoIntroOverlay({ onComplete }: LogoIntroOverlayProps) {
  const opacity = useMemo(() => new Animated.Value(0), []);
  const scale = useMemo(() => new Animated.Value(0.9), []);
  const [logoVisible, setLogoVisible] = useState(true);

  useEffect(() => {
    const animation = Animated.sequence([
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 340,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 8,
          tension: 90,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(360),
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1.05,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]);

    animation.start(({ finished }) => {
      if (finished) {
        onComplete();
      }
    });

    const fallback = setTimeout(onComplete, INTRO_TOTAL_MS + 80);

    return () => {
      animation.stop();
      clearTimeout(fallback);
    };
  }, [onComplete, opacity, scale]);

  return (
    <View style={styles.overlay} pointerEvents="none">
      <Animated.View style={[styles.logoWrap, { opacity, transform: [{ scale }] }]}>
        {logoVisible ? (
          <Image
            source={BRAND_LOGO_WEBP}
            style={styles.logo}
            contentFit="contain"
            onError={() => setLogoVisible(false)}
          />
        ) : (
          <View style={styles.logoFallback} />
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 120,
    height: 120,
  },
  logoFallback: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(197, 165, 114, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(197, 165, 114, 0.35)',
  },
});
