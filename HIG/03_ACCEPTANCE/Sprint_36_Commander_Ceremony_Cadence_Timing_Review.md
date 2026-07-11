# Sprint 36 - Commander Ceremony Cadence and Timing Refinement Review

## Scope

Sprint 36 gives Commander ceremony transmissions a dedicated transmission cadence.

This sprint does not add backend behavior, database schema, AI, audio playback, mission lifecycle states, or new room navigation.

## Ceremony Cadence

Ceremony transmissions now carry optional timing metadata used by the existing Commander chat typewriter path.

The cadence is:

- slower and more deliberate for formal/calm/protective ceremonies
- faster and more direct for War Room authorization moments
- more reflective for return-to-base and debrief moments

## Integration Notes

- Normal room dialogue still uses the active room dialogue profile.
- Ceremony timing applies only to ceremony transmissions.
- Delivered ceremony messages remain static text.
- Queued Commander messages still transmit sequentially.

## Acceptance Notes

- Commander ceremonies feel more deliberate without adding new UI surfaces.
- The green Commander chat remains the primary interface.
- Existing mission progression and backend behavior are unchanged.

## Remaining Gaps

- Ceremony cadence is deterministic but not yet user-configurable.
- Future audio hooks may align sound timing to this same ceremony cadence.

## Recommendation

Proceed to the next dependency sprint: Commander Ceremony Audio Candidate Alignment.
