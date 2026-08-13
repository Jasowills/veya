/**
 * `veya profile` — manage the local profile store.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { CareerProfileSchema, emptyProfile, type CareerProfile } from "@veya/profile";
import { openStore } from "./store.js";

export async function profileInit(storeDir: string): Promise<void> {
  const { repo, dir } = openStore(storeDir);
  await repo.saveProfile(emptyProfile());
  console.log(`initialized an empty profile at ${dir}/profile.json`);
  console.log("edit fields with: veya profile import <file.json>   (or edit the file directly)");
}

export async function profileShow(storeDir: string): Promise<void> {
  const { repo } = openStore(storeDir);
  const profile = await repo.loadProfile();
  console.log(JSON.stringify(profile, null, 2));
}

export async function profileExport(storeDir: string, out?: string): Promise<void> {
  const { repo } = openStore(storeDir);
  const json = await repo.exportProfile();
  if (out) {
    writeFileSync(out, json);
    console.log(`profile exported to ${out}`);
  } else {
    process.stdout.write(json);
  }
}

export async function profileImport(storeDir: string, file: string): Promise<void> {
  const { repo } = openStore(storeDir);
  const json = readFileSync(file, "utf8");
  const parsed = JSON.parse(json) as { profile?: unknown } | CareerProfile;
  let profile: CareerProfile;
  if (parsed && typeof parsed === "object" && !("profile" in parsed)) {
    profile = CareerProfileSchema.parse(parsed);
    await repo.saveProfile(profile);
  } else {
    profile = await repo.importProfile(json);
  }
  console.log(`imported profile (${profile.identity?.firstName ?? "?"} ${profile.identity?.lastName ?? ""}) with ${profile.experience.length} experience entries.`);
}
