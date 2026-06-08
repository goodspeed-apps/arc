// Arc-specific design tokens layered on top of the base theme
export const ARC_TOKENS = {
  // Typography
  fontDisplay: 'JosefinSans_700Bold' as const,
  fontDisplaySemiBold: 'JosefinSans_600SemiBold' as const,
  fontDisplayRegular: 'JosefinSans_400Regular' as const,
  fontBody: 'Manrope_400Regular' as const,
  fontBodyMedium: 'Manrope_500Medium' as const,
  fontBodySemiBold: 'Manrope_600SemiBold' as const,
  fontBodyBold: 'Manrope_700Bold' as const,

  // Sizes
  dayCountSize: 48,
  sectionLabelSize: 12,
  cardTitleSize: 16,
  statValueSize: 28,
  bodySize: 14,
  captionSize: 11,

  // Spacing (mapped from spacing constants)
  cardPadding: 16,
  cardGap: 8,
  sectionGap: 24,
  itemHeight: 56,
  itemGap: 8,

  // Shape, zero rounding per design spec
  cardRadius: 0,
  buttonRadius: 0,
  inputRadius: 0,
  pillRadius: 4,

  // Animation durations
  hardCut: 180,
  flashHold: 80,
  flashFade: 300,
  digitFlip: 120,
  checkDraw: 150,
  strokeDraw: 200,
  launchFade: 400,
  progressBar: 600,
} as const;

export type ArcTokens = typeof ARC_TOKENS;
