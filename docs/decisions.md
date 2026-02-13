# Architecture Decision Records

## ADR-0001: Repository Language Is English-Only

- Status: Accepted
- Date: 2026-02-13

### Decision

All repository content must be written in English only.

### Rationale

- Ensures consistent collaboration across contributors.
- Reduces misunderstandings in code reviews and docs.
- Keeps automation prompts and CI outputs aligned.

## ADR-0002: Local-Only AI Reviews (No API Keys in GitHub)

- Status: Accepted
- Date: 2026-02-13

### Decision

AI review workflows run locally. GitHub Actions must not require API keys or secrets for review steps.

### Rationale

- Eliminates secret management overhead during bootstrap.
- Reduces security and compliance risk.
- Keeps CI deterministic and fully portable.
