/**
 * ProfileRepository — the single entry point for reading and mutating the
 * user's career profile, memory, and settings through a KVStorage backend.
 */

import { CareerProfileSchema, emptyProfile, type CareerProfile } from "./schema.js";
import { MEMORY_KEY, PROFILE_KEY, SETTINGS_KEY, type KVStorage } from "./storage.js";
import { type MemoryStore, loadMemory } from "./memory.js";

export interface VeyaSettings {
  /** Persisted provider selection. */
  providerId?: string;
  model?: string;
  /** API keys are NOT stored here; they live in chrome.storage (extension) or an env/secret file (CLI). */
  autofillOnDetect?: boolean;
  generateAnswers?: boolean;
  /** Auto-confirm "remember this answer?" is never defaulted on. */
  rememberAnswers?: boolean;
  telemetry?: "none" | "local";
}

export interface ProfileUpdate {
  patch: Partial<CareerProfile>;
}

export class ProfileRepository {
  constructor(
    private readonly storage: KVStorage,
    private readonly settingsDefaults: VeyaSettings = {},
  ) {}

  async loadProfile(): Promise<CareerProfile> {
    const raw = await this.storage.get<unknown>(PROFILE_KEY);
    if (raw === undefined) return emptyProfile();
    const parsed = CareerProfileSchema.safeParse(raw);
    if (!parsed.success) return emptyProfile();
    return parsed.data;
  }

  async saveProfile(profile: CareerProfile): Promise<void> {
    const stamped = CareerProfileSchema.parse({ ...profile, updatedAt: Date.now() });
    await this.storage.set(PROFILE_KEY, stamped);
  }

  async updateProfile(patch: Partial<CareerProfile>): Promise<CareerProfile> {
    const current = await this.loadProfile();
    const next = CareerProfileSchema.parse({ ...current, ...patch, updatedAt: Date.now() });
    await this.storage.set(PROFILE_KEY, next);
    return next;
  }

  async deleteProfile(): Promise<void> {
    await this.storage.remove(PROFILE_KEY);
  }

  /** JSON export for the "export your data" action. */
  async exportProfile(): Promise<string> {
    const profile = await this.loadProfile();
    const memory = await loadMemory(this.storage);
    return JSON.stringify({ app: "veya", version: 1, exportedAt: Date.now(), profile, memory }, null, 2);
  }

  async importProfile(json: string): Promise<CareerProfile> {
    const parsed = JSON.parse(json) as { profile?: unknown };
    if (!parsed.profile) throw new Error("import_payload_missing_profile");
    const profile = CareerProfileSchema.parse(parsed.profile);
    await this.storage.set(PROFILE_KEY, { ...profile, updatedAt: Date.now() });
    return profile;
  }

  async loadSettings(): Promise<VeyaSettings> {
    const stored = await this.storage.get<Partial<VeyaSettings>>(SETTINGS_KEY);
    return { ...this.settingsDefaults, ...stored };
  }

  async saveSettings(settings: VeyaSettings): Promise<VeyaSettings> {
    const next = { ...this.settingsDefaults, ...settings };
    await this.storage.set(SETTINGS_KEY, next);
    return next;
  }

  async memory(): Promise<MemoryStore> {
    return loadMemory(this.storage);
  }

  /** Destructive reset of all Veya data. Caller must confirm with the user. */
  async deleteAll(): Promise<void> {
    await this.storage.remove(PROFILE_KEY);
    await this.storage.remove(MEMORY_KEY);
    await this.storage.remove(SETTINGS_KEY);
  }
}