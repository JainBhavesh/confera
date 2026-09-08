// Design tokens ported from the "Modernist" design system used by
// Confera's mobile redesign (Claude Design project 011dd151-…, file
// `Confera - Mobile.dc.html`). Every screen should read colors/spacing/type
// from here instead of hardcoding hex values, so a future palette change is
// one file.

export const color = {
  bg: '#f3f2f2',
  surface: '#eae9e9',
  text: '#201e1d',
  divider: 'rgba(32, 30, 29, 0.4)',

  accent: '#ec3013',
  accent100: '#fff2ef',
  accent200: '#ffe0d9',
  accent300: '#ffc4b8',
  accent400: '#ff9783',
  accent500: '#ff563c',
  accent600: '#dd2b0f',
  accent700: '#ae1800',
  accent800: '#7c1405',
  accent900: '#4d170e',

  accent2: '#e15b47',
  accent2100: '#fff2ef',
  accent2200: '#ffe0da',
  accent2300: '#ffc4b9',
  accent2400: '#ff9784',
  accent2500: '#ef6853',
  accent2600: '#c94b39',
  accent2700: '#9e3526',
  accent2800: '#71261b',
  accent2900: '#471d16',

  neutral100: '#f8f4f4',
  neutral200: '#eae7e7',
  neutral300: '#d7d3d3',
  neutral400: '#bab6b6',
  neutral500: '#9b9797',
  neutral600: '#7d7979',
  neutral700: '#605d5d',
  neutral800: '#444141',
  neutral900: '#2d2b2b',

  // In-call surfaces — the design keeps this screen dark regardless of
  // theme, matching a native camera-app convention.
  callBg: '#141312',
  callSurface: '#201e1d',
  callSurfaceAlt: '#2d2b2b',
  callText: '#f3f2f2',

  white: '#ffffff'
} as const;

function withAlpha(hex: string, alpha: number) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const textMuted = (alpha = 0.6) => withAlpha(color.text, alpha);
export const callTextMuted = (alpha = 0.6) => withAlpha(color.callText, alpha);

export const space = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  6: 24,
  8: 32
} as const;

// The design is deliberately square — no rounded corners anywhere.
export const radius = 0;

export const font = {
  heading: 'Archivo_800ExtraBold',
  headingBold: 'Archivo_700Bold',
  body: 'Archivo_400Regular',
  bodySemiBold: 'Archivo_600SemiBold'
} as const;

// Mobile control sizing from the design's spec table.
export const control = {
  input: 52,
  button: 52,
  touchMin: 44,
  callControl: 56,
  tabBar: 60
} as const;

export const theme = { color, space, radius, font, control, textMuted, callTextMuted };
export type Theme = typeof theme;
