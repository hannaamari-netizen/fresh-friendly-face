## Full Web Push for Haya Al-Salat

Real background reminders need a **push server** that wakes the phone even when the app is closed. Here's the plan.

### 1. Backend (Lovable Cloud)
- Enable Lovable Cloud.
- Generate VAPID keys (server keeps the private key; the app uses the public key to subscribe).
- Table `push_subscriptions`: `user_id` (nullable — anonymous device allowed), `endpoint`, `p256dh`, `auth`, `timezone`, `latitude`, `longitude`, `offset_minutes`, `message_template`, `next_fajr_utc`, `last_sent_utc`. RLS scoped by a device token stored in the browser.
- Table grants + RLS policies per Lovable rules.

### 2. Service worker (`public/sw.js`)
- Handles `push` → shows the notification with title, body, icon, tag.
- Handles `notificationclick` → focuses/opens the app.
- Registered only in production (guards against Lovable preview, iframe, dev, `?sw=off`).

### 3. Client wiring
- On enabling reminders: request `Notification.permission`, register SW, `pushManager.subscribe({ userVisibleOnly, applicationServerKey: VAPID_PUBLIC })`, POST the subscription + timezone + coords + offset + custom message to a server function.
- Update-on-change: whenever the offset, message text, or location changes, re-sync.
- Delete subscription on disable.

### 4. Scheduler
- A public API route `/api/public/cron/fajr-push` (secured by a shared secret header).
- pg_cron every minute → `net.http_post` to that route with the secret.
- Route loads due subscriptions (`next_fajr_utc - offset_minutes` in the last minute window, not yet sent today), sends the web-push (using `web-push` protocol built with WebCrypto — Node's `web-push` package isn't Worker-safe, so signing is done inline), then advances `next_fajr_utc` by fetching Aladhan for the next day.

### 5. UI
- Fajr reminder card gets a status line ("Background reminders on for this device") plus a fallback message when Notifications API is missing (iOS Safari not installed to Home Screen).
- Keep the in-tab `setTimeout` as a secondary safety net when the tab happens to be open.

### iOS caveat (called out to the user)
iOS delivers web push only when the app is installed to the Home Screen (iOS 16.4+). Android/desktop Chrome/Firefox work with the tab fully closed.

### Files touched
- `supabase/migrations/<new>.sql` — table, grants, RLS, pg_cron job
- `public/sw.js` — push service worker
- `src/lib/push.ts` — subscribe/unsubscribe helpers (browser)
- `src/lib/push.functions.ts` — `saveSubscription`, `deleteSubscription` server fns
- `src/routes/api/public/cron/fajr-push.ts` — cron route + signed web-push sender
- `src/components/FajrReminder.tsx` — wire subscribe/unsubscribe alongside existing UI
- Secrets: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `CRON_SECRET`

Shall I proceed?
