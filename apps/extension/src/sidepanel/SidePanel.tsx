import { useCallback, useEffect, useMemo, useState } from "react";
import { brand, Wordmark } from "@veya/shared";
import type { DetectedField } from "@veya/core";
import type { Request, Response } from "../shared/messages.js";
import { Button, Card, EmptyState, Pill, Spinner, type StatusTone } from "../ui/components.js";

interface DecisionView {
  action: "fill" | "generate" | "ask";
  value?: string;
  source: string;
  confidence: string;
  reason: string;
}

interface FieldView {
  field: DetectedField;
  decision: DecisionView;
  edited?: string;
}

interface ScanView {
  url: string;
  title: string;
  fields: DetectedField[];
  plan: FieldView[];
}

type Status = { provider: string; model?: string; healthy: boolean } | null;

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

export function SidePanel() {
  const [status, setStatus] = useState<Status>(null);
  const [scan, setScan] = useState<ScanView | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fillResult, setFillResult] = useState<{ ok: number; failed: number } | null>(null);

  useEffect(() => {
    void send<Status>({ kind: "status" }).then(setStatus).catch(() => setStatus(null));
  }, []);

  const analyze = useCallback(async () => {
    setBusy(true);
    setError(null);
    setFillResult(null);
    try {
      const s = await send<ScanView>({ kind: "scan" });
      setScan(s);
    } catch (e) {
      setError((e as Error).message);
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

  const fill = useCallback(async () => {
    if (!scan) return;
    setBusy(true);
    setError(null);
    const answers = scan.plan
      .filter((p) => {
        const v = p.edited ?? p.decision.value;
        return v !== undefined && v.trim().length > 0;
      })
      .map((p) => ({ elementId: p.field.elementId, value: (p.edited ?? p.decision.value) as string }));
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
    const groups: Record<string, FieldView[]> = { fill: [], generate: [], ask: [] };
    for (const p of scan.plan) groups[p.decision.action]?.push(p);
    return groups;
  }, [scan]);

  const totalFillable = useMemo(
    () =>
      scan?.plan.filter((p) => {
        const v = p.edited ?? p.decision.value;
        return v !== undefined && v.trim().length > 0;
      }).length ?? 0,
    [scan],
  );

  return (
    <div className="sp-root">
      <header className="sp-header">
        <span className="sp-title">
          <Wordmark size={15} />
        </span>
        <span className={`sp-status ${status?.healthy ? "sp-online" : "sp-offline"}`}>
          {status?.provider ?? "provider"}
          {status?.model ? ` · ${status.model}` : ""}
        </span>
      </header>

      {error ? <div className="sp-error">{error}</div> : null}

      {!scan ? (
        <Card>
          <EmptyState
            title="No application analyzed yet"
            detail="Open a job application page, then analyze it. Veya reads the form locally — nothing leaves your device unless you choose a cloud model."
          />
        </Card>
      ) : (
        <>
          <div className="sp-page">
            <span className="sp-page-title">{scan.title || "This page"}</span>
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
                    const value = p.edited ?? p.decision.value ?? "";
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
                      </div>
                    );
                  })}
                </section>
              );
            })}
        </>
      )}

      <div className="sp-actions">
        <Button variant="secondary" full onClick={analyze} disabled={busy} loading={busy}>
          {scan ? "Re-analyze" : "Analyze this page"}
        </Button>
      </div>

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
            {busy ? <Spinner /> : `Fill ${totalFillable} field${totalFillable === 1 ? "" : "s"}`}
          </Button>
        </div>
      )}
    </div>
  );
}
