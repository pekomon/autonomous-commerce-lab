#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

# Match GitHub Actions non-interactive behavior.
export CI=1

if command -v corepack >/dev/null 2>&1; then
  corepack enable
else
  echo "corepack is not available; skipping 'corepack enable'." >&2
fi

echo "Node version: $(node --version)"
echo "pnpm version: $(pnpm --version)"

pnpm install --frozen-lockfile
pnpm format:check
pnpm -r lint
pnpm -r test
pnpm -r build
