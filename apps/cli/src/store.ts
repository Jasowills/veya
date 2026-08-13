/**
 * Default store location and helpers to open the CLI's profile store.
 */

import { homedir } from "node:os";
import { join } from "node:path";
import { FileStorage, ProfileRepository } from "@veya/profile";
import { nodeFs } from "./fs.js";

export const DEFAULT_DIR = join(homedir(), ".veya");
export const PROFILE_FILE = join(DEFAULT_DIR, "profile.json");

export interface CliStore {
  dir: string;
  repo: ProfileRepository;
}

export function openStore(dir: string = DEFAULT_DIR): CliStore {
  const file = join(dir, "profile.json");
  return { dir, repo: new ProfileRepository(new FileStorage(file, nodeFs)) };
}
