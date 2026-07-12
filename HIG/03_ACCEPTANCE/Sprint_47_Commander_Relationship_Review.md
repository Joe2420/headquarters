# Sprint 47 — Commander Relationship & Behavioral Intelligence Review

## Summary

Sprint 47 adds the deterministic Commander relationship model.

Commander can now derive a long-term behavioral understanding from approved Headquarters evidence without AI scoring, LLM memory, or invented psychology.

## Architecture

The authoritative model lives in HQOS:

- `CommanderRelationship`
- `CommanderRelationshipEngine`
- `CommanderRelationshipPatterns`
- `CommanderRelationshipCoaching`
- `CommanderRelationshipHistory`
- `CommanderRelationshipRepository`

Desktop remains presentation-only and shows the derived relationship as Commander Assessment.

## Relationship Dimensions

- Mission Preparation
- Observation Discipline
- Authorization Discipline
- Emotional Stability
- Risk Discipline
- Recovery Discipline
- Reflection Quality
- Learning Consistency
- Process Trust

Each dimension includes state, trend, explanation, supporting evidence, related missions, and last update.

## Behavior Engine

The engine consumes:

- Mission Evaluation
- Institutional Health
- Operational Consequences
- Mission context evidence
- Journal evidence
- Guardian alerts
- Doctrine records
- Academy events
- Mission lifecycle evidence

Every result references evidence.

## Pattern Engine

The pattern engine detects evidence-backed patterns including:

- repeated impulsive authorization
- excellent observation discipline
- weak debrief pattern
- Guardian recovery becoming habit
- recurring doctrine usage

Patterns require repeated evidence and never rely on guessing.

## Long-Term Memory

Relationship snapshots and history are persisted through migration `012_commander_relationship_snapshots`.

The history records dimension changes with old state, new state, cause, and source evidence.

## Coaching Model

Commander coaching mode is deterministic:

- foundational
- standard
- challenging
- trusted

Mode is derived from mission evidence, strengths, and dimensions needing attention.

## Milestones

Milestones are behavior-based:

- ten disciplined mission signals
- five complete debriefs
- three doctrine promotions

Raw mission count is not celebrated.

## Sidebar

The Mission Command sidebar now includes Commander Assessment:

- current strengths
- current focus
- improving behaviors
- needs attention
- recent milestone
- Commander confidence
- evidence references

## Manual Scenarios

- New operator: relationship remains forming and foundational.
- Experienced operator: stronger evidence can increase trust.
- Repeated mistake: strained or critical dimensions create challenging coaching.
- Repeated improvement: improving trends are surfaced.
- Guardian recovery: recovery discipline can become a pattern.
- Doctrine promotion: doctrine milestones are recognized.
- Multiple mission history: snapshots support future comparison.

## Remaining Work Before Sprint 48

- Desktop can later expose full relationship history.
- Commander chat can reference stored history after startup hydration is wired to the repository.
- Future sprints can connect relationship history to Academy and Guardian dashboards.
