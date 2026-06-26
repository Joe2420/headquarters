# Local Development Readiness Checklist v0.4

Owner: Engineering
Status: Ready
Priority: P0

## Environment
- Node.js LTS installed.
- Package manager selected and documented.
- SQLite dependency installed.
- Git initialized.
- VS Code workspace opens repository root.

## Commands Required

```text
install dependencies
run desktop dev
run tests
run migrations
lint
format
```

## First Boot Verification
- Application opens.
- Security Checkpoint appears.
- Local app data folder exists.
- SQLite database file exists.
- `schema_migrations` table exists.
- `events` table exists.
- `system.boot.completed` event exists.

## Failure Handling
If any readiness step fails, implementation stops until corrected. No feature development may continue on an unstable foundation.
