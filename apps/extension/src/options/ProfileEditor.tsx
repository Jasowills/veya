import { useCallback, useState } from "react";
import type { CareerProfile, Experience, Skill } from "@veya/profile";
import { emptyProfile } from "@veya/profile";
import { Button, Card } from "../ui/components.js";

interface Props {
  profile: CareerProfile | null;
  onChange: (p: CareerProfile) => void;
}

function setIdentity(p: CareerProfile, patch: Record<string, string | undefined>): CareerProfile {
  return { ...p, identity: { firstName: "", lastName: "", ...(p.identity ?? {}), ...patch } };
}

function setContact(p: CareerProfile, patch: Record<string, string | undefined>): CareerProfile {
  return { ...p, contact: { email: "", ...(p.contact ?? {}), ...patch } };
}

function setPreferences(p: CareerProfile, patch: Partial<NonNullable<CareerProfile["preferences"]>>): CareerProfile {
  const base: NonNullable<CareerProfile["preferences"]> = {
    desiredRoles: [],
    industries: [],
    employmentTypes: ["full-time"],
    sponsorshipRequired: false,
    ...(p.preferences ?? {}),
    ...patch,
  };
  return { ...p, preferences: base };
}

function splitList(s: string): string[] {
  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

export function ProfileEditor({ profile, onChange }: Props) {
  const [tab, setTab] = useState<"basics" | "experience" | "skills" | "preferences">("basics");
  const p = profile ?? emptyProfile();

  const addExperience = useCallback(() => {
    const item: Experience = { id: crypto.randomUUID(), company: "", title: "", current: false, bullets: [], technologies: [] };
    onChange({ ...p, experience: [...p.experience, item] });
  }, [onChange, p]);

  const setExperience = useCallback(
    (i: number, patch: Partial<Experience>) => {
      onChange({ ...p, experience: p.experience.map((e, idx) => (idx === i ? { ...e, ...patch } : e)) });
    },
    [onChange, p],
  );

  const addSkill = useCallback(() => {
    const item: Skill = { name: "" };
    onChange({ ...p, skills: [...p.skills, item] });
  }, [onChange, p]);

  const setSkill = useCallback(
    (i: number, patch: Partial<Skill>) => {
      onChange({ ...p, skills: p.skills.map((s, idx) => (idx === i ? { ...s, ...patch } : s)) });
    },
    [onChange, p],
  );

  const identity = p.identity ?? { firstName: "", lastName: "" };
  const contact = p.contact ?? { email: "" };
  const prefs = p.preferences;

  return (
    <div className="pe-root">
      <div className="pe-tabs" role="tablist">
        {(["basics", "experience", "skills", "preferences"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            className={`pe-tab${tab === t ? " pe-tab--active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t[0]!.toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "basics" && (
        <div className="pe-panel">
          <section className="pe-group">
            <h3 className="pe-group-title">Identity</h3>
            <div className="pe-grid">
              <label className="pe-label">
                First name *
                <input
                  className="op-input"
                  value={identity.firstName}
                  onChange={(e) => onChange(setIdentity(p, { firstName: e.target.value }))}
                />
              </label>
              <label className="pe-label">
                Last name *
                <input
                  className="op-input"
                  value={identity.lastName}
                  onChange={(e) => onChange(setIdentity(p, { lastName: e.target.value }))}
                />
              </label>
              <label className="pe-label">
                Preferred name
                <input
                  className="op-input"
                  value={identity.preferredName ?? ""}
                  onChange={(e) => onChange(setIdentity(p, { preferredName: e.target.value }))}
                />
              </label>
            </div>
          </section>

          <section className="pe-group">
            <h3 className="pe-group-title">Contact</h3>
            <div className="pe-grid">
              <label className="pe-label">
                Email *
                <input
                  type="email"
                  className="op-input"
                  value={contact.email}
                  onChange={(e) => onChange(setContact(p, { email: e.target.value }))}
                />
              </label>
              <label className="pe-label">
                Phone
                <input
                  className="op-input"
                  value={contact.phone ?? ""}
                  onChange={(e) => onChange(setContact(p, { phone: e.target.value }))}
                />
              </label>
              <label className="pe-label">
                City
                <input
                  className="op-input"
                  value={contact.city ?? ""}
                  onChange={(e) => onChange(setContact(p, { city: e.target.value }))}
                />
              </label>
              <label className="pe-label">
                State / region
                <input
                  className="op-input"
                  value={contact.state ?? ""}
                  onChange={(e) => onChange(setContact(p, { state: e.target.value }))}
                />
              </label>
              <label className="pe-label">
                Country
                <input
                  className="op-input"
                  value={contact.country ?? ""}
                  onChange={(e) => onChange(setContact(p, { country: e.target.value }))}
                />
              </label>
              <label className="pe-label">
                LinkedIn URL
                <input
                  className="op-input"
                  value={contact.linkedinUrl ?? ""}
                  onChange={(e) => onChange(setContact(p, { linkedinUrl: e.target.value }))}
                />
              </label>
              <label className="pe-label">
                GitHub URL
                <input
                  className="op-input"
                  value={contact.githubUrl ?? ""}
                  onChange={(e) => onChange(setContact(p, { githubUrl: e.target.value }))}
                />
              </label>
              <label className="pe-label">
                Portfolio URL
                <input
                  className="op-input"
                  value={contact.portfolioUrl ?? ""}
                  onChange={(e) => onChange(setContact(p, { portfolioUrl: e.target.value }))}
                />
              </label>
            </div>
          </section>
        </div>
      )}

      {tab === "experience" && (
        <div className="pe-panel">
          <section className="pe-group">
            <div className="pe-group-head">
              <h3 className="pe-group-title">Experience</h3>
              <Button size="sm" onClick={addExperience}>
                Add role
              </Button>
            </div>
            {p.experience.length === 0 ? (
              <p className="op-note">No roles yet. Add your most recent first — Veya uses this to draft answers.</p>
            ) : (
              p.experience.map((e, i) => (
                <Card key={e.id} className="pe-exp-card">
                  <div className="pe-grid">
                    <label className="pe-label">
                      Company *
                      <input className="op-input" value={e.company} onChange={(ev) => setExperience(i, { company: ev.target.value })} />
                    </label>
                    <label className="pe-label">
                      Title *
                      <input className="op-input" value={e.title} onChange={(ev) => setExperience(i, { title: ev.target.value })} />
                    </label>
                    <label className="pe-label">
                      Location
                      <input className="op-input" value={e.location ?? ""} onChange={(ev) => setExperience(i, { location: ev.target.value })} />
                    </label>
                    <div className="pe-row">
                      <label className="pe-label">
                        Start
                        <input className="op-input" value={e.start ?? ""} placeholder="2020-01" onChange={(ev) => setExperience(i, { start: ev.target.value })} />
                      </label>
                      <label className="pe-label">
                        End
                        <input className="op-input" value={e.end ?? ""} placeholder="2023-06" disabled={e.current} onChange={(ev) => setExperience(i, { end: ev.target.value })} />
                      </label>
                    </div>
                    <label className="pe-check">
                      <input type="checkbox" checked={e.current} onChange={(ev) => setExperience(i, { current: ev.target.checked })} />
                      Current role
                    </label>
                  </div>
                  <label className="pe-label">
                    Summary
                    <textarea
                      className="op-input"
                      rows={3}
                      value={e.summary ?? ""}
                      onChange={(ev) => setExperience(i, { summary: ev.target.value })}
                    />
                  </label>
                </Card>
              ))
            )}
          </section>
        </div>
      )}

      {tab === "skills" && (
        <div className="pe-panel">
          <section className="pe-group">
            <div className="pe-group-head">
              <h3 className="pe-group-title">Skills</h3>
              <Button size="sm" onClick={addSkill}>
                Add skill
              </Button>
            </div>
            {p.skills.length === 0 ? (
              <p className="op-note">No skills yet. Add the ones you want recruiters to see.</p>
            ) : (
              p.skills.map((s, i) => (
                <div className="pe-skill-row" key={`${s.name}-${i}`}>
                  <input
                    className="op-input"
                    value={s.name}
                    placeholder="Skill name"
                    onChange={(ev) => setSkill(i, { name: ev.target.value })}
                  />
                  <select
                    className="op-select"
                    value={s.level ?? ""}
                    onChange={(ev) => setSkill(i, { level: ev.target.value === "" ? undefined : (ev.target.value as Skill["level"]) })}
                  >
                    <option value="">Level…</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>
              ))
            )}
          </section>
        </div>
      )}

      {tab === "preferences" && (
        <div className="pe-panel">
          <section className="pe-group">
            <h3 className="pe-group-title">Work preferences</h3>
            <div className="pe-grid">
              <label className="pe-label">
                Desired roles (comma separated)
                <input
                  className="op-input"
                  value={prefs?.desiredRoles?.join(", ") ?? ""}
                  onChange={(e) => onChange(setPreferences(p, { desiredRoles: splitList(e.target.value) }))}
                />
              </label>
              <label className="pe-label">
                Work arrangement
                <select
                  className="op-select"
                  value={prefs?.workArrangement ?? ""}
                  onChange={(e) =>
                    onChange(setPreferences(p, { workArrangement: e.target.value === "" ? undefined : (e.target.value as "on-site" | "hybrid" | "remote" | "any") }))
                  }
                >
                  <option value="">Not specified</option>
                  <option value="on-site">On-site</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="remote">Remote</option>
                  <option value="any">Any</option>
                </select>
              </label>
              <label className="pe-label">
                Availability date
                <input
                  type="date"
                  className="op-input"
                  value={prefs?.availabilityDate ?? ""}
                  onChange={(e) => onChange(setPreferences(p, { availabilityDate: e.target.value }))}
                />
              </label>
              <label className="pe-label">
                Minimum salary (USD)
                <input
                  type="number"
                  className="op-input"
                  value={prefs?.salary?.minimum ?? ""}
                  onChange={(e) =>
                    onChange(
                      setPreferences(p, {
                        salary: {
                          minimum: e.target.value === "" ? undefined : Number(e.target.value),
                          currency: "USD",
                          note: prefs?.salary?.note,
                        },
                      }),
                    )
                  }
                />
              </label>
              <label className="pe-label">
                Sponsorship required
                <select
                  className="op-select"
                  value={prefs?.sponsorshipRequired ? "yes" : "no"}
                  onChange={(e) => onChange(setPreferences(p, { sponsorshipRequired: e.target.value === "yes" }))}
                >
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </label>
            </div>
          </section>

          <section className="pe-group">
            <h3 className="pe-group-title">Writing style</h3>
            <div className="pe-grid">
              <label className="pe-label">
                Tone (comma separated)
                <input
                  className="op-input"
                  value={p.writingStyle?.tone?.join(", ") ?? ""}
                  onChange={(e) => {
                    const current = p.writingStyle ?? { tone: [], lengthPreference: "balanced" as const, avoid: [] };
                    onChange({ ...p, writingStyle: { ...current, tone: splitList(e.target.value) } });
                  }}
                />
              </label>
              <label className="pe-label">
                Length preference
                <select
                  className="op-select"
                  value={p.writingStyle?.lengthPreference ?? "balanced"}
                  onChange={(e) => {
                    const current = p.writingStyle ?? { tone: [], lengthPreference: "balanced" as const, avoid: [] };
                    onChange({
                      ...p,
                      writingStyle: { ...current, lengthPreference: e.target.value as "concise" | "balanced" | "detailed" },
                    });
                  }}
                >
                  <option value="concise">Concise</option>
                  <option value="balanced">Balanced</option>
                  <option value="detailed">Detailed</option>
                </select>
              </label>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
