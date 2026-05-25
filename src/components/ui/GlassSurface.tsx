import { BlurView } from 'expo-blur';
import { type ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { glass, supportsBlur } from '@/theme/glass';

type GlassSurfaceProps = {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  borderRadius?: number;
  intensity?: number;
  withHighlight?: boolean;
  withReflection?: boolean;
};

export function GlassSurface({
  children,
  style,
  contentStyle,
  borderRadius = glass.radius.lg,
  intensity = glass.blur.card,
  withHighlight = true,
  withReflection = true,
}: GlassSurfaceProps) {
  if (supportsBlur) {
    return (
      <View
        style={[
          styles.shell,
          glass.shadowSoft,
          glass.shadowGold,
          { borderRadius },
          style,
        ]}>
        <BlurView
          intensity={intensity}
          tint="dark"
          style={[StyleSheet.absoluteFill, { borderRadius, overflow: 'hidden' }]}
        />
        <View style={[styles.tint, { borderRadius }]} />
        <View style={[styles.depth, { borderRadius }]} />
        {withHighlight ? <View style={[styles.highlightTop, { borderTopLeftRadius: borderRadius, borderTopRightRadius: borderRadius }]} /> : null}
        {withReflection ? (
          <View style={[styles.highlightBottom, { borderBottomLeftRadius: borderRadius, borderBottomRightRadius: borderRadius }]} />
        ) : null}
        <View style={[styles.borderRing, { borderRadius }, contentStyle]}>{children}</View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.shell,
        styles.fallback,
        glass.shadowSoft,
        { borderRadius },
        style,
        contentStyle,
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: glass.borderGlow,
  },
  tint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: glass.panel,
  },
  depth: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: glass.panelDeep,
  },
  highlightTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: glass.highlightTop,
  },
  highlightBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  borderRing: {
    borderWidth: 1,
    borderColor: glass.borderSubtle,
  },
  fallback: {
    backgroundColor: glass.panelFallback,
    borderColor: glass.borderGlow,
    ...Platform.select({
      web: { backdropFilter: 'blur(16px)' as unknown as undefined },
    }),
  },
});
