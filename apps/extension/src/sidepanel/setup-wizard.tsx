import { useCallback, useRef, useState } from "react";
import type { CareerProfile } from "@veya/profile";
import type { Request, Response } from "../shared/messages.js";
import { Button, Spinner } from "../ui/components.js";
import { resumeFileToProfile } from "../shared/resume.js";

interface ExpDraft {
  id: string;
  company: string;
  title: string;
  start: string;
  end: string;
  current: boolean;
  bullets: string;
}

interface EduDraft {
  id: string;
  institution: string;
  degree: string;
}

interface Draft {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  linkedinUrl: string;
  githubUrl: string;
  websiteUrl: string;
  skills: string[];
  experience: ExpDraft[];
  education: EduDraft[];
}

function draftFromProfile(p: CareerProfile): Draft {
  return {
    firstName: p.identity?.firstName ?? "",
    lastName: p.identity?.lastName ?? "",
    email: p.contact?.email ?? "",
    phone: p.contact?.phone ?? "",
    city: p.contact?.city ?? "",
    linkedinUrl: p.contact?.linkedinUrl ?? "",
    githubUrl: p.contact?.githubUrl ?? "",
    websiteUrl: p.contact?.websiteUrl ?? "",
    skills: p.skills.map((s) => s.name),
    experience: p.experience.map((e) => ({
      id: e.id,
      company: e.company,
      title: e.title,
      start: e.start ?? "",
      end: e.end ?? "",
      current: e.current,
      bullets: e.bullets.join("\n"),
    })),
    education: p.education.map((e) => ({ id: e.id, institution: e.institution, degree: e.degree ?? "" })),
  };
}

function draftToProfile(d: Draft, seed: CareerProfile): CareerProfile {
  const identity =
    d.firstName.trim() && d.lastName.trim()
      ? { firstName: d.firstName.trim(), lastName: d.lastName.trim() }
      : undefined;
  const contact = d.email.trim()
    ? {
        email: d.email.trim(),
        phone: d.phone.trim() || undefined,
        city: d.city.trim() || undefined,
        linkedinUrl: d.linkedinUrl.trim() || undefined,
        githubUrl: d.githubUrl.trim() || undefined,
        websiteUrl: d.websiteUrl.trim() || undefined,
      }
    : undefined;
  return {
    ...seed,
    identity,
    contact,
    skills: d.skills.map((name) => ({ name: name.trim() })).filter((s) => s.name.length > 0),
    experience: d.experience
      .filter((e) => e.company.trim() && e.title.trim())
      .map((e) => ({
        id: e.id,
        company: e.company.trim(),
        title: e.title.trim(),
        start: e.start.trim() || undefined,
        end: e.current ? undefined : e.end.trim() || undefined,
        current: e.current,
        bullets: e.bullets.split("\n").map((b) => b.trim()).filter((b) => b.length > 0),
        technologies: [],
      })),
    education: d.education
      .filter((e) => e.institution.trim())
      .map((e) => ({
        id: e.id,
        institution: e.institution.trim(),
        degree: e.degree.trim() || undefined,
        honors: [],
      })),
  };
}

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

type Phase = "upload" | "parsing" | "review";

