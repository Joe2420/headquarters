# Data Retention and Backup v0.3

Status: Engineering Ready
Owner: Archives

## Purpose
Headquarters treats local data as institutional memory. Backup and integrity verification are mandatory.

## Retention Rules
- Missions are never hard-deleted.
- Doctrine is never hard-deleted.
- Archives are never hard-deleted.
- Recovery telemetry may be summarized after retention windows if raw detail is excessive.
- Temporary UI state can be deleted safely.

## Backup Types

### Manual Backup
Operator-triggered, stored as an encrypted local file.

### Automatic Daily Backup
Created after shutdown if mission data changed.

### Pre-Migration Backup
Created before every database migration.

### Design Freeze Backup
Created before major HDR/HTB version changes.

## Integrity Checks
- PRAGMA integrity_check.
- Migration version validation.
- Archive artifact count validation.
- Event stream replay spot checks.

## Acceptance Criteria
A corrupt database must not silently overwrite the latest valid backup.
