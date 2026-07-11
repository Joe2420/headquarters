# Sprint 31 - Headquarters Priority Engine Review

## Scope

Sprint 31 introduces a deterministic priority engine for actionable Headquarters work.

This sprint does not add timers, consequences, Commander personality variation, or new persistence schemas. It creates the shared ranking model used by Commander and the Situation Board.

## Priority Engine

The engine lives in:

`packages/hqos/src/HeadquartersPriorityEngine.ts`

It produces ordered priority items with:

- stable id
- source subsystem
- type
- title
- explanation
- severity
- urgency
- lifecycle relevance
- blocking status
- recommended room
- recommended action
- evidence references
- detected timestamp
- resolution state

## Priority Classes

Priority ordering is deterministic:

1. critical
2. blocking
3. immediate
4. pending
5. informational

Within those classes, blocking status, lifecycle relevance, urgency, timestamp, source, and id provide stable tie-breaking.

## Current Inputs

The first implementation ranks:

- mission lifecycle action from the Sprint 30 projection
- Guardian alerts and lockouts
- Doctrine candidates
- Journal follow-ups
- Intelligence missing-evidence signals
- Review availability
- Archive milestones

## Commander Integration

Commander Room now uses the priority engine for:

- highest priority
- recommended action
- Situation Board recommendation
- top priority list
- severity counts

Guardian critical/blocking priorities can override ordinary mission progression.

## Acceptance Notes

- Guardian lockout outranks mission continuation.
- Current lifecycle blockers outrank optional Doctrine review.
- Resolved priorities are removed.
- Duplicate source priorities collapse to one item.
- Situation Board and Commander briefing share the same highest priority model.

## Remaining Gaps

- Notification emission is still renderer-local and should be tied to priority changes more deeply in a later sprint.
- Priority persistence is limited to source state persistence; the queue itself remains derived.
- Doctrine and Journal inputs are normalized by the desktop for now.

## Recommendation

Proceed to the next dependency sprint: Persistent Mission Intelligence and Operational Memory.
