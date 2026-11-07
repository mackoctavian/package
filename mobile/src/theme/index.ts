import { Platform } from 'react-native';

/** DMRC brand tokens, matching the web site's navy / gold / ivory palette. */
export const colors = {
  navy950: '#0a1426',
  navy900: '#0f1e38',
  navy800: '#172a4a',
  navy700: '#20365b',
  navy600: '#2c4570',
  navy500: '#3d5a87',
  navy400: '#5f7ba6',
  navy300: '#94aac9',
  navy200: '#c3d0e3',
  navy100: '#e1e8f2',
  navy50: '#f2f5fa',

  gold700: '#7a5524',
  gold600: '#9a6f2a',
  gold500: '#b98a36',
  gold400: '#cfa14f',
  gold300: '#ddbb76',
  gold200: '#ead6a9',
  gold100: '#f5ecd6',
  gold50: '#fbf7ee',

  ivory: '#fbf9f5',
  parchment: '#f4efe6',
  white: '#ffffff',
  ink: '#0f1e38',
  text: '#1d2a40',
  muted: '#5d6779',
  subtle: '#8a93a3',
  border: '#e8e2d6',
  hairline: 'rgba(15,30,56,0.08)',

  success: '#3f7d4e',
  successSoft: '#e6f2e8',
  warning: '#a36a12',
  warningSoft: '#fbf0dc',
  danger: '#b4423a',
  dangerSoft: '#fbe9e7',
  overlay: 'rgba(10,20,38,0.55)',
} as const;

export const fonts = {
  display: 'CormorantGaramond_700Bold',
  displaySemi: 'CormorantGaramond_600SemiBold',
  displayItalic: 'CormorantGaramond_500Medium_Italic',
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 } as const;

export const radius = { sm: 10, md: 14, lg: 18, xl: 24, xxl: 32, pill: 999 } as const;

export const shadow = {
  soft: Platform.select({
    ios: { shadowColor: '#14284b', shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } },
    default: { elevation: 3, shadowColor: '#14284b' },
  }),
  lift: Platform.select({
    ios: { shadowColor: '#14284b', shadowOpacity: 0.18, shadowRadius: 28, shadowOffset: { width: 0, height: 16 } },
    default: { elevation: 8, shadowColor: '#14284b' },
  }),
} as const;

/** Height of the floating tab bar, used to pad scroll views on tab screens. */
export const TAB_BAR_SPACE = 110;
