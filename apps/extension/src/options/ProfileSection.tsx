import { useCallback, useRef, useState } from "react";
import type { CareerProfile, Experience, Skill } from "@veya/profile";
import { emptyProfile } from "@veya/profile";
import { Button, Card } from "../ui/components.js";
import { mergeResumeIntoProfile, resumeFileToProfile } from "../shared/resume.js";
import { ProfileEditor } from "./ProfileEditor.js";

interface Props {
  profile: CareerProfile | null;
  onChange: (p: CareerProfile) => void;
  onSave: () => void;
  onNotice: (msg: string | null) => void;
}

export function ProfileSection({ profile, onChange, onSave, onNotice }: Props) {
  const [editing, setEditing] = useState(false);
  const [resumeBusy, setResumeBusy] = useState(false);
  const resumeRef = useRef<HTMLInputElement>(null);

  const p = profile ?? emptyProfile();
  const hasData = !!(p.identity?.firstName || p.experience.length || p.skills.length);

  const importResume = useCallback(
    async (file: File) => {
      setResumeBusy(true);
      try {
        const seed = await resumeFileToProfile(file);
        onChange(profile ? mergeResumeIntoProfile(profile, seed) : seed);
        setEditing(false);
        onNotice("Resume parsed — review below, then save.");
      } catch (e) {
        onNotice(`Could not read resume: ${(e as Error).message}`);
      } finally {
        setResumeBusy(false);
      }
      setTimeout(() => onNotice(null), 6000);
    },
    [onChange, onNotice, profile],
  );

  if (!hasData && !editing) {
    return (
      <section className="op-section">
        <h2 className="op-section-title">Career profile</h2>
        <Card className="op-resume-drop">
          <p className="op-resume-drop-title">Upload your resume to get started</p>
          <p className="op-note">Veya will extract your experience, skills, and contact info automatically.</p>
          <input
            ref={resumeRef}
            type="file"
            accept=".pdf,.txt"
            style={{ display: "none" }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void importResume(f);
              e.target.value = "";
            }}
          />
          <Button variant="primary" full onClick={() => resumeRef.current?.click()} loading={resumeBusy}>
            {resumeBusy ? "Parsing…" : "Upload resume (PDF or TXT)"}
          </Button>
          <Button variant="ghost" full onClick={() => setEditing(true)}>
            Fill in manually
          </Button>
        </Card>
      </section>
    );
  }

  if (editing) {
    return (
      <section className="op-section">
        <div className="op-row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
          <h2 className="op-section-title" style={{ margin: 0 }}>Career profile</h2>
          <div className="op-row" style={{ gap: 8 }}>
            <Button variant="ghost" size="sm" onClick={() => resumeRef.current?.click()} loading={resumeBusy}>
              {resumeBusy ? "Parsing…" : "Upload resume"}
            </Button>
            <input
              ref={resumeRef}
              type="file"
              accept=".pdf,.txt"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void importResume(f);
                e.target.value = "";
              }}
            />
            {hasData ? (
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                Done
              </Button>
            ) : null}
          </div>
        </div>
        <ProfileEditor profile={profile} onChange={onChange} />
        <Button variant="primary" onClick={() => { onSave(); setEditing(false); }}>
          Save profile
        </Button>
      </section>
    );
  }

  return (
    <section className="op-section">
      <div className="op-row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
        <h2 className="op-section-title" style={{ margin: 0 }}>Career profile</h2>
        <div className="op-row" style={{ gap: 8 }}>
          <Button variant="ghost" size="sm" onClick={() => resumeRef.current?.click()} loading={resumeBusy}>
            {resumeBusy ? "Parsing…" : "Upload resume"}
          </Button>
          <input
            ref={resumeRef}
            type="file"
            accept=".pdf,.txt"
            style={{ display: "none" }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void importResume(f);
              e.target.value = "";
            }}
          />
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
            Edit
          </Button>
        </div>
      </div>

      {/* ── Summary cards ──────────────────────────────────────── */}
      {p.identity?.firstName ? (
        <Card className="pe-summary-card">
          <div className="pe-summary-label">Name</div>
          <div className="pe-summary-value">{[p.identity.firstName, p.identity.lastName].filter(Boolean).join(" ")}</div>
          {p.contact?.email ? <div className="pe-summary-detail">{p.contact.email}</div> : null}
          {p.contact?.phone ? <div className="pe-summary-detail">{p.contact.phone}</div> : null}
          {[p.contact?.city, p.contact?.state, p.contact?.country].filter(Boolean).length > 0 ? (
            <div className="pe-summary-detail">
              {[p.contact?.city, p.contact?.state, p.contact?.country].filter(Boolean).join(", ")}
            </div>
          ) : null}
        </Card>
      ) : null}

      {p.experience.length > 0 ? (
        <Card className="pe-summary-card">
          <div className="pe-summary-label">Experience</div>
          {p.experience.map((e) => (
            <div key={e.id} className="pe-exp-row">
              <div className="pe-exp-main">
                <span className="pe-exp-title">{e.title || "Untitled role"}</span>
                {e.company ? <span className="pe-exp-company"> · {e.company}</span> : null}
              </div>
              <div className="pe-exp-meta">
                {[e.location, [e.start, e.end ?? (e.current ? "present" : "")].filter(Boolean).join(" – ")]
                  .filter(Boolean)
                  .join(" · ")}
              </div>
            </div>
          ))}
        </Card>
      ) : null}

      {p.skills.length > 0 ? (
        <Card className="pe-summary-card">
          <div className="pe-summary-label">Skills</div>
          <div className="pe-skill-chips">
            {p.skills.filter((s) => s.name).map((s, i) => (
              <span key={`${s.name}-${i}`} className="pe-skill-chip">
                {s.name}{s.level ? ` · ${s.level}` : ""}
              </span>
            ))}
          </div>
        </Card>
      ) : null}

      {p.preferences?.desiredRoles?.length ? (
        <Card className="pe-summary-card">
          <div className="pe-summary-label">Preferences</div>
          <div className="pe-summary-value">{p.preferences.desiredRoles.join(", ")}</div>
          {p.preferences.workArrangement ? (
            <div className="pe-summary-detail">{p.preferences.workArrangement}</div>
          ) : null}
        </Card>
      ) : null}
    </section>
  );
}
