import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { brand, Wordmark } from "@veya/shared";
import type { CareerProfile } from "@veya/profile";
import type { GenerateOutcome, PlanEntry, Request, Response, ScanState } from "../shared/messages.js";
import { Button, Card, EmptyState, Pill, Spinner, type StatusTone } from "../ui/components.js";
import { isProfileSet } from "../shared/resume.js";
import { SetupWizard } from "./setup-wizard.js";

type Status = { provider: string; model?: string; healthy: boolean; configured: boolean } | null;
type Permissions = { granted: boolean; origins: string[] } | null;

function send<T>(msg: Request): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    chrome.runtime.sendMessage(msg, (res: Response | undefined) => {
      const err = chrome.runtime.lastError;
      if (err) {
        reject(new Error(err.message));
        return;
      }
      if (!res?.ok) {
        reject(new Error(res?.error ?? "Veya failed to respond."));
        return;
      }
      resolve(res.result as T);
    });
  });
}

const toneFor = (action: string): StatusTone =>
  action === "fill" ? "accent" : action === "generate" ? "info" : "warning";

const actionLabel = (a: string): string =>
  a === "fill" ? "Ready" : a === "generate" ? "Draft" : "Review";

function entryValue(p: PlanEntry): string {
  return (p.draft ?? p.edited ?? p.decision.value ?? "").toString();
}

