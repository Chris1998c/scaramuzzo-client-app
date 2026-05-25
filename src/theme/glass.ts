import { Platform, type TextStyle } from 'react-native';

import { colors } from '@/theme/colors';

export const glass = {
  radius: {
    md: 16,
    lg: 22,
    xl: 28,
  },
  surface: 'rgba(36, 17, 9, 0.72)',
  surfaceFallback: 'rgba(36, 17, 9, 0.92)',
  border: colors.border,
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

export const supportsBlur = Platform.OS === 'ios' || Platform.OS === 'android';

export const screenPadding = 20;

export const inputStyle: TextStyle = {
  backgroundColor: 'rgba(27, 13, 8, 0.85)',
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: glass.radius.md,
  paddingHorizontal: 16,
  paddingVertical: 14,
  fontSize: 16,
  color: colors.text,
};
