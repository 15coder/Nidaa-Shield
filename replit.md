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
  - **Native Android VpnService** as a local Expo module at `artifacts/nidaa-shield/modules/nidaa-vpn/` (Kotlin). Acts as an in-process **DNS proxy**: opens a tiny tun, parses IPv4/UDP DNS packets, applies the user's blocklist/whitelist (returns NXDOMAIN), forwards the rest via a `protect()`ed UDP socket, and in Military mode forwards over **DNS-over-HTTPS** to Cloudflare. Per-app exclusions via `addDisallowedApplication`. Live counters via `VpnStats` (total/blocked/forwarded/DoH/avg latency/last domain).
  - **Quick Settings tile** (`NidaaTileService`) and **home-screen widget** (`NidaaWidgetProvider` + `res/layout/nidaa_widget.xml`) toggle protection without opening the app. **Boot receiver** (`NidaaBootReceiver`) re-applies the last session on device restart when the user opted in.
  - In-app screens: home, `/stats` (live counters), `/speed-test` (compares Cloudflare/Google/AdGuard/Quad9/CleanBrowsing via DoH), `/settings` (theme, blocklist, whitelist, custom-dns, excluded-apps, advanced).
  - Standalone `package.json` (no workspace catalog refs) so EAS Build works directly from `artifacts/nidaa-shield` as base directory. Built via EAS Build → GitHub (`15coder/Nidaa-Shield`, branch `main`, profile `preview`). Cannot run in Expo Go — requires custom dev client / EAS APK.
  - iOS implementation is a no-op stub; Android is the only supported target.

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
