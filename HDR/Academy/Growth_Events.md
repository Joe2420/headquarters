# Growth Events

Status: architecture documentation from ARCH-TASK-0001.
Source: Headquarters Journal Architecture Handoff v0.1.

## Purpose

Growth Events describe operator development, discipline, learning, and milestones. They are based on the current `journey_entries` export and belong to Academy progress, not profit tracking.

## Core Decision

XP rewards behavior and professional development. It must not reward profit by default.

## Source Fields

`journey_entries` provides:

- `source_id`
- `entry_date`
- `progress_value`
- `change_amount`
- `title`
- `description`
- `milestone_reached`
- `created_at`
- `updated_at`

## Growth Event Shape

```text
Growth Event
-> Behavior Category
-> XP Delta
-> Academy Progress
-> Recognition or Milestone
```

## Growth Categories

Recommended initial categories:

- Journaling Discipline
- Plan Adherence
- Risk Control
- Emotional Recovery
- Strategy Improvement
- Restraint
- Mistake Recognition
- Market Understanding
- Funded Stewardship

## Positive XP Signals

- Completing a journal or debrief.
- Following the plan.
- Respecting stop logic.
- Reducing size when uncertainty is high.
- Avoiding low-quality entries.
- Learning from a mistake.

## Negative XP Signals

- Breaking the plan.
- Revenge trading.
- Ignoring stop logic.
- Chasing.
- Trading while distracted.

## Guardrail

XP is an institutional progress ledger, not a dopamine loop or game mechanic. Future implementation must preserve that tone.
