# Future Backlog

Status: architecture backlog from ARCH-TASK-0001.
Source: Headquarters Journal Architecture Handoff v0.1.

These tasks are proposed only. They are not approved for implementation until the Founder assigns them through the normal HDC workflow.

## Proposed Journal Architecture Tasks

### HQ-TASK-J001 - Journal Data Model Specification

Purpose: define TypeScript/domain models for Commander's Log, Trade Review Import, Growth Event, and Doctrine Candidate.

Scope: types only. No import logic. No UI.

### HQ-TASK-J002 - Journal Import Adapter Specification

Purpose: define CSV import adapter contracts for current journal exports.

Scope: parsing contracts and validation rules only. No UI. No persistence.

### HQ-TASK-J003 - Growth Event Engine MVP

Purpose: create an MVP model for behavior-based XP / growth events.

Scope: domain plus calculation interface. No UI. No gamification.

### HQ-TASK-J004 - Doctrine Candidate Queue

Purpose: store repeated lessons as candidates awaiting evidence.

Scope: data model and lifecycle. No automatic promotion.

### HQ-TASK-J005 - Journal Intelligence Architecture

Purpose: classify journal entries into structured knowledge.

Scope: specification and interface first. AI classification implementation comes later.

### HQ-TASK-J006 - Shadow Mode Import Review

Purpose: compare the current journal and Headquarters capture during transition.

Scope: read-only comparison model. No replacement of the existing journal.

## Backlog Guardrail

Do not send these tasks to Codex until explicitly approved by the Founder.
