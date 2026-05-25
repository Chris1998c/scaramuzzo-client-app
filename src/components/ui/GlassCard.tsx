import { BlurView } from 'expo-blur';
import { type ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { glass, supportsBlur } from '@/theme/glass';

type GlassCardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  intensity?: number;
  noPadding?: boolean;
};

export function GlassCard({
  children,
  style,
  contentStyle,
  intensity = 48,
  noPadding = false,
}: GlassCardProps) {
  const radius = glass.radius.lg;

  if (supportsBlur) {
    return (
      <View style={[styles.wrapper, glass.shadow, { borderRadius: radius }, style]}>
        <BlurView
          intensity={intensity}
          tint="dark"
          style={[StyleSheet.absoluteFill, { borderRadius: radius, overflow: 'hidden' }]}
        />
        <View style={[styles.tint, { borderRadius: radius }]} />
        <View
          style={[
            styles.border,
            { borderRadius: radius },
            noPadding ? undefined : styles.padding,
            contentStyle,
          ]}>
          {children}
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.wrapper,
        styles.fallback,
        glass.shadow,
        { borderRadius: radius },
        noPadding ? undefined : styles.padding,
        style,
        contentStyle,
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: glass.border,
  },
  tint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: glass.surface,
  },
  border: {
    borderWidth: 1,
    borderColor: 'rgba(197, 165, 114, 0.12)',
  },
  padding: {
    padding: 22,
    gap: 16,
  },
  fallback: {
    backgroundColor: glass.surfaceFallback,
    borderColor: glass.border,
    ...Platform.select({
      web: { backdropFilter: 'blur(12px)' as unknown as undefined },
    }),
  },
});
