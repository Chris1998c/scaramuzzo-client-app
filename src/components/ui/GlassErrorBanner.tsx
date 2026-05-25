import { StyleSheet, Text } from 'react-native';

import { GlassSurface } from '@/components/ui/GlassSurface';
import { glass } from '@/theme/glass';

type GlassErrorBannerProps = {
  message: string;
};

export function GlassErrorBanner({ message }: GlassErrorBannerProps) {
  return (
    <GlassSurface
      borderRadius={glass.radius.md}
      intensity={glass.blur.button}
      withHighlight={false}
      style={styles.wrap}
      contentStyle={styles.content}>
      <Text style={styles.text}>{message}</Text>
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderColor: 'rgba(245, 165, 165, 0.35)',
  },
  content: {
    padding: 14,
  },
  text: {
    color: '#f5d4d4',
    fontSize: 14,
    lineHeight: 21,
  },
});
