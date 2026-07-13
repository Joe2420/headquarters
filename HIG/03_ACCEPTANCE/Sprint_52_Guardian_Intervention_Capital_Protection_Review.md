# Sprint 52 Guardian Intervention and Capital Protection Review

## Scope

Sprint 52 establishes Guardian as the deterministic capital-protection and intervention subsystem for Headquarters.

Guardian now evaluates approved operational evidence, produces typed protection decisions, starts interventions, supports recovery protocols, links history into intelligence surfaces, and feeds Commander-led guidance without becoming a separate conversational actor.

## Contracts

The Guardian protection contracts define:

- protection states
- verdicts
- severities
- rule evaluations
- evidence references
- restrictions
- interventions
- recovery plans
- capital allocation
- judgment reserve
- protection snapshots

These contracts live in HQOS and do not depend on React, Electron, SQLite, or desktop rendering.

## Capital Protection

Capital protection evaluates declared risk, requested deployment risk, daily allocation, active exposure, and remaining risk.

Supported outcomes include:

- secure
- caution
- authorization restriction
- deployment denial
- lockout recommendation

Profitable behavior does not bypass risk rules. A disciplined loss does not create a Guardian restriction by itself.

## Judgment Reserve

Judgment Reserve is modeled as a qualitative operational state, not a public score.

Supported states include:

- full
- stable
- reduced
- strained
- depleted
- recovering

The model references approved evidence, degrading factors, improving factors, trend, recommended action, and blocking effect.

## Success Protocol

The success protocol prevents profitable outcomes from weakening discipline.

Success alone does not trigger a warning. Risk escalation, euphoria risk, or observation-quality decline can produce a caution or clarification requirement.

## Protection Engine

The Guardian protection engine composes:

- mission lifecycle
- mission context
- mission evaluation
- operational consequences
- institutional health
- Commander relationship state
- intelligence insights
- capital protection
- judgment reserve
- success protocol
- deployed check-ins

The engine returns deterministic decisions, blocked actions, Commander signals, explanations, restrictions, interventions, and recovery plans.

## Intervention and Lockout Service

The intervention service provides an in-memory, reloadable intervention lifecycle:

- start
- acknowledge
- begin recovery
- record recovery evidence
- resolve
- supersede
- list active
- list historical

Lockout interventions require recovery plans. Caution interventions cannot block actions.

## Recovery Protocols

Recovery protocols define ordered or out-of-order requirements, mandatory and optional steps, future-evidence waits, failure paths, and completion behavior.

Completed recovery protocols can resolve Guardian interventions through the service boundary.

## Commander-Led Guidance

Guardian does not speak directly in Commander Chat.

Desktop guidance converts Guardian decisions into Commander-led operational messages, preserving:

- Commander as the single voice
- distinct Guardian color/status surfaces where appropriate
- stable message ids
- blocked-action reminders only when an operator attempts a blocked action
- recovery and restoration messages

## Guardian Wing Experience

The Guardian Wing now focuses on:

- Capital Vault
- Judgment Reserve
- active cautions and restrictions
- intervention chronology
- recovery requirements

It avoids presenting Judgment Reserve as a numeric score.

## War Room and Deployment Integration

War Room protection now derives authorization and deployment eligibility from Guardian decisions.

The War Room can show:

- secure status
- caution status
- active restriction
- lockout
- blocked actions
- evidence details
- return context

Guardian does not change War Room domain responsibility. It supplies protection state only.

## History and Intelligence Links

Guardian protection history provides a reusable HQOS repository boundary for:

- mission-scoped Guardian history
- active and resolved interventions
- recurring rule patterns
- successful recoveries
- current restriction explanation
- Judgment Reserve change explanation
- Commander relationship evidence
- mission dossier summaries
- replay event reconstruction
- Intelligence Graph node and edge links

This is an in-memory/reloadable foundation. It does not add SQLite migrations or archive writes.

## Manual Scenario Coverage

Sprint 52 covers the required manual scenarios:

- A: first-time mission has no Guardian restriction
- B: excessive risk before authorization blocks authorization
- C: repeated caution reduces Judgment Reserve
- D: profitable violation still triggers Guardian protection
- E: disciplined loss does not punish the operator
- F: lockout requires recovery
- G: recovery completion restores access
- H: Commander explains Guardian decision
- I: War Room blocks unsafe deployment
- J: Archive/replay can show Guardian intervention history

## Confirmed Boundaries

- No EventBus publishing was added.
- No database schema change was added.
- No predictive trading logic was added.
- No external AI or network call was added.
- No direct Guardian chat persona was added.
- Desktop surfaces display Guardian decisions; HQOS owns deterministic Guardian policy.

## Remaining Gaps

- Guardian history is not yet persisted through SQLite.
- Guardian audio cues remain future work.
- Guardian rules can be expanded after more real mission evidence exists.
- Recovery protocols can later be surfaced more deeply in mission replay.

## Recommendation

Proceed to the next sprint only after Founder inspection confirms that Guardian feels protective, evidence-based, and Commander-led rather than punitive or noisy.
