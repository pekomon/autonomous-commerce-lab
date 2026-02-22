# Autonomous Commerce Lab

Autonomous Commerce Lab is a monorepo for building commerce clients and shared domain logic feature-by-feature.

## Language Policy

All repository content must be in English only, including code, comments, documentation, commit messages, and examples.

## Local Review Policy

AI-powered reviews are local-only. No API keys or external review secrets are required for GitHub CI.

## Prerequisites

- Node.js 20
- pnpm 9+

Install pnpm (if needed):

```bash
corepack enable
corepack prepare pnpm@9 --activate
```

## Getting Started

Install dependencies:

```bash
pnpm install
```

Run the admin web app:

```bash
pnpm --filter @autonomous-commerce-lab/admin-web dev
```

Run the storefront web app:

```bash
pnpm --filter @autonomous-commerce-lab/storefront-web dev
```

Run tests:

```bash
pnpm test
```

Run lint:

```bash
pnpm lint
```

Build all workspaces:

```bash
pnpm build
```

Format source and docs:

```bash
pnpm format
```

## Supabase Env

Only `.env.example` should be committed. Keep real values in `.env.local` (gitignored).

Required keys:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Optional local-only key (never commit):

```bash
# SUPABASE_SERVICE_ROLE_KEY=
```

## Storefront Runtime Config

Storefront also supports runtime config via:

- `apps/storefront-web/public/config.json` (placeholder-safe)
- `apps/storefront-web/public/config.example.json` (template)

If runtime config is empty, the app falls back to `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

## Run CI Checks Locally

```bash
./scripts/ci-local.sh
```

## Enable Git Hooks

```bash
git config core.hooksPath .githooks
```

After this, every `git push` runs local CI checks via `.githooks/pre-push`.

## Push And Open A PR

```bash
./scripts/open-pr.sh
```

## Workspace Overview

- `apps/admin-web`: React + Vite + TypeScript admin frontend.
- `apps/storefront-web`: React + Vite + TypeScript read-only customer storefront.
- `packages/shared`: Shared domain types and utility functions.
- `docs/`: Product specification, feature backlog, architecture decisions, and agent workflows.
