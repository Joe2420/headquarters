# Journal Event Flow

Status: architecture documentation from ARCH-TASK-0001.
Source: Headquarters Journal Architecture Handoff v0.1.

## Purpose

This document describes future journal-related event flow concepts without adding events to the runtime registry or implementing a bus behavior.

## Future Flow

```text
External Journal Export
-> Production Journal Adapter
-> Raw Journal Archive
-> Journal Intelligence Classification
-> Department-Specific Derived Records
-> Commander / Guardian / Academy / Doctrine / Archive Views
```

## Candidate Event Concepts

These names are architecture placeholders only and must not be treated as registered event identifiers until a future approved HQ task updates the canonical Event Registry.

- `JOURNAL_IMPORT_STARTED`
- `JOURNAL_IMPORT_COMPLETED`
- `JOURNAL_IMPORT_FAILED`
- `JOURNAL_ENTRY_CLASSIFIED`
- `GROWTH_EVENT_IMPORTED`
- `DOCTRINE_CANDIDATE_CREATED`

## Flow Rules

- The raw archive record is created before derived classification.
- Classification references the raw archive record instead of replacing it.
- Mission debrief, Academy XP, and Doctrine Candidate outputs remain separate derived concepts.
- Failed classification must not destroy or mutate source evidence.

## Event Registry Rule

No runtime event registry changes are included in ARCH-TASK-0001. Future journal events require owner, producers, consumers, category, priority, version, payload type, and validation rules under the Event Ownership Standard.
