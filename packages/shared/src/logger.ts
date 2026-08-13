/**
 * Privacy-aware structured logger.
 *
 * Veya is local-first. Logs must never contain resumes, API keys, generated
 * answers, full job descriptions, or personal information. This logger strips
 * known-sensitive keys and truncates oversized values before emitting.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  ts: string;
  level: LogLevel;
  scope: string;
  msg: string;
  fields?: Record<string, unknown>;
}

const SENSITIVE_KEY_PATTERN =
  /(passw|token|secret|api[_ -]?key|key\b|authorization|resume|cover[_ -]?letter|answer|email|phone|ssn|address|birth|salary|profile|cookie)/i;

const MAX_FIELD_LENGTH = 512;

export function redactFields(fields?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!fields) return undefined;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (SENSITIVE_KEY_PATTERN.test(k)) {
      out[k] = "[redacted]";
      continue;
    }
    if (typeof v === "string" && v.length > MAX_FIELD_LENGTH) {
      out[k] = `${v.slice(0, MAX_FIELD_LENGTH)}…[truncated]`;
      continue;
    }
    out[k] = v;
  }
  return out;
}

export interface Logger {
  debug(scope: string, msg: string, fields?: Record<string, unknown>): void;
  info(scope: string, msg: string, fields?: Record<string, unknown>): void;
  warn(scope: string, msg: string, fields?: Record<string, unknown>): void;
  error(scope: string, msg: string, fields?: Record<string, unknown>): void;
  setSink(sink: (entry: LogEntry) => void): void;
}

export function createLogger(): Logger {
  let sink: ((entry: LogEntry) => void) | null = null;
  const emit = (level: LogLevel, scope: string, msg: string, fields?: Record<string, unknown>) => {
    const entry: LogEntry = {
      ts: new Date().toISOString(),
      level,
      scope,
      msg,
      fields: redactFields(fields),
    };
    if (sink) {
      sink(entry);
      return;
    }
    // eslint-disable-next-line no-console
    const fn = level === "debug" ? console.debug : level === "info" ? console.info : level === "warn" ? console.warn : console.error;
    fn(`[veya:${scope}]`, msg, entry.fields ?? "");
  };
  return {
    debug: (s, m, f) => emit("debug", s, m, f),
    info: (s, m, f) => emit("info", s, m, f),
    warn: (s, m, f) => emit("warn", s, m, f),
    error: (s, m, f) => emit("error", s, m, f),
    setSink: (s) => {
      sink = s;
    },
  };
}

export const logger = createLogger();