function GearIcon({ size = 14 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" aria-hidden="true" focusable="false">
      <path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon({ size = 14 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function XIcon({ size = 14 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

/* ─── Inline error banner ──────────────────────────────────────────── */

function ErrorBanner({ type, message, onGrant, onRetry, onDismiss }: {
  type: "permission" | "noForm" | "generic";
  message?: string;
  onGrant?: () => void;
  onRetry?: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className={`sp-banner sp-banner--${type === "permission" ? "warn" : "danger"}`}>
      <div className="sp-banner-text">
        {type === "permission" ? (
          <>
            <strong>Page access needed.</strong> Veya can't read forms on this site yet.
          </>
        ) : type === "noForm" ? (
          <>
            <strong>No form found.</strong> Navigate to a job application page.
          </>
        ) : (
          <strong>{message ?? "Something went wrong."}</strong>
        )}
      </div>
      <div className="sp-banner-actions">
        {type === "permission" && onGrant ? (
          <Button variant="ghost" size="sm" onClick={onGrant}>Grant access</Button>
        ) : null}
        {onRetry ? (
          <Button variant="ghost" size="sm" onClick={onRetry}>Retry</Button>
        ) : null}
        <button type="button" className="sp-banner-close" onClick={onDismiss} aria-label="Dismiss">
          <XIcon size={12} />
        </button>
      </div>
    </div>
  );
}

/* ─── Onboarding screen ────────────────────────────────────────────── */

type OnboardingStep = "provider" | "profile" | "permissions";

function Onboarding({
  status,
  profileSet,
  permissions,
  onProfileDone,
  onRequestPermissions,
}: {
  status: Status;
  profileSet: boolean;
  permissions: Permissions;
  onProfileDone: () => void;
  onRequestPermissions: () => void;
}) {
  const [step, setStep] = useState<OnboardingStep>("provider");

  const providerDone = status?.configured === true;
  const profileDone = profileSet;
  const permsDone = permissions?.granted === true;

  useEffect(() => {
    if (!providerDone) setStep("provider");
    else if (!profileDone) setStep("profile");
    else if (!permsDone) setStep("permissions");
  }, [providerDone, profileDone, permsDone]);

  return (
    <div className="onb-root">
      <div className="onb-hero">
        <Wordmark size={18} />
        <h1 className="onb-title">Welcome.</h1>
        <p className="onb-sub">Let's get Veya ready.</p>
      </div>

      {/* Step 1: Provider */}
      <div className={`onb-step${step === "provider" ? " onb-step--active" : providerDone ? " onb-step--done" : ""}`}>
        <div className="onb-step-head">
          <span className={`onb-step-num${providerDone ? " onb-step-num--done" : ""}`}>
            {providerDone ? <CheckIcon size={12} /> : "1"}
          </span>
          <span className="onb-step-label">Choose your AI provider</span>
        </div>
        {step === "provider" && !providerDone ? (
          <div className="onb-step-body">
            <p className="onb-step-detail">
              Veya uses an AI model to draft answers. Pick a local model (Ollama) or bring your own API key.
            </p>
            <Button variant="primary" full onClick={() => void chrome.runtime.openOptionsPage()}>
              Set up provider
            </Button>
            <p className="onb-step-hint">Configure in Settings, then come back — this step advances automatically.</p>
          </div>
        ) : null}
      </div>

      {/* Step 2: Profile */}
      <div className={`onb-step${step === "profile" ? " onb-step--active" : profileDone ? " onb-step--done" : ""}`}>
        <div className="onb-step-head">
          <span className={`onb-step-num${profileDone ? " onb-step-num--done" : ""}`}>
            {profileDone ? <CheckIcon size={12} /> : "2"}
          </span>
          <span className="onb-step-label">Set up your profile</span>
        </div>
        {step === "profile" && !profileDone ? (
          <div className="onb-step-body onb-step-body--flush">
            <SetupWizard onDone={onProfileDone} onSkip={onProfileDone} />
          </div>
        ) : null}
      </div>

      {/* Step 3: Permissions */}
      <div className={`onb-step${step === "permissions" ? " onb-step--active" : permsDone ? " onb-step--done" : ""}`}>
        <div className="onb-step-head">
          <span className={`onb-step-num${permsDone ? " onb-step-num--done" : ""}`}>
            {permsDone ? <CheckIcon size={12} /> : "3"}
          </span>
          <span className="onb-step-label">Page access</span>
        </div>
        {step === "permissions" && !permsDone ? (
          <div className="onb-step-body">
            <p className="onb-step-detail">
              Veya needs permission to read job application forms on any site. Chrome will ask you to confirm.
            </p>
            <Button variant="primary" full onClick={onRequestPermissions}>
              Grant access
            </Button>
          </div>
        ) : null}
      </div>

      {/* Status message */}
      {providerDone && profileDone ? (
        <div className="onb-ready">
          {permsDone ? (
            <p className="onb-ready-text">Veya is ready. Open a job page and click Analyze.</p>
          ) : (
            <p className="onb-ready-text">
              You can skip page access for now — Veya will ask when you first analyze a page.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}

/* ─── Main SidePanel ────────────────────────────────────────────────── */

export function SidePanel() {
  const [status, setStatus] = useState<Status>(null);
  const [permissions, setPermissions] = useState<Permissions>(null);
  const [scan, setScan] = useState<ScanState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fillResult, setFillResult] = useState<{ ok: number; failed: number } | null>(null);
  const [drafting, setDrafting] = useState<string | null>(null);
  const [profileReady, setProfileReady] = useState(false);
  const [profileSet, setProfileSet] = useState(false);
  const didInit = useRef(false);

  const refreshStatus = useCallback(() => {
    void send<Status>({ kind: "status" }).then(setStatus).catch(() => setStatus(null));
  }, []);

  const refreshPermissions = useCallback(() => {
    void send<Permissions>({ kind: "checkPermissions" }).then(setPermissions).catch(() => setPermissions(null));
  }, []);

  const refreshAll = useCallback(() => {
    refreshStatus();
    refreshPermissions();
    void send<CareerProfile>({ kind: "getProfile" })
      .then((p) => {
        setProfileSet(isProfileSet(p));
        setProfileReady(true);
      })
      .catch(() => setProfileReady(true));
  }, [refreshStatus, refreshPermissions]);

  // Initial load
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    refreshAll();
  }, [refreshAll]);

  // Auto-refresh when the side panel becomes visible (user returns from Options)
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        refreshAll();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [refreshAll]);

  const requestPermissions = useCallback(async () => {
    try {
      const result = await send<{ granted: boolean }>({ kind: "requestPermissions" });
      refreshPermissions();
      return result.granted;
    } catch {
      return false;
    }
  }, [refreshPermissions]);

  const analyze = useCallback(async () => {
    setBusy(true);
    setError(null);
    setFillResult(null);
    try {
      const s = await send<ScanState>({ kind: "scan" });
      setScan(s);
    } catch (e) {
      const msg = (e as Error).message;
      if (msg.includes("permission") || msg.includes("Cannot access")) {
        setError("permission");
      } else if (msg.includes("No active tab") || msg.includes("No form")) {
        setError("noForm");
      } else {
        setError(msg);
      }
    } finally {
      setBusy(false);
    }
  }, []);

  const onEdit = useCallback((elementId: string, value: string) => {
    setScan((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        plan: prev.plan.map((p) => (p.field.elementId === elementId ? { ...p, edited: value } : p)),
      };
    });
    void send({ kind: "setValue", elementId, value }).catch(() => undefined);
  }, []);

  const draft = useCallback(async (p: PlanEntry) => {
    setDrafting(p.field.elementId);
    setError(null);
    try {
      const out = await send<GenerateOutcome>({ kind: "generate", field: p.field });
      setScan((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          plan: prev.plan.map((e) =>
            e.field.elementId === p.field.elementId ? { ...e, draft: out.text, edited: out.text } : e,
          ),
        };
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDrafting(null);
    }
  }, []);

  const fill = useCallback(async () => {
    if (!scan) return;
    setBusy(true);
    setError(null);
    const answers = scan.plan
      .filter((p) => entryValue(p).trim().length > 0)
      .map((p) => ({ elementId: p.field.elementId, value: entryValue(p) }));
    try {
      const results = await send<Array<{ elementId: string; ok: boolean }>>({ kind: "fill", answers });
      const ok = results.filter((r) => r.ok).length;
      setFillResult({ ok, failed: results.length - ok });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, [scan]);

  const grouped = useMemo(() => {
    if (!scan) return null;
    const groups: Record<string, PlanEntry[]> = { fill: [], generate: [], ask: [] };
    for (const p of scan.plan) groups[p.decision.action]?.push(p);
    return groups;
  }, [scan]);

  const totalFillable = useMemo(
    () => scan?.plan.filter((p) => entryValue(p).trim().length > 0).length ?? 0,
    [scan],
  );

  const configured = status?.configured === true;

  const errorType = error === "permission" ? "permission" : error === "noForm" ? "noForm" : error ? "generic" : null;

  return (
    <div className="sp-root">
      <header className="sp-header">
        <span className="sp-title">
          <Wordmark size={15} />
        </span>
        <span className="sp-header-right">
          {configured ? (
            <span className={`sp-status ${status?.healthy ? "sp-online" : "sp-offline"}`}>
              {status?.provider ?? "provider"}
              {status?.model ? ` · ${status.model}` : ""}
            </span>
          ) : null}
          <button
            type="button"
            className="sp-settings"
            onClick={() => void chrome.runtime.openOptionsPage()}
            aria-label="Settings"
            title="Settings — model, profile, import/export"
          >
            <GearIcon />
          </button>
        </span>
      </header>

      {/* Inline error banner — dismissible, sits above content */}
      {errorType ? (
        <ErrorBanner
          type={errorType}
          message={errorType === "generic" ? (error ?? undefined) : undefined}
          onGrant={errorType === "permission" ? requestPermissions : undefined}
          onRetry={analyze}
          onDismiss={() => setError(null)}
        />
      ) : null}

      {!scan ? (
        profileReady ? (
          !configured || !profileSet ? (
            <Onboarding
              status={status}
              profileSet={profileSet}
              permissions={permissions}
              onProfileDone={() => {
                setProfileSet(true);
                refreshStatus();
              }}
              onRequestPermissions={requestPermissions}
            />
          ) : (
            <Card>
              <EmptyState
                title="No application analyzed yet"
                detail="Open a job application page, then analyze it. Veya reads the form locally — nothing leaves your device unless you choose a cloud model."
              />
            </Card>
          )
        ) : (
          <div className="sp-loading">
            <Spinner size={20} />
          </div>
        )
      ) : (
        <>
          <div className="sp-page">
            <span className="sp-page-title">
              {scan.job.role ? `${scan.job.role}` : scan.title || "This page"}
              {scan.job.company ? ` at ${scan.job.company}` : ""}
            </span>
            <span className="sp-page-url">{scan.url}</span>
          </div>

          {grouped &&
            (["fill", "generate", "ask"] as const).map((key) => {
              const items = grouped[key];
              if (!items?.length) return null;
              return (
                <section className="sp-section" key={key}>
                  <div className="sp-section-head">
                    <span className="sp-section-label">{actionLabel(key)}</span>
                    <span className="sp-section-count">{items.length}</span>
                  </div>
                  {items.map((p) => {
                    const value = entryValue(p);
                    return (
                      <div className="sp-field" key={p.field.elementId}>
                        <div className="sp-field-top">
                          <span className="sp-field-label">
                            {p.field.label} {p.field.required ? <span style={{ color: "var(--veya-accent)" }}>*</span> : null}
                          </span>
                          <Pill tone={toneFor(p.decision.action)}>{actionLabel(p.decision.action)}</Pill>
                        </div>
                        <textarea
                          className="sp-field-value"
                          rows={value.length > 60 ? 3 : 1}
                          value={value}
                          placeholder={p.decision.reason}
                          onChange={(e) => onEdit(p.field.elementId, e.target.value)}
                          spellCheck={false}
                        />
                        {p.decision.action === "generate" ? (
                          <Button variant="ghost" size="sm" onClick={() => void draft(p)} disabled={drafting !== null}>
                            {drafting === p.field.elementId ? "Drafting…" : p.draft ? "Regenerate" : "Draft with AI"}
                          </Button>
                        ) : null}
                      </div>
                    );
                  })}
                </section>
              );
            })}
        </>
      )}

      {configured && profileSet && (
        <div className="sp-actions">
          <Button variant="secondary" full onClick={analyze} disabled={busy} loading={busy}>
            {scan ? "Re-analyze" : "Analyze this page"}
          </Button>
        </div>
      )}

      {scan && (
        <div className="sp-footer">
          {fillResult ? (
            <div className="sp-note">
              Filled {fillResult.ok} field{fillResult.ok === 1 ? "" : "s"}
              {fillResult.failed > 0 ? `, ${fillResult.failed} skipped` : ""}. Review the page before submitting.
            </div>
          ) : (
            <div className="sp-note">
              {brand.tagline} Veya fills only what your verified profile supports. Sensitive fields always wait for your
              input.
            </div>
          )}
          <Button variant="primary" full onClick={fill} disabled={busy || totalFillable === 0} loading={busy}>
            {`Fill ${totalFillable} field${totalFillable === 1 ? "" : "s"}`}
          </Button>
        </div>
      )}
    </div>
  );
}
