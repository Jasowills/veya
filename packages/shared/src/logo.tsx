import type { CSSProperties } from "react";
import { brand } from "./tokens.js";

export interface LogoMarkProps {
  size?: number;
  className?: string;
  style?: CSSProperties;
}

export function LogoMark({ size = 24, className, style }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      fill="none"
      className={className}
      style={style}
      aria-hidden="true"
      focusable="false"
    >
      <path d="M13 12 C 18 20, 25 30, 32 46" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      <path d="M32 12 L 32 46" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      <path d="M51 12 C 46 20, 39 30, 32 46" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      <path d="M32 47 L 32 51" stroke="var(--veya-accent, #c8ff5a)" strokeWidth="5" strokeLinecap="round" />
      <path
        d="M27.5 51 L 32 57 L 36.5 51"
        stroke="var(--veya-accent, #c8ff5a)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export interface WordmarkProps {
  size?: number;
  className?: string;
  style?: CSSProperties;
  mark?: boolean;
}

export function Wordmark({ size = 20, className, style, mark = true }: WordmarkProps) {
  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: mark ? 8 : 0,
        fontSize: size,
        lineHeight: 1,
        letterSpacing: "0.18em",
        fontWeight: 600,
        fontFamily: "var(--veya-font-sans, sans-serif)",
        color: "currentColor",
        ...style,
      }}
    >
      {mark ? <LogoMark size={Math.round(size * 1.1)} /> : null}
      <span style={{ transform: "translateY(0.02em)" }}>{brand.name.toUpperCase()}</span>
    </span>
  );
}