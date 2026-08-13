import { describe, it, expect } from "vitest";
import { resolveField } from "../src/resolve.js";
import { emptyProfile, type CareerProfile } from "../src/schema.js";
import { MemoryStorage, PROFILE_KEY } from "../src/storage.js";
import { ProfileRepository } from "../src/repository.js";
import { MemoryStore, persistMemory } from "../src/memory.js";

function profileWith(overrides: Partial<CareerProfile>): CareerProfile {
  return { ...emptyProfile(), ...overrides };
}

describe("resolveField", () => {
  const profile = profileWith({
    identity: { firstName: "Ada", lastName: "Lovelace", preferredName: "Ada" },
    contact: { email: "ada@example.com", phone: "+1-555-0100" },
    experience: [
      { id: "e1", company: "Analytical Engine Co", title: "Senior Engineer", start: "2020", current: true, bullets: [], technologies: [] },
    ],
    preferences: {
      desiredRoles: [],
      industries: [],
      workArrangement: "hybrid",
      salary: { minimum: 120000, currency: "USD" },
      sponsorshipRequired: true,
      relocation: { willing: true, regions: [] },
      workAuthorization: { status: "authorized-to-work" },
      employmentTypes: ["full-time"],
    },
  });

  it("resolves identity fields", () => {
    expect(resolveField(profile, "FIRST_NAME")).toMatchObject({ value: "Ada", source: "verified_profile", confidence: "high" });
    expect(resolveField(profile, "LAST_NAME")).toMatchObject({ value: "Lovelace", confidence: "high" });
    expect(resolveField(profile, "EMAIL")).toMatchObject({ value: "ada@example.com", confidence: "high" });
    expect(resolveField(profile, "PHONE")).toMatchObject({ value: "+1-555-0100", confidence: "high" });
  });

  it("resolves current role from most recent/current experience", () => {
    expect(resolveField(profile, "CURRENT_TITLE")).toMatchObject({ value: "Senior Engineer", confidence: "high" });
    expect(resolveField(profile, "CURRENT_COMPANY")).toMatchObject({ value: "Analytical Engine Co", confidence: "high" });
  });

  it("resolves sensitive fields only from explicit preferences", () => {
    const auth = resolveField(profile, "WORK_AUTHORIZATION");
    expect(auth.source).toBe("preference");
    expect(auth.value).toBeDefined();

    const sponsor = resolveField(profile, "SPONSORSHIP_REQUIRED");
    expect(sponsor.value).toBe("yes");

    const salary = resolveField(profile, "SALARY_EXPECTATION");
    expect(salary.value).toBe("120000");

    const relocation = resolveField(profile, "RELOCATION_WILLING");
    expect(relocation.value).toBe("yes");
  });

  it("returns none-confidence when sensitive data is absent (no inference)", () => {
    const bare = profileWith({});
    expect(resolveField(bare, "WORK_AUTHORIZATION")).toMatchObject({ value: undefined, confidence: "none" });
    expect(resolveField(bare, "SPONSORSHIP_REQUIRED")).toMatchObject({ value: undefined, confidence: "none" });
    expect(resolveField(bare, "GENDER")).toMatchObject({ value: undefined, confidence: "none" });
    expect(resolveField(bare, "DISABILITY")).toMatchObject({ value: undefined, confidence: "none" });
  });
});

describe("ProfileRepository", () => {
  it("round-trips a profile through storage", async () => {
    const storage = new MemoryStorage();
    const repo = new ProfileRepository(storage);
    expect((await repo.loadProfile()).experience).toEqual([]);

    const profile = profileWith({ identity: { firstName: "Grace", lastName: "Hopper" } });
    await repo.saveProfile(profile);
    const loaded = await repo.loadProfile();
    expect(loaded.identity?.firstName).toBe("Grace");
  });

  it("supports export/import", async () => {
    const storage = new MemoryStorage();
    const repo = new ProfileRepository(storage);
    await repo.saveProfile(profileWith({ identity: { firstName: "Grace", lastName: "Hopper" } }));
    const exported = await repo.exportProfile();
    expect(exported).toContain("veya");

    const storage2 = new MemoryStorage();
    const repo2 = new ProfileRepository(storage2);
    const imported = await repo2.importProfile(exported);
    expect(imported.identity?.lastName).toBe("Hopper");
  });

  it("deleteAll clears everything", async () => {
    const storage = new MemoryStorage();
    const repo = new ProfileRepository(storage);
    await repo.saveProfile(profileWith({ identity: { firstName: "G", lastName: "H" } }));
    await repo.deleteAll();
    expect((await repo.loadProfile()).identity).toBeUndefined();
    expect(await storage.get(PROFILE_KEY)).toBeUndefined();
  });

  it("memory persists and promotes corrections only after explicit confirmation", async () => {
    const storage = new MemoryStorage();
    const ms = new MemoryStore([]);
    const corr = ms.add({ kind: "USER_CORRECTION", key: "temp", value: "remote", source: "user", confirmed: false });
    expect(ms.find("temp")?.confirmed).toBe(false);

    await persistMemory(storage, ms);
    const { loadMemory } = await import("../src/memory.js");
    const reloaded = await loadMemory(storage);
    expect(reloaded.find("temp")?.kind).toBe("USER_CORRECTION");

    const promoted = reloaded.promoteCorrection(corr.id, "work-arrangement");
    expect(promoted?.kind).toBe("PREFERENCE");
    expect(promoted?.confirmed).toBe(true);
  });
});