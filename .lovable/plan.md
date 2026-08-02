# Plan: Get Xcode downloaded and fix preview hydration warning

## 1. Troubleshoot Xcode download from Apple Developer site

Common causes and fixes, in order:

1. **Sign-in issues**
   - Make sure you are signed into **developer.apple.com** with the same Apple ID that has (or will have) the Apple Developer Program membership.
   - If you have a free account, the .xip download may still be available; if the site loops back to the membership page, that means you need to enroll first.

2. **Browser / download problems**
   - Safari usually works best for Apple’s developer downloads.
   - If the download starts but stalls, try:
     - A different network (some corporate/public Wi-Fi blocks large downloads).
     - Disabling browser extensions or using a Private/Incognito window.
     - Copying the direct `.xip` link and using `curl` in Terminal (resumable):
       ```bash
       curl -C - -O "https://...xip"
       ```

3. **Extracting the .xip**
   - After download, double-click the `.xip` in Finder or run:
     ```bash
     xip --expand Xcode_16.xip
     ```
   - This can take 10–30 minutes on slower Macs. Do not interrupt it.

4. **Move to /Applications**
   - Drag the extracted `Xcode.app` into `/Applications`.
   - Run:
     ```bash
     sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
     sudo xcodebuild -runFirstLaunch
     sudo xcodebuild -license accept
     ```

5. **Verify**
   ```bash
   xcodebuild -version
   ```

## 2. Fix the preview hydration mismatch

The runtime error shows the server rendering a decorative element (likely the moon glow) while the client renders a dialog/toast. This usually means a component is conditionally rendering different markup on server vs client.

- Inspect `src/routes/index.tsx` around the reported lines.
- Look for any `typeof window !== 'undefined'` branch, `useHydrated`-style hooks, or notification/toast components that render different HTML during SSR.
- Replace with a consistent server-safe fallback, or defer the differing markup behind a client-only guard.

## 3. Re-run preflight after Xcode is ready

Once Xcode is installed and selected:
```bash
bun run mobile:preflight
```

Then proceed with the existing `bun run mobile:publish` workflow.
