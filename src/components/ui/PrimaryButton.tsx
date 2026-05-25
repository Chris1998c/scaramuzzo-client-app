import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { GlassSurface } from '@/components/ui/GlassSurface';
import { colors } from '@/theme/colors';
import { glass } from '@/theme/glass';

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  fullWidth = true,
  style,
}: PrimaryButtonProps) {
  const isDisabled = disabled || loading;

  if (variant === 'secondary' || variant === 'ghost') {
    return (
      <Pressable
        style={({ pressed }) => [
          fullWidth && styles.fullWidth,
          isDisabled && styles.disabled,
          pressed && !isDisabled && styles.pressed,
          style,
        ]}
        onPress={onPress}
        disabled={isDisabled}>
        <GlassSurface
          borderRadius={glass.radius.pill}
          intensity={glass.blur.button}
          style={variant === 'ghost' ? styles.ghostSurface : undefined}
          contentStyle={[styles.glassButtonInner, variant === 'ghost' && styles.ghostInner]}>
          {loading ? (
            <ActivityIndicator color={colors.gold} />
          ) : (
            <Text style={styles.labelSecondary}>{label}</Text>
          )}
        </GlassSurface>
      </Pressable>
    );
  }

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        fullWidth && styles.fullWidth,
        styles.primary,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}>
      <View style={styles.primarySheen} />
      {loading ? (
        <ActivityIndicator color={colors.background} />
      ) : (
        <Text style={[styles.label, styles.labelPrimary]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: glass.radius.pill,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
    overflow: 'hidden',
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  primary: {
    backgroundColor: colors.gold,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    ...glass.shadowSoft,
    ...glass.shadowGold,
  },
  primarySheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '45%',
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  glassButtonInner: {
    paddingVertical: 15,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  ghostSurface: {
    borderColor: 'rgba(197, 165, 114, 0.22)',
  },
  ghostInner: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.35,
  },
  labelPrimary: {
    color: colors.background,
  },
  labelSecondary: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.35,
    color: colors.text,
  },
});
