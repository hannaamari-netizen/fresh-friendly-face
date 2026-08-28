#!/usr/bin/env node
/**
 * Safeguard: the Fajr Adhan recording is pinned and must never change.
 * Fails the build/release pipeline if ADHAN_FAJR_URL is modified or removed.
 * Run: bun run check:fajr-adhan
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const PINNED_FAJR_ADHAN_URL = "https://www.islamcan.com/audio/adhan/azan2.mp3";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = readFileSync(join(root, "src/lib/adhan.ts"), "utf8");

const match = src.match(/ADHAN_FAJR_URL\s*=\s*"([^"]+)"/);

if (!match) {
  console.error("❌ ADHAN_FAJR_URL is missing from src/lib/adhan.ts — the Fajr Adhan must be defined.");
  process.exit(1);
}

if (match[1] !== PINNED_FAJR_ADHAN_URL) {
  console.error("❌ Fajr Adhan URL changed!");
  console.error(`   expected (pinned): ${PINNED_FAJR_ADHAN_URL}`);
  console.error(`   found:             ${match[1]}`);
  console.error("   The Fajr Adhan recording is a deliberate product choice and must not change.");
  process.exit(1);
}

// Also make sure no other adhan constant redefines the Fajr source elsewhere.
const indexSrc = readFileSync(join(root, "src/routes/index.tsx"), "utf8");
if (/const\s+ADHAN_FAJR_URL\s*=/.test(indexSrc)) {
  console.error("❌ ADHAN_FAJR_URL is redefined in src/routes/index.tsx — import it from src/lib/adhan.ts instead.");
  process.exit(1);
}

console.log("✅ Fajr Adhan URL is pinned and unchanged:", PINNED_FAJR_ADHAN_URL);