export function SetupWizard({ onDone, onSkip }: { onDone: () => void; onSkip: () => void }) {
  const [phase, setPhase] = useState<Phase>("upload");
  const [error, setError] = useState<string | null>(null);
  const [over, setOver] = useState(false);
  const [seed, setSeed] = useState<CareerProfile | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = useCallback(async (file: File) => {
    setPhase("parsing");
    setError(null);
    try {
      const profile = await resumeFileToProfile(file);
      setSeed(profile);
      setDraft(draftFromProfile(profile));
      setPhase("review");
    } catch (e) {
      setError((e as Error).message);
      setPhase("upload");
    }
  }, []);

  const confirm = useCallback(async () => {
    if (!seed || !draft) return;
    setSaving(true);
    setError(null);
    try {
      await send({ kind: "saveProfile", profile: draftToProfile(draft, seed) });
      onDone();
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  }, [seed, draft, onDone]);

  return (
    <div className="sw-root">
      {phase === "upload" ? (
        <div
          className={`sw-drop${over ? " sw-drop--over" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            const f = e.dataTransfer.files?.[0];
            if (f) void onFile(f);
          }}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.txt,application/pdf,text/plain"
            style={{ display: "none" }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onFile(f);
              e.target.value = "";
            }}
          />
          <div className="sw-drop-title">Set up Veya</div>
          <p className="sw-drop-detail">
            Upload your resume and Veya extracts your profile — name, contact, skills, experience, education. Then you
            confirm. Nothing leaves your device until you choose a cloud model.
          </p>
          <Button variant="primary" onClick={() => fileRef.current?.click()}>
            Choose resume file
          </Button>
          <p className="sw-drop-hint">Drop a PDF or .txt here, or</p>
          <Button variant="ghost" size="sm" onClick={onSkip}>
            Skip for now — set up manually later
          </Button>
          {error ? <div className="sp-error">{error}</div> : null}
        </div>
      ) : null}

      {phase === "parsing" ? (
        <div className="sw-parse">
          <Spinner size={22} />
          <p className="sw-parse-title">Extracting your profile…</p>
          <p className="sw-parse-detail">Reads the resume locally and maps it to Veya fields.</p>
        </div>
      ) : null}

      {phase === "review" && seed && draft ? (
        <div className="sw-review">
          <div className="sw-review-head">
            <span className="sw-review-kicker">Step 2 · confirm</span>
            <h2 className="sw-review-title">Your extracted profile</h2>
            <p className="sw-review-detail">
              Fields we couldn't find are marked with a dashed outline — add them if you want Veya to use them. Only
              what you confirm is saved.
            </p>
          </div>

          <section className="sw-group">
            <h3 className="sw-group-title">Name &amp; contact</h3>
            <div className="sw-grid">
              <label className="sw-field">
                <span className="sw-label">First name</span>
                <input
                  className={`sw-input${draft.firstName ? "" : " sw-input--empty"}`}
                  value={draft.firstName}
                  placeholder="e.g. Ada"
                  onChange={(e) => setDraft({ ...draft, firstName: e.target.value })}
                />
              </label>
              <label className="sw-field">
                <span className="sw-label">Last name</span>
                <input
                  className={`sw-input${draft.lastName ? "" : " sw-input--empty"}`}
                  value={draft.lastName}
                  placeholder="e.g. Lovelace"
                  onChange={(e) => setDraft({ ...draft, lastName: e.target.value })}
                />
              </label>
              <label className="sw-field">
                <span className="sw-label">Email</span>
                <input
                  className={`sw-input${draft.email ? "" : " sw-input--empty"}`}
                  type="email"
                  value={draft.email}
                  placeholder="you@example.com"
                  onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                />
              </label>
              <label className="sw-field">
                <span className="sw-label">Phone</span>
                <input
                  className={`sw-input${draft.phone ? "" : " sw-input--empty"}`}
                  value={draft.phone}
                  placeholder="+1 555 010 0200"
                  onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                />
              </label>
              <label className="sw-field">
                <span className="sw-label">City</span>
                <input
                  className={`sw-input${draft.city ? "" : " sw-input--empty"}`}
                  value={draft.city}
                  placeholder="e.g. London, UK"
                  onChange={(e) => setDraft({ ...draft, city: e.target.value })}
                />
              </label>
              <label className="sw-field">
                <span className="sw-label">LinkedIn</span>
                <input
                  className={`sw-input${draft.linkedinUrl ? "" : " sw-input--empty"}`}
                  value={draft.linkedinUrl}
                  placeholder="linkedin.com/in/…"
                  onChange={(e) => setDraft({ ...draft, linkedinUrl: e.target.value })}
                />
              </label>
              <label className="sw-field">
                <span className="sw-label">GitHub</span>
                <input
                  className={`sw-input${draft.githubUrl ? "" : " sw-input--empty"}`}
                  value={draft.githubUrl}
                  placeholder="github.com/…"
                  onChange={(e) => setDraft({ ...draft, githubUrl: e.target.value })}
                />
              </label>
              <label className="sw-field">
                <span className="sw-label">Website</span>
                <input
                  className={`sw-input${draft.websiteUrl ? "" : " sw-input--empty"}`}
                  value={draft.websiteUrl}
                  placeholder="yoursite.com"
                  onChange={(e) => setDraft({ ...draft, websiteUrl: e.target.value })}
                />
              </label>
            </div>
          </section>

          <section className="sw-group">
            <h3 className="sw-group-title">Skills</h3>
            {draft.skills.length > 0 ? (
              <div className="sw-chips">
                {draft.skills.map((s, i) => (
                  <span className="sw-chip" key={`${s}-${i}`}>
                    {s}
                    <button
                      type="button"
                      className="sw-chip-x"
                      aria-label={`Remove ${s}`}
                      onClick={() => setDraft({ ...draft, skills: draft.skills.filter((_, j) => j !== i) })}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="sw-group-empty">No skills detected — add the ones you want Veya to use.</p>
            )}
            <AddInline
              placeholder="Add a skill…"
              onAdd={(v) => setDraft({ ...draft, skills: [...draft.skills, v] })}
            />
          </section>

          <section className="sw-group">
            <h3 className="sw-group-title">
              Experience <span className="sw-group-count">{draft.experience.length}</span>
            </h3>
            {draft.experience.map((e, i) => (
              <div className="sw-exp" key={e.id}>
                <div className="sw-grid">
                  <label className="sw-field">
                    <span className="sw-label">Company</span>
                    <input
                      className={`sw-input${e.company ? "" : " sw-input--empty"}`}
                      value={e.company}
                      placeholder="Company"
                      onChange={(ev) =>
                        setDraft({
                          ...draft,
                          experience: draft.experience.map((x, j) => (j === i ? { ...x, company: ev.target.value } : x)),
                        })
                      }
                    />
                  </label>
                  <label className="sw-field">
                    <span className="sw-label">Title</span>
                    <input
                      className={`sw-input${e.title ? "" : " sw-input--empty"}`}
                      value={e.title}
                      placeholder="Role"
                      onChange={(ev) =>
                        setDraft({
                          ...draft,
                          experience: draft.experience.map((x, j) => (j === i ? { ...x, title: ev.target.value } : x)),
                        })
                      }
                    />
                  </label>
                </div>
                <div className="sw-grid sw-grid--3">
                  <label className="sw-field">
                    <span className="sw-label">Start</span>
                    <input
                      className={`sw-input${e.start ? "" : " sw-input--empty"}`}
                      value={e.start}
                      placeholder="2020-01"
                      onChange={(ev) =>
                        setDraft({
                          ...draft,
                          experience: draft.experience.map((x, j) => (j === i ? { ...x, start: ev.target.value } : x)),
                        })
                      }
                    />
                  </label>
                  <label className="sw-field">
                    <span className="sw-label">End</span>
                    <input
                      className={`sw-input${e.current || e.end ? "" : " sw-input--empty"}`}
                      value={e.end}
                      placeholder="2023-06"
                      disabled={e.current}
                      onChange={(ev) =>
                        setDraft({
                          ...draft,
                          experience: draft.experience.map((x, j) => (j === i ? { ...x, end: ev.target.value } : x)),
                        })
                      }
                    />
                  </label>
                  <label className="sw-field sw-check">
                    <input
                      type="checkbox"
                      checked={e.current}
                      onChange={(ev) =>
                        setDraft({
                          ...draft,
                          experience: draft.experience.map((x, j) => (j === i ? { ...x, current: ev.target.checked } : x)),
                        })
                      }
                    />
                    <span className="sw-label">Current</span>
                  </label>
                </div>
                <label className="sw-field">
                  <span className="sw-label">Highlights</span>
                  <textarea
                    className="sw-input sw-textarea"
                    rows={2}
                    value={e.bullets}
                    placeholder={"One bullet per line"}
                    onChange={(ev) =>
                      setDraft({
                        ...draft,
                        experience: draft.experience.map((x, j) => (j === i ? { ...x, bullets: ev.target.value } : x)),
                      })
                    }
                  />
                </label>
                <Button variant="ghost" size="sm" onClick={() => setDraft({ ...draft, experience: draft.experience.filter((_, j) => j !== i) })}>
                  Remove
                </Button>
              </div>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setDraft({
                  ...draft,
                  experience: [
                    ...draft.experience,
                    { id: crypto.randomUUID(), company: "", title: "", start: "", end: "", current: false, bullets: "" },
                  ],
                })
              }
            >
              + Add experience
            </Button>
          </section>

          <section className="sw-group">
            <h3 className="sw-group-title">
              Education <span className="sw-group-count">{draft.education.length}</span>
            </h3>
            {draft.education.map((e, i) => (
              <div className="sw-exp" key={e.id}>
                <div className="sw-grid">
                  <label className="sw-field">
                    <span className="sw-label">School</span>
                    <input
                      className={`sw-input${e.institution ? "" : " sw-input--empty"}`}
                      value={e.institution}
                      placeholder="University"
                      onChange={(ev) =>
                        setDraft({
                          ...draft,
                          education: draft.education.map((x, j) => (j === i ? { ...x, institution: ev.target.value } : x)),
                        })
                      }
                    />
                  </label>
                  <label className="sw-field">
                    <span className="sw-label">Degree</span>
                    <input
                      className={`sw-input${e.degree ? "" : " sw-input--empty"}`}
                      value={e.degree}
                      placeholder="BSc Computer Science"
                      onChange={(ev) =>
                        setDraft({
                          ...draft,
                          education: draft.education.map((x, j) => (j === i ? { ...x, degree: ev.target.value } : x)),
                        })
                      }
                    />
                  </label>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setDraft({ ...draft, education: draft.education.filter((_, j) => j !== i) })}>
                  Remove
                </Button>
              </div>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setDraft({
                  ...draft,
                  education: [...draft.education, { id: crypto.randomUUID(), institution: "", degree: "" }],
                })
              }
            >
              + Add education
            </Button>
          </section>

          {error ? <div className="sp-error">{error}</div> : null}

          <div className="sw-actions">
            <Button variant="ghost" onClick={() => setPhase("upload")}>
              Back
            </Button>
            <Button variant="primary" onClick={() => void confirm()} loading={saving}>
              Confirm &amp; continue
            </Button>
          </div>
          <p className="sw-footnote">
            Want more fields?{" "}
            <button
              type="button"
              className="sw-link"
              onClick={() => void chrome.runtime.openOptionsPage()}
            >
              Open full editor
            </button>
          </p>
        </div>
      ) : null}
    </div>
  );
}

function AddInline({ placeholder, onAdd }: { placeholder: string; onAdd: (v: string) => void }) {
  const [value, setValue] = useState("");
  const commit = () => {
    const v = value.trim();
    if (!v) return;
    onAdd(v);
    setValue("");
  };
  return (
    <input
      className="sw-input"
      value={value}
      placeholder={placeholder}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          commit();
        }
      }}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
    />
  );
}
