#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

if ! branch="$(git symbolic-ref --quiet --short HEAD)"; then
  echo "Unable to detect the current branch (detached HEAD)." >&2
  exit 1
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI ('gh') is required to create or view pull requests." >&2
  exit 1
fi

./scripts/ci-local.sh

if git rev-parse --abbrev-ref --symbolic-full-name "@{u}" >/dev/null 2>&1; then
  git push origin "${branch}"
else
  git push --set-upstream origin "${branch}"
fi

if pr_url="$(gh pr view --head "${branch}" --json url --jq .url 2>/dev/null)"; then
  echo "Pull request URL: ${pr_url}"
else
  pr_url="$(gh pr create --base main --head "${branch}" --fill)"
  echo "Pull request URL: ${pr_url}"
fi
