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
  - Local-only state via AsyncStorage (no cloud).
  - VPN engine logic stubbed at the React/AsyncStorage layer; native Android `VpnService` + DNS interception (port 53) must be implemented in native Android code outside Replit.

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
