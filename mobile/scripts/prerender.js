#!/usr/bin/env node
/**
 * Prerender the TanStack Start app into dist/client/index.html so Capacitor
 * has a static entry point for its WebView.
 *
 * This script imports the Nitro server bundle produced by `vite build` and
 * calls its `fetch` handler with a request for the home page. The resulting
 * HTML is written to dist/client/index.html.
 */

import { createServer } from "node:http";
import { writeFile } from "node:fs/promises";

const serverPath = new URL("../../dist/server/index.mjs", import.meta.url);
const server = await import(serverPath);

const request = new Request("http://localhost/", {
  headers: {
    "user-agent": "CapacitorPrerender/1.0",
    accept: "text/html",
  },
});

const response = await server.fetch(request, {}, { waitUntil: () => {} });
const html = await response.text();

await writeFile("dist/client/index.html", html, "utf-8");
console.log(`Wrote dist/client/index.html (${html.length} bytes)`);
