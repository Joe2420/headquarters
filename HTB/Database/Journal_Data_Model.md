# Journal Data Model

Status: architecture documentation from ARCH-TASK-0001.
Source: Headquarters Journal Architecture Handoff v0.1.

## Purpose

This document records the database-facing journal data architecture discovered from production exports. It is not a migration and does not authorize schema changes.

## Source Data Summary

| Export | Rows Reviewed | Main Purpose |
|---|---:|---|
| `journal_entries` | 70 | Daily/strategic reflections, market context, mood, macro notes, motivation. |
| `journey_entries` | 51 | Progress/XP events, growth notes, milestones. |
| `trade_reviews` | 34 | Trade-specific debriefs: plan adherence, emotion, improvement, lessons. |

## Observed Columns

### journal_entries

- `id`
- `user_id`
- `entry_date`
- `content`
- `mood`
- `market_conditions`
- `created_at`
- `updated_at`
- `image_urls`

### journey_entries

- `id`
- `user_id`
- `entry_date`
- `progress_value`
- `change_amount`
- `title`
- `description`
- `milestone_reached`
- `created_at`
- `updated_at`

### trade_reviews

- `id`
- `trade_id`
- `user_id`
- `followed_plan`
- `emotional_state`
- `what_went_well`
- `what_to_improve`
- `lessons_learned`
- `would_take_again`
- `created_at`

## Conceptual Entities

### RawJournalArchiveRecord

Preserves exact imported source evidence:

- source system
- source file
- source id
- import timestamp
- row hash
- raw payload
- parse status
- classification status

### CommandersLogEntry

Derived from `journal_entries` and linked to the raw archive record. Used for daily context, reflection, and market perception.

### ImportedTradeReview

Derived from `trade_reviews` and mapped to Mission Debrief / Black Box concepts.

### GrowthEventImport

Derived from `journey_entries` and mapped to Academy progress.

### DoctrineCandidateSource

A derived reference to journal or trade review text that may support a future Doctrine Candidate.

## Storage Principles

- Import must be lossless.
- Raw text must remain available.
- Structured classification is additional metadata.
- The existing journal remains production source until Shadow Mode is complete.
- Do not merge daily journal, trade review, and growth records into one generic journal table.

## Deferred Work

No database migrations are approved by this architecture task. Schema design, persistence, import logic, and validation belong to future HDC-governed HQ tasks.
