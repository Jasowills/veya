/**
 * Controlled memory.
 *
 * Memory items are explicitly typed. A USER_CORRECTION only becomes a
 * PREFERENCE after the user confirms ("Remember this?"). Nothing is written to
 * memory implicitly.
 */

import { MEMORY_KEY, type KVStorage } from "./storage.js";

export const MEMORY_KINDS = [
  "VERIFIED_FACT",
  "PREFERENCE",
  "SAVED_ANSWER",
  "USER_CORRECTION",
  "GENERATED_CONTEXT",
] as const;

export type MemoryKind = (typeof MEMORY_KINDS)[number];

export interface MemoryItem {
  id: string;
  kind: MemoryKind;
  /** Short canonical key, e.g. "work-arrangement". */
  key: string;
  value: string;
  /** Where the item came from, e.g. "profile", "resume-parse", "user". */
  source?: string;
  /** User corrections are unconfirmed until the user says yes. */
  confirmed: boolean;
  createdAt: number;
}

export class MemoryStore {
  constructor(private readonly items: MemoryItem[]) {}

  get all(): MemoryItem[] {
    return this.items;
  }

  find(key: string, kind?: MemoryKind): MemoryItem | undefined {
    return this.items.find((i) => i.key === key && (kind === undefined || i.kind === kind));
  }

  add(item: Omit<MemoryItem, "id" | "createdAt">): MemoryItem {
    const entry: MemoryItem = { ...item, id: cryptoId(), createdAt: Date.now() };
    this.items.push(entry);
    return entry;
  }

  confirm(id: string): MemoryItem | undefined {
    const item = this.items.find((i) => i.id === id);
    if (item) item.confirmed = true;
    return item;
  }

  /** Promote a confirmed correction to a canonical preference. */
  promoteCorrection(id: string, key: string): MemoryItem | undefined {
    const item = this.items.find((i) => i.id === id);
    if (!item || item.kind !== "USER_CORRECTION") return undefined;
    item.kind = "PREFERENCE";
    item.key = key;
    item.confirmed = true;
    return item;
  }
}

export async function loadMemory(storage: KVStorage): Promise<MemoryStore> {
  const raw = await storage.get<MemoryItem[]>(MEMORY_KEY);
  return new MemoryStore(Array.isArray(raw) ? raw : []);
}

export async function persistMemory(storage: KVStorage, store: MemoryStore): Promise<void> {
  await storage.set(MEMORY_KEY, store.all);
}

function cryptoId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export const memoryId = cryptoId;