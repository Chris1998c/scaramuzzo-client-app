import { StyleSheet, Text, View } from 'react-native';

import { HamburgerMenu } from '@/components/ui/HamburgerMenu';
import { colors } from '@/theme/colors';
import { screenPadding } from '@/theme/glass';

type AppHeaderProps = {
  title: string;
  subtitle?: string;
  large?: boolean;
  showMenu?: boolean;
};

export function AppHeader({ title, subtitle, large = false, showMenu = true }: AppHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.textBlock}>
        <Text style={[styles.title, large && styles.titleLarge]}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {showMenu ? <HamburgerMenu /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: screenPadding,
    paddingTop: 8,
    paddingBottom: 20,
  },
  textBlock: {
    flex: 1,
    gap: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: colors.text,
    letterSpacing: 0.4,
  },
  titleLarge: {
    fontSize: 34,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.muted,
  },
});
