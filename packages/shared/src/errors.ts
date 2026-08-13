/**
 * Typed error surface for Veya.
 *
 * Errors shown to users are always human-readable. Raw developer detail lives
 * on `detail` and is only surfaced behind an advanced/debug view.
 */

export type VeyaErrorCode =
  | "provider_connection"
  | "provider_authentication"
  | "provider_not_found"
  | "provider_rate_limit"
  | "provider_timeout"
  | "provider_model_unavailable"
  | "storage_unavailable"
  | "invalid_profile"
  | "form_not_detected"
  | "field_value_conflict"
  | "document_generation"
  | "document_upload"
  | "local_companion_unavailable"
  | "internal";

export interface VeyaErrorOptions {
  code?: VeyaErrorCode;
  /** Human-readable message shown to the user. Never raw exception text. */
  userMessage: string;
  /** Developer detail. Never shown by default. */
  detail?: string;
  retryable?: boolean;
  cause?: unknown;
}

export class VeyaError extends Error {
  readonly code: VeyaErrorCode;
  readonly userMessage: string;
  readonly detail?: string;
  readonly retryable: boolean;

  constructor(opts: VeyaErrorOptions) {
    super(opts.userMessage, { cause: opts.cause });
    this.name = "VeyaError";
    this.code = opts.code ?? "internal";
    this.userMessage = opts.userMessage;
    this.detail = opts.detail;
    this.retryable = opts.retryable ?? false;
  }

  /** Safely convert any thrown value into a VeyaError. */
  static from(err: unknown, fallback: string): VeyaError {
    if (err instanceof VeyaError) return err;
    const message = err instanceof Error ? err.message : String(err);
    return new VeyaError({ code: "internal", userMessage: fallback, detail: message, cause: err });
  }
}