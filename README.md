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

## Run CI Checks Locally

```bash
pnpm install --frozen-lockfile
pnpm format:check
pnpm -r lint
pnpm -r test
pnpm -r build
```

## Workspace Overview

- `apps/admin-web`: React + Vite + TypeScript admin frontend.
- `packages/shared`: Shared domain types and utility functions.
- `docs/`: Product specification, feature backlog, architecture decisions, and agent workflows.
