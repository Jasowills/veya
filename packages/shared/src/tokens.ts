/**
 * Veya design tokens.
 *
 * The identity is "graphite + lime": warm near-black surfaces, off-white text,
 * and a single restrained lime accent. The aesthetic is calm, precise, and
 * technical — not generic AI SaaS.
 */

export const brand = {
  name: "Veya",
  tagline: "Your career, already understood.",
  positioning: "One profile. Every application.",
  pronunciation: "VAY-uh",
} as const;

export const color = {
  dark: {
    bg: "#0B0B0C",
    surface: "#121214",
    surfaceRaised: "#17171A",
    surfaceHover: "#1C1C20",
    border: "rgba(245, 244, 239, 0.08)",
    borderStrong: "rgba(245, 244, 239, 0.16)",
    text: "#F5F4EF",
    textSecondary: "#96969A",
    textTertiary: "#5F5F63",
    accent: "#C8FF5A",
    accentInk: "#0E1208",
    danger: "#F0654C",
    warning: "#E8A25A",
    info: "#7FB7F0",
  },
  light: {
    bg: "#F7F7F3",
    surface: "#FFFFFF",
    surfaceRaised: "#F1F1EC",
    border: "rgba(17, 17, 18, 0.10)",
    borderStrong: "rgba(17, 17, 18, 0.20)",
    text: "#111112",
    textSecondary: "#5F5F62",
    textTertiary: "#8A8A8E",
    accent: "#8EBF25",
    accentInk: "#FFFFFF",
    danger: "#C7442E",
    warning: "#A9681F",
    info: "#2E6FB5",
  },
} as const;

export const font = {
  sans: '"Instrument Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  mono: '"Geist Mono", ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
} as const;

export const typeScale = {
  display: { size: 56, line: 1.05, tracking: "-0.03em", weight: 600 },
  h1: { size: 40, line: 1.1, tracking: "-0.02em", weight: 600 },
  h2: { size: 28, line: 1.2, tracking: "-0.015em", weight: 600 },
  h3: { size: 20, line: 1.3, tracking: "-0.01em", weight: 600 },
  body: { size: 15, line: 1.6, tracking: "0em", weight: 400 },
  bodySmall: { size: 13, line: 1.5, tracking: "0em", weight: 400 },
  label: { size: 12, line: 1.4, tracking: "0.06em", weight: 500 },
  code: { size: 13, line: 1.6, tracking: "0em", weight: 400 },
} as const;

export const radius = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const space = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
  hero: 96,
} as const;

export const motion = {
  fast: 120,
  base: 200,
  slow: 320,
  ease: "cubic-bezier(0.22, 0.8, 0.2, 1)",
} as const;

export const shadow = {
  card: "0 1px 2px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)",
  pop: "0 2px 4px rgba(0,0,0,0.08), 0 16px 48px rgba(0,0,0,0.24)",
} as const;