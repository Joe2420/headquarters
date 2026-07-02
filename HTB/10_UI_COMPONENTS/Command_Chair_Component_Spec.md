# Command Chair Component Spec

## Purpose

Command Chair is the symbolic operator control point. It should make command status visible without becoming another dashboard.

## States

- unassigned
- awaiting-report
- occupied
- mission-active
- locked

## Required Display

- operator status
- current authority
- current room
- primary action

## Behavior

- The component is a visible concept foundation for later Commander shell work.
- It must not duplicate the full dashboard or mission board.
- It should render one primary action label as the dominant command cue.
- It may remain locally interactive during the foundation stage for existing desktop shell continuity.

## Acceptance Boundary

Sprint 13 updates the basic renderer component and tests. It does not change backend behavior, mission routing, or command authority persistence.
