/**
 * Storage abstraction.
 *
 * The profile engine is storage-agnostic so it can be unit-tested in Node and
 * reused across environments:
 *  - extension: chrome.storage.local adapter
 *  - CLI: JSON file adapter
 *  - tests: in-memory adapter
 */

export interface KVStorage {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
}

export const PROFILE_KEY = "veya.profile.v1";
export const MEMORY_KEY = "veya.memory.v1";
export const SETTINGS_KEY = "veya.settings.v1";

/** In-memory store for tests and SSR contexts. */
export class MemoryStorage implements KVStorage {
  private map = new Map<string, string>();
  async get<T>(key: string): Promise<T | undefined> {
    const raw = this.map.get(key);
    return raw === undefined ? undefined : (JSON.parse(raw) as T);
  }
  async set<T>(key: string, value: T): Promise<void> {
    this.map.set(key, JSON.stringify(value));
  }
  async remove(key: string): Promise<void> {
    this.map.delete(key);
  }
}

export interface FileSystemLike {
  readFile(path: string): string | null;
  writeFile(path: string, data: string): void;
}

/** JSON-file-backed store for the CLI. The file is a map of storage key → value. */
export class FileStorage implements KVStorage {
  constructor(
    private readonly path: string,
    private readonly fs: FileSystemLike,
  ) {}

  private async readAll(): Promise<Record<string, unknown>> {
    const raw = this.fs.readFile(this.path);
    if (raw === null) return {};
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return {};
    }
    return {};
  }

  private async writeAll(all: Record<string, unknown>): Promise<void> {
    this.fs.writeFile(this.path, JSON.stringify(all, null, 2));
  }

  async get<T>(key: string): Promise<T | undefined> {
    const all = await this.readAll();
    const val = all[key];
    return val === undefined ? undefined : (val as T);
  }
  async set<T>(key: string, value: T): Promise<void> {
    const all = await this.readAll();
    all[key] = value;
    await this.writeAll(all);
  }
  async remove(key: string): Promise<void> {
    const all = await this.readAll();
    delete all[key];
    await this.writeAll(all);
  }
}