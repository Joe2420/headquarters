# Sprint 30 - Persistent Mission Lifecycle Engine Review

## Scope

Sprint 30 establishes one deterministic mission lifecycle projection for Headquarters.

This sprint does not redesign rooms, Commander personality, persistence schemas, or transition animation. It creates the shared lifecycle source that later sprints can consume.

## Authoritative Lifecycle Projection

The authoritative projection lives in:

`packages/hqos/src/MissionLifecycleProjection.ts`

The projection derives:

- active lifecycle stage
- completed lifecycle stages
- available rooms
- recommended room
- current primary lifecycle action
- blocked actions
- transition reason
- mission completion state
- active/complete mission flags

## Stage To Room Mapping

| Lifecycle Stage | Room |
| --- | --- |
| missionCreation | Command Center / Mission Room |
| briefing | Ready Room |
| observation | Observation Room |
| authorization | War Room |
| deployed | War Room |
| returnToBase | Debrief Theater |
| debrief | Debrief Theater |
| archived | Archive / Command Center standby |

## Existing Mission State Compatibility

The current HQOS mission state machine remains intact:

- idle
- briefing
- ready
- observation
- authorization
- deployed
- return_to_base
- debrief
- archived

The projection maps `idle` to `missionCreation` and maps both `ready` and `observation` into the Observation lifecycle stage. This preserves existing MissionKernel behavior while exposing the lifecycle language required by the Headquarters experience.

## Persistence And Hydration

Lifecycle state is derived from persisted mission records and mission state. The desktop already hydrates mission records through startup-owned repositories. The new projection is pure and can be applied after reload without relying on renderer-only inference.

Archived missions are marked complete and no longer treated as active by the projection.

## Authoritative State Versus UI Navigation State

Authoritative lifecycle state:

- comes from the mission record
- determines the recommended room
- determines completed lifecycle stages
- determines primary action and blockers
- survives reload when the mission record survives reload

UI navigation state:

- may show a reviewable previous room
- must not mutate mission lifecycle
- must not unlock future lifecycle stages
- remains subordinate to the projection for recommendations

## Renderer Integration

Desktop renderer lifecycle helpers now delegate to the HQOS projection for:

- recommended Commander room
- current mission state used by Commander and room views
- mission lifecycle summary
- lifecycle step status
- primary mission action

The existing room components remain intact.

## Remaining Gaps

- Full transition orchestration still has local state and should consume the projection more deeply in a later sprint.
- Mission intelligence persistence is still a separate future sprint.
- Priority ranking remains a later dependency.
- Manual desktop reload verification should be repeated after the next persistence-focused sprint.

## Recommendation

Proceed to the next dependency sprint: Headquarters Priority Engine.
