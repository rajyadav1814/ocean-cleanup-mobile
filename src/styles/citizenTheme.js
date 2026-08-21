// Citizen dashboard palette, mirrored from ocean-cleanup-frontend's
// CitizenOverview.jsx (.co-root / [data-theme="dark"] .co-root tokens).
// Dark mode intentionally shares the midnight-ocean system used by
// Login/Signup; light mode is the plain white/teal citizen-space look.
export const CITIZEN_LIGHT = {
  primary: '#2E9E9B',
  primaryHover: '#24827F',
  secondary: '#14669E',
  warning: '#C6821E',
  success: '#2E9E9B',
  pageBg: '#F3F7FB',
  surface: '#FFFFFF',
  surfaceHover: '#F4F9FC',
  overlaySurface: '#FFFFFF',
  borderLight: '#E4EDF4',
  borderGlow: '#7FC3E8',
  textMain: '#0A1E30',
  textMuted: '#7B8FA1',
  ink: '#04121F',
  danger: '#DC2626',
  dangerBg: 'rgba(239,68,68,0.12)',
};

export const CITIZEN_DARK = {
  primary: '#6FC9C4',
  primaryHover: '#A9D8F0',
  secondary: '#0B82C9',
  warning: '#F8B84E',
  success: '#6FC9C4',
  pageBgGradient: ['#05192E', '#072744', '#08395F'],
  surface: 'rgba(255,255,255,0.05)',
  surfaceHover: 'rgba(255,255,255,0.08)',
  // Solid (non-translucent) card tone for popovers/modals — `surface` is a
  // frosted-glass tint meant to sit over the page gradient, which reads as
  // near-invisible once it's on its own inside a modal scrim.
  overlaySurface: '#0E2C47',
  borderLight: 'rgba(160,210,240,0.18)',
  borderGlow: '#7FC3E8',
  textMain: '#F2F7FA',
  textMuted: 'rgba(233,242,247,0.68)',
  ink: '#04121F',
  danger: '#F87171',
  dangerBg: 'rgba(239,68,68,0.14)',
};

export function getCitizenTheme(mode) {
  return mode === 'dark' ? CITIZEN_DARK : CITIZEN_LIGHT;
}

export const CITIZEN_FONTS = {
  serifItalic: 'InstrumentSerif_400Regular_Italic',
  sans: 'InstrumentSans_400Regular',
  sansMedium: 'InstrumentSans_500Medium',
  sansBold: 'InstrumentSans_600SemiBold',
};
