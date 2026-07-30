#!/usr/bin/env node
/**
 * Validates App Store Connect copy against Apple's character limits.
 *
 * Usage: bun run mobile:check-copy
 *
 * Reads mobile/APP_STORE_CONNECT_COPY.md and checks every field that Apple
 * enforces a hard limit on. Exits non-zero if anything is over the limit.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const COPY_FILE = resolve(root, "mobile/APP_STORE_CONNECT_COPY.md");

// Apple App Store Connect limits (characters, per locale)
const LIMITS = {
  appName: 30,
  subtitle: 30,
  promotionalText: 170,
  keywords: 100,
  whatsNew: 4000,
  description: 4000,
};

const APP_NAME = "Haya Al-Salat";

if (!existsSync(COPY_FILE)) {
  console.error(`❌ Not found: ${COPY_FILE}`);
  process.exit(1);
}

const md = readFileSync(COPY_FILE, "utf8");

/** Returns the text of the first ```text fenced block after a heading match. */
function blockAfter(headingRegex) {
  const m = md.match(headingRegex);
  if (!m) return null;
  const rest = md.slice(m.index + m[0].length);
  const fence = rest.match(/```text\n([\s\S]*?)```/);
  return fence ? fence[1].replace(/\n$/, "") : null;
}

const results = [];

function check(label, value, limit, opts = {}) {
  if (value === null || value === undefined) {
    results.push({ label, status: "missing", limit });
    return;
  }
  const len = [...value].length; // count by code points, like Apple
  results.push({ label, len, limit, status: len > limit ? "over" : "ok", ...opts });
}

// --- Fields -----------------------------------------------------------------

check("App name", APP_NAME, LIMITS.appName);
check("Subtitle", blockAfter(/## 4\. Subtitle[^\n]*\n/), LIMITS.subtitle);
check("Promotional text", blockAfter(/## 2\. Promotional text[^\n]*\n/), LIMITS.promotionalText);

const keywords = blockAfter(/## 3\. Keywords[^\n]*\n/);
check("Keywords", keywords, LIMITS.keywords);

check("What's New (English)", blockAfter(/### English \(primary\)\n/), LIMITS.whatsNew);
check("What's New (Arabic)", blockAfter(/### Arabic \(locale: Arabic\)\n/), LIMITS.whatsNew);
check("What's New (Swedish)", blockAfter(/### Swedish \(locale: Swedish\)\n/), LIMITS.whatsNew);

// --- Report -----------------------------------------------------------------

console.log("App Store Connect copy — character limit check\n");

let failed = 0;
for (const r of results) {
  if (r.status === "missing") {
    console.log(`  ⚠️  ${r.label.padEnd(24)} not found in APP_STORE_CONNECT_COPY.md`);
    failed++;
    continue;
  }
  const icon = r.status === "ok" ? "✅" : "❌";
  const bar = `${r.len}/${r.limit}`;
  console.log(`  ${icon} ${r.label.padEnd(24)} ${bar}`);
  if (r.status === "over") failed++;
}

// --- Keyword-specific hygiene ----------------------------------------------

if (keywords) {
  const warnings = [];
  if (/,\s/.test(keywords)) warnings.push("remove spaces after commas — they count toward the 100 limit");
  const terms = keywords.split(",").map((t) => t.trim()).filter(Boolean);
  const dupes = terms.filter((t, i) => terms.indexOf(t) !== i);
  if (dupes.length) warnings.push(`duplicate keywords: ${[...new Set(dupes)].join(", ")}`);
  const inName = terms.filter((t) => APP_NAME.toLowerCase().includes(t.toLowerCase()));
  if (inName.length) warnings.push(`already in the app name (wasted characters): ${inName.join(", ")}`);
  if (warnings.length) {
    console.log("\nKeyword notes:");
    for (const w of warnings) console.log(`  ⚠️  ${w}`);
  }
}

console.log("");
if (failed) {
  console.error(`❌ ${failed} field(s) need attention before submission.`);
  process.exit(1);
}
console.log("✅ All fields are within App Store Connect limits.");
