import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { HamburgerMenu } from '@/components/ui/HamburgerMenu';
import { BRAND_LOGO_WEBP } from '@/lib/brandAssets';
import { colors } from '@/theme/colors';
import { screenPadding } from '@/theme/glass';

type AppHeaderProps = {
  title: string;
  subtitle?: string;
  large?: boolean;
  showMenu?: boolean;
  showBrandLogo?: boolean;
};

export function AppHeader({
  title,
  subtitle,
  large = false,
  showMenu = true,
  showBrandLogo = false,
}: AppHeaderProps) {
  const [logoFailed, setLogoFailed] = useState(false);
  const showLogo = showBrandLogo && !logoFailed;

  if (showBrandLogo) {
    return (
      <View style={styles.wrap}>
        <View style={styles.brandTopRow}>
          {showLogo ? (
            <Image
              source={BRAND_LOGO_WEBP}
              style={styles.brandLogo}
              contentFit="contain"
              onError={() => setLogoFailed(true)}
            />
          ) : (
            <View style={styles.brandLogoPlaceholder} />
          )}
          {showMenu ? (
            <View style={styles.menuSlotBrand}>
              <HamburgerMenu />
            </View>
          ) : null}
        </View>

        <Text
          style={[styles.title, large && styles.titleLarge, styles.titleNoWrap]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.72}>
          {title}
        </Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={[styles.textBlock, showMenu && styles.textBlockWithMenu]}>
        <Text
          style={[styles.title, large && styles.titleLarge, styles.titleNoWrap]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}>
          {title}
        </Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {showMenu ? (
        <View style={styles.menuSlot}>
          <HamburgerMenu />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    paddingHorizontal: screenPadding,
    paddingTop: 4,
    paddingBottom: 18,
  },
  brandTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    marginBottom: 10,
  },
  brandLogo: {
    width: 40,
    height: 40,
  },
  brandLogoPlaceholder: {
    width: 40,
    height: 40,
  },
  menuSlotBrand: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 20,
  },
  textBlock: {
    gap: 6,
  },
  textBlockWithMenu: {
    paddingRight: 56,
  },
  menuSlot: {
    position: 'absolute',
    top: 4,
    right: screenPadding,
    zIndex: 20,
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
    letterSpacing: 0.5,
  },
  titleNoWrap: {
    width: '100%',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.muted,
    marginTop: 6,
  },
});
