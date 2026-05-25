import { Platform, type TextStyle, type ViewStyle } from 'react-native';

import { colors } from '@/theme/colors';

export const glass = {
  blur: {
    card: 52,
    button: 42,
    menu: 58,
    trigger: 45,
  },
  panel: 'rgba(255, 255, 255, 0.06)',
  panelDeep: 'rgba(20, 9, 5, 0.22)',
  panelFallback: 'rgba(255, 255, 255, 0.09)',
  borderGlow: 'rgba(197, 165, 114, 0.28)',
  borderSubtle: 'rgba(197, 165, 114, 0.14)',
  highlightTop: 'rgba(255, 255, 255, 0.1)',
  radius: {
    pill: 999,
    md: 20,
    lg: 26,
    xl: 32,
  },
  shadowSoft: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.42,
    shadowRadius: 22,
    elevation: 12,
  } satisfies ViewStyle,
  shadowGold: {
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 6,
  } satisfies ViewStyle,
} as const;

export const supportsBlur = Platform.OS === 'ios' || Platform.OS === 'android';

export const screenPadding = 20;

export const frostedBackground: ViewStyle = {
  backgroundColor: colors.background,
};

export const inputStyle: TextStyle = {
  backgroundColor: 'rgba(255, 255, 255, 0.06)',
  borderWidth: 1,
  borderColor: glass.borderGlow,
  borderRadius: glass.radius.md,
  paddingHorizontal: 16,
  paddingVertical: 14,
  fontSize: 16,
  color: colors.text,
};
