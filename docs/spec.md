# Project Specification

## Purpose

Build a modular commerce platform that supports multiple clients (admin, web storefront, and mobile) with shared domain logic and a repeatable feature workflow.

## High-Level Architecture

- Monorepo with pnpm workspaces for apps and packages.
- `apps/admin-web` is the first client and hosts operational tooling.
- `packages/shared` holds reusable domain types and utility functions.
- Backend provider is intentionally deferred to a later feature phase.
- Future clients can consume shared contracts from `packages/shared`.

## Delivery Strategy

Develop incrementally in small features with clear specs, automated tests, and CI checks to keep changes safe and reviewable.
