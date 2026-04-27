# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Artifacts

- **nidaa-shield** (`artifacts/nidaa-shield`) — Expo mobile app "نداء شايلد".
  - Arabic-only RTL UI, Cairo font, full **dark + light theme** (system / manual override), themed status bar.
  - Glassmorphism mode cards (Smart Shield / Gaming Turbo / Family Guard / Military Privacy / Custom).
  - Local-only state via AsyncStorage. `SettingsContext` persists theme, custom DNS servers, blocklist, whitelist, excluded apps, auto-start preference, and DoH toggle.
  - **Native Android VpnService** as a local Expo module at `artifacts/nidaa-shield/modules/nidaa-vpn/android/` (Kotlin, package `expo.modules.nidaavpn`). Files: `NidaaVpnModule.kt` (Expo bridge — exposes `requestPermission`/`startVpn`/`stopVpn`/`isRunning`/`getStats`/`getCurrentSession`/`setAutoStart`/`listInstalledApps`/`getAppIcon`), `NidaaVpnService.kt` (the VpnService — opens a /32 tun routing only the fake DNS through us, reads IPv4/UDP DNS packets, applies blocklist/whitelist returning NXDOMAIN, otherwise forwards via `protect()`ed UDP or DoH; calls `notifySystemSurfaces()` on start/stop to re-bind the quick-settings tiles), `DnsPacket.kt` (parse + NXDOMAIN/response builders), `DohClient.kt` (OkHttp DoH client to cloudflare-dns.com), `VpnState.kt` (in-process stats counters + persisted last-session prefs), `NidaaBootReceiver.kt` (re-applies last session on boot when auto-start is on), `NidaaTileService.kt` + per-mode `ModeTileService.kt` (Quick Settings Tiles — one master toggle plus one tile per mode; tap to activate, opens the app if permission/config is missing). Per-app exclusions via `addDisallowedApplication`. Foreground notification with stop action. **Home-screen widgets removed (Apr 26, 2026).**
  - **Themed dialogs**: `components/Dialog.tsx` provides a global `DialogProvider` + `useDialog()`/`showDialog()` API that fully replaces the native white `Alert.alert` popups with a blurred, theme-aware modal (icon badge, title, message, multiple buttons with default/cancel/destructive styles) that respects dark/light mode and the user's accent color. Used in all settings screens and the VPN context.
  - **Modes**: `smart` (AdGuard 94.140.14.14 — system-wide ad/tracker blocking), `gaming` (Cloudflare 1.1.1.1 — fast resolution), `family` (CleanBrowsing 185.228.168.168 — adult/malware filter), `military` (Cloudflare with **forced DoH** — encrypted DNS-over-HTTPS to prevent ISP tracking; DoH is always on for this mode regardless of the user setting), `custom` (user-picked DNS).
  - In-app screens: home (modes only — engine banner removed), `/stats` (live counters, accessible from Settings → Tools), `/speed-test` (compares Cloudflare/Google/AdGuard/Quad9/CleanBrowsing via DoH, accessible from Settings → Tools), `/settings` (theme, tools, blocklist, whitelist, custom-dns, excluded-apps, advanced, system features).
  - Standalone `package.json` (no workspace catalog refs) so EAS Build works directly from `artifacts/nidaa-shield` as base directory. Built via EAS Build → GitHub (`15coder/Nidaa-Shield`, branch `main`, profile `preview`). Cannot run in Expo Go — requires custom dev client / EAS APK.
  - **Local Expo module pattern** (Apr 27, 2026): `nidaa-vpn` is autolinked natively via the `expo.autolinking.nativeModulesDir: "./modules"` field in `package.json` (NOT listed under `dependencies` — that caused expo-doctor to flag a duplicate native module since the same module showed up at both `modules/nidaa-vpn` and `node_modules/nidaa-vpn`). JS resolution is provided by a Metro `extraNodeModules` alias in `metro.config.js` and a TypeScript path mapping in `tsconfig.json` (`"nidaa-vpn": ["./modules/nidaa-vpn"]`). Do NOT add a local `.npmrc` with `node-linker=hoisted` — it breaks `@expo/metro-config`'s resolution of `expo/package.json` from the workspace root. The current pnpm isolated install correctly dedupes `expo-constants`.
  - **Production size optimization** (Apr 27, 2026): Pruned 6 unused packages (`expo-status-bar`, `expo-system-ui`, `react-native-svg`, `react-dom`, `react-native-web` — web-only or never imported). Restricted `app.json` to `"platforms": ["android"]` and removed the `web` config block. Enabled R8 (`enableProguardInReleaseBuilds`) and resource shrinking (`enableShrinkResourcesInReleaseBuilds`) under the `expo-build-properties` plugin, with a Proguard `-keep` rule for the `expo.modules.nidaavpn.**` Kotlin classes so reflection-based Expo native bindings survive minification. `expo-doctor` returns 17/17 checks passed.
  - **Android toolchain pin** (Apr 27, 2026): `expo-build-properties` uses `compileSdkVersion: 36`, `targetSdkVersion: 36`, `buildToolsVersion: "36.0.0"`, `minSdkVersion: 24`, `kotlinVersion: "2.0.21"` — these match Expo SDK 54 defaults. Pinning `compileSdk`/`targetSdk` to `35` while running `expo-updates@29.0.16` causes a `expo-updates:kspReleaseKotlin` failure during EAS Build because the module is compiled against API 36; keep it on 36.
  - **EAS OTA updates** (Apr 27, 2026): `expo-updates@~29.0.16` (SDK-54-pinned) is wired up via `app.json` (`updates.url` → `https://u.expo.dev/<EAS project id>`, `runtimeVersion.policy: "appVersion"`, `checkAutomatically: "ON_LOAD"`). `services/UpdateService.ts` exposes `checkForOtaUpdate()` (no-op in `__DEV__` and when `Updates.isEnabled` is false; idempotent via an in-flight promise). `_layout.tsx` calls it once after settings hydrate. EAS channels `preview` and `production` are already configured in `eas.json`; publish JS-only fixes with `pnpm --filter @workspace/nidaa-shield run ota:preview` or `ota:production` (wraps `eas update --branch <name> --auto`). Bumping the app `version` in `app.json` invalidates the runtime version so a new native build is required for that release.
  - Helper scripts: `pnpm --filter @workspace/nidaa-shield run doctor` (runs `expo-doctor`), `pnpm --filter @workspace/nidaa-shield run clean` (wipes `node_modules`/`.expo`/`dist`/`android`/`ios`, reinstalls, and starts Metro with `--clear`), `pnpm --filter @workspace/nidaa-shield run ota:preview` / `ota:production` (publish OTA bundle to the matching EAS channel).
  - **EAS Build pre-flight hook** (Apr 27, 2026): `package.json` defines `eas-build-pre-install` (logs the EAS Node/npm version) and `eas-build-post-install` (`pnpm exec expo install --check --non-interactive`) which fail the EAS Build early — before native compilation — if any installed native module drifts out of the SDK 54 expected range. Catches the kind of drift that produced the previous `expo-updates:kspReleaseKotlin` failure.
  - iOS implementation is a no-op stub; Android is the only supported target.
  - **Daily protection reminder notification**: `services/NotificationService.ts` — schedules a single daily notification at 9:00 AM using `expo-notifications@~0.32.16`. Requests POST_NOTIFICATIONS permission on first launch (via `scheduleDailyProtectionReminder()` called in `_layout.tsx` after settings hydration). Uses AsyncStorage key `@nidaa-shield/notif-scheduled-v1` to schedule only once. Notification is in Arabic: "لا تنسَ تفعيل حماية نداء شايلد اليوم — ابقَ آمناً على الإنترنت!".
  - **SalatCard "لاحقاً"**: tapping "لاحقاً" (Later) dismisses the card for the current session only and does NOT write to AsyncStorage, so the card reappears on the next app open. Tapping "نعم" saves `todayKey()` and hides the card for the rest of the day.

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
