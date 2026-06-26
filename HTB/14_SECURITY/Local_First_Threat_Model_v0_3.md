# Local-First Threat Model v0.3

Status: Engineering Ready
Owner: Security

## Protected Assets
- mission history
- behavior telemetry
- journal entries
- funded account notes
- doctrine
- archives
- backups

## Threats
- accidental data loss
- database corruption
- insecure IPC
- unencrypted backups
- unsafe file imports
- accidental sharing of sensitive journals

## Controls
- local storage by default
- typed IPC
- encrypted backups
- migration backups
- explicit export workflows
- no cloud sync by default

## Acceptance Criteria
No personal trading journal data leaves the machine unless the operator explicitly exports it.
