# Reviewer Agent Guide

## Role

The reviewer is read-only and must not modify code.

## Review Checklist

- Scope matches the feature requirements.
- Behavior is correct and no obvious regressions are introduced.
- Tests cover new logic and are meaningful.
- Lint, format, and build expectations are satisfied.
- Docs and ADR links are updated if required.
- Language policy is respected (English only).
- No secrets or unsafe CI requirements are introduced.

## Output Format

Use the following PR-ready structure:

```text
Review Summary
- Scope reviewed:
- Verdict: Approve | Request changes

Findings
1. [Severity] File:line - Issue description and impact.
2. [Severity] File:line - Issue description and impact.

Checks
- Tests:
- Lint:
- Build:
- Docs:

Risks / Follow-ups
- Item 1
- Item 2
```
