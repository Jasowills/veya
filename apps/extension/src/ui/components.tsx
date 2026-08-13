import type { ReactNode, ButtonHTMLAttributes, HTMLAttributes } from "react";
import { LogoMark, Wordmark, brand } from "@veya/shared";
import "./components.css";

export { LogoMark, Wordmark, brand };

export function Button({
  children,
  variant = "secondary",
  size = "md",
  full,
  loading,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  full?: boolean;
  loading?: boolean;
}) {
  return (
    <button
      className={`v-btn v-btn--${variant} v-btn--${size}${full ? " v-btn--full" : ""}`}
      disabled={rest.disabled || loading}
      {...rest}
    >
      {loading ? <span className="v-spinner" aria-hidden="true" /> : children}
    </button>
  );
}

export function Card({ children, className, ...rest }: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div className={`v-card${className ? ` ${className}` : ""}`} {...rest}>
      {children}
    </div>
  );
}

export type StatusTone = "accent" | "neutral" | "danger" | "warning" | "info";

export function Pill({ tone = "neutral", children }: { tone?: StatusTone; children: ReactNode }) {
  return <span className={`v-pill v-pill--${tone}`}>{children}</span>;
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="v-section-title">{children}</h2>;
}

export function EmptyState({ icon, title, detail }: { icon?: ReactNode; title: string; detail?: string }) {
  return (
    <div className="v-empty">
      {icon ? <div className="v-empty-icon">{icon}</div> : null}
      <p className="v-empty-title">{title}</p>
      {detail ? <p className="v-empty-detail">{detail}</p> : null}
    </div>
  );
}

export function Spinner({ size = 18 }: { size?: number }) {
  return <span className="v-spinner" style={{ width: size, height: size }} aria-hidden="true" />;
}
