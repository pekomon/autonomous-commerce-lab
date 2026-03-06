# Feature Plan

## Initial Backlog

1. Feature 01: Admin catalog UI using mock data.
2. Feature 02: Supabase schema + RLS + storage (later).
3. Feature 03: Admin product CRUD.
4. Feature 04: Customer web storefront (optional).
5. Feature 05: Mobile client read-only catalog.
6. Feature 06: Orders (dummy checkout).
7. Feature 12: Android client (read-only storefront, native Compose).
8. Feature 13: iOS client (read-only storefront, native SwiftUI).

## Execution Notes

- Implement features sequentially unless dependencies require parallel work.
- Each feature should include tests and docs updates.
- Keep architecture decisions in `docs/decisions.md`.
- Mobile progression: start with read-only Android catalog browsing, then add auth/cart/checkout in follow-up features.
- Mobile progression now includes iOS read-only storefront parity before auth/cart/checkout expansion.
