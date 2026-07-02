# Headquarters Experience Principles

## Purpose

Headquarters is a Commander-led operating environment, not a dashboard. The desktop shell may still expose navigation during the beta period, but the intended experience is institutional guidance through rooms, mission state, and one disciplined next action at a time.

## Why The Current Beta Feels Dashboard-Like

The current beta proves that all major subsystems are reachable, but it presents too much of Headquarters as panels and destination buttons. The sidebar is visually and behaviorally primary, the status area competes with Commander guidance, and many rooms expose subsystem summaries before the operator has been asked what action matters now. This makes Headquarters feel like a collection of tools instead of a facility that guides conduct.

Dashboard density is especially risky for Headquarters because it invites scanning, comparison, and self-directed clicking. Those behaviors are useful in administrative software, but they weaken the Headquarters premise: the operator should report in, receive the current state, take or withhold the right action, and move through the mission path with discipline.

## Core Doctrine

- Commander is the primary interface.
- Sidebar navigation is secondary.
- Rooms are entered, not selected.
- One primary action dominates each state.
- Future actions stay hidden, locked, or quiet.
- No dashboard density.
- No all-at-once subsystem dumping.
- Atmosphere is calm, institutional, and tactical.
- Headquarters rewards discipline, not profit.
- The operator should always know the next action.

## Experience Hierarchy

1. Commander guidance
2. Current state
3. Primary action
4. Current room workspace
5. Timeline/history
6. Advanced details

## Implementation Rules

- Every screen must answer: what is Commander telling the operator now?
- Every mission state must expose one dominant primary action or a deliberate no-action state.
- Sidebar items must never be the main instruction model. They are escape hatches, recovery paths, and advanced access.
- Room entry should be represented as a stateful transition, even when the first implementation is only text or CSS class structure.
- Future rooms, phases, and actions should be locked, quiet, or absent until they become relevant.
- Dense lists, dashboards, and multi-panel summaries belong behind the current room workspace or advanced details.
- Profit language must not be the reward loop. Recognition language should name discipline, restraint, review, protection, and improvement.
- Commander copy must be deterministic, calm, and sparse. It must not predict markets, flatter the operator, or simulate a chat relationship.
- The current room must carry one purpose. If a room needs multiple unrelated workflows, route the operator to a better room.
- Timeline and history should support review after the primary action is understood, not compete with the next action.

## Future Task Guidance

Future implementation tasks should move the app from navigation-first rendering toward Commander-led room operation in small layers:

- Promote Commander shell state above room content.
- Derive room recommendation from mission lifecycle state.
- Replace broad dashboard surfaces with room-specific workspaces.
- Add door or corridor transitions between major state changes.
- Keep the existing sidebar available until room entry is mature enough to carry recovery and accessibility needs.
- Validate new components against the experience hierarchy before adding visual density.

## Non-Goals

- This document does not require a full UI rebuild.
- This document does not change HQOS behavior.
- This document does not change database schema.
- This document does not remove existing beta navigation or workflows.
