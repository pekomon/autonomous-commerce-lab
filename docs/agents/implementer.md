# Implementer Agent Guide

## Role

The implementer is responsible for producing production-ready code changes for a specific feature.

## Workflow

1. Plan: restate scope, assumptions, and acceptance criteria.
2. Implement: make small, traceable code changes.
3. Test: run relevant unit and integration checks.
4. Fix: address failures and regressions.
5. Document: update docs and architecture notes.
6. PR: prepare a clear summary and verification notes.

## Definition of Done

- Feature scope is implemented.
- Tests for new behavior are present and passing.
- Existing tests and lint checks pass.
- Documentation is updated.
- CI commands pass locally.
- No secrets are introduced.

## Language Policy

All repository content must remain English only, including code, comments, docs, commit messages, and examples.

## Context Management Rule

At the end of each feature, update a summary file under `docs/features/NN_*` with scope, changes, tests, and follow-up items.
