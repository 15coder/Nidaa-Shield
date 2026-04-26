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
  - **Native Android VpnService** as a local Expo module at `artifacts/nidaa-shield/modules/nidaa-vpn/android/` (Kotlin, package `expo.modules.nidaavpn`). Files: `NidaaVpnModule.kt` (Expo bridge — exposes `requestPermission`/`startVpn`/`stopVpn`/`isRunning`/`getStats`/`getCurrentSession`/`setAutoStart`/`listInstalledApps`/`getAppIcon`), `NidaaVpnService.kt` (the VpnService — opens a /32 tun routing only the fake DNS through us, reads IPv4/UDP DNS packets, applies blocklist/whitelist returning NXDOMAIN, otherwise forwards via `protect()`ed UDP or DoH; calls `notifySystemSurfaces()` on start/stop to refresh the widget and quick-settings tile), `DnsPacket.kt` (parse + NXDOMAIN/response builders), `DohClient.kt` (OkHttp DoH client to cloudflare-dns.com), `VpnState.kt` (in-process stats counters + persisted last-session prefs), `NidaaBootReceiver.kt` (re-applies last session on boot when auto-start is on; refreshes widgets), `NidaaTileService.kt` (Quick Settings Tile — taps toggle the VPN using the last-saved config, opens the app if permission/config is missing), `NidaaWidgetProvider.kt` (home-screen widget with one-tap toggle; renders state via `RemoteViews`). Resources: `res/layout/nidaa_widget_layout.xml`, `res/drawable/nidaa_widget_bg.xml`, `res/xml/nidaa_widget_info.xml`. Per-app exclusions via `addDisallowedApplication`. Foreground notification with stop action.
  - **Modes**: `smart` (AdGuard 94.140.14.14 — system-wide ad/tracker blocking), `gaming` (Cloudflare 1.1.1.1 — fast resolution), `family` (CleanBrowsing 185.228.168.168 — adult/malware filter), `military` (Cloudflare with **forced DoH** — encrypted DNS-over-HTTPS to prevent ISP tracking; DoH is always on for this mode regardless of the user setting), `custom` (user-picked DNS).
  - In-app screens: home (modes only — engine banner removed), `/stats` (live counters, accessible from Settings → Tools), `/speed-test` (compares Cloudflare/Google/AdGuard/Quad9/CleanBrowsing via DoH, accessible from Settings → Tools), `/settings` (theme, tools, blocklist, whitelist, custom-dns, excluded-apps, advanced, system features).
  - Standalone `package.json` (no workspace catalog refs) so EAS Build works directly from `artifacts/nidaa-shield` as base directory. Built via EAS Build → GitHub (`15coder/Nidaa-Shield`, branch `main`, profile `preview`). Cannot run in Expo Go — requires custom dev client / EAS APK.
  - iOS implementation is a no-op stub; Android is the only supported target.

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
