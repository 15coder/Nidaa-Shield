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
  - Arabic-only RTL UI, Cairo font, light mode only, white background.
  - Glassmorphism mode cards (Smart Shield / Gaming Turbo / Family Guard / Military Privacy).
  - Local-only state via AsyncStorage (no cloud, no accounts).
  - **Native Android VpnService** implemented as a local Expo module at `artifacts/nidaa-shield/modules/nidaa-vpn/` (Kotlin). Installs system-wide DNS overrides without packet forwarding by combining `addAddress` + dummy unused route (`198.51.100.0/30`) + `addDnsServer` + foreground notification. No redirect to system settings; everything happens in-app after the standard Android VPN consent dialog.
  - Standalone `package.json` (no workspace catalog refs) so EAS Build works directly from `artifacts/nidaa-shield` as base directory. Built via EAS Build → GitHub (`15coder/Nidaa-Shield`, branch `main`, profile `preview`). Cannot run in Expo Go — requires custom dev client / EAS APK.
  - iOS implementation is a no-op stub; Android is the only supported target.

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
