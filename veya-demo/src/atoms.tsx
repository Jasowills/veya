import React from "react";
import { Easing, interpolate } from "remotion";
import { FONT } from "./fonts";
import { THEME } from "./theme";

export const Mono: React.FC<{
  size: number;
  weight?: number;
  color?: string;
  ls?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ size, weight = 500, color = THEME.ink, ls = 0.04, children, style }) => (
  <span
    style={{
      fontFamily: FONT.mono,
      fontSize: size,
      fontWeight: weight,
      color,
      letterSpacing: ls * size,
      ...style,
    }}
  >
    {children}
  </span>
);

export const SerifIt: React.FC<{
  size: number;
  color?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ size, color = THEME.ink, children, style }) => (
  <span
    style={{
      fontFamily: FONT.serif,
      fontStyle: "italic",
      fontSize: size,
      fontWeight: 400,
      color,
      letterSpacing: 0,
      ...style,
    }}
  >
    {children}
  </span>
);

export const Rule: React.FC<{ color?: string; style?: React.CSSProperties }> = ({
  color = THEME.rule,
  style,
}) => <div style={{ height: 1.5, background: color, ...style }} />;

export const typed = (frame: number, start: number, cpf: number, text: string): string => {
  const n = Math.floor((frame - start) * cpf);
  return text.slice(0, Math.max(0, Math.min(text.length, n)));
};

export const blink = (frame: number, speed = 12): boolean => Math.floor(frame / speed) % 2 === 0;

export const fadeIn = (frame: number, from: number, to: number): number =>
  interpolate(frame, [from, to], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.ease),
  });

export const fadeOut = (frame: number, from: number, to: number): number =>
  1 - fadeIn(frame, from, to);
