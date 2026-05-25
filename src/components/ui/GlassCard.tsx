import { type ReactNode } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { GlassSurface } from '@/components/ui/GlassSurface';
import { glass } from '@/theme/glass';

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
  intensity = glass.blur.card,
  noPadding = false,
}: GlassCardProps) {
  return (
    <GlassSurface
      style={style}
      intensity={intensity}
      borderRadius={glass.radius.lg}
      contentStyle={[
        noPadding ? undefined : styles.padding,
        contentStyle,
      ]}>
      {children}
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  padding: {
    padding: 22,
    gap: 16,
  },
});
