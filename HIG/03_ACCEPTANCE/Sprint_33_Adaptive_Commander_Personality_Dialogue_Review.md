# Sprint 33 - Adaptive Commander Personality and Dialogue Engine Review

## Scope

Sprint 33 adds a deterministic Commander dialogue profile layer.

This sprint does not add AI, generated speech, backend behavior, database schema, or new mission functionality. It shapes the existing Commander chat through room-specific cadence, posture, and transmission timing.

## Dialogue Profiles

Each Commander room now has a dialogue profile defining:

- cadence
- posture
- physical presence line
- instruction style
- response rule
- transmission timing

The profiles cover:

- Command Center
- Ready Room
- Observation Room
- War Room
- Debrief Theater
- Archive
- Journal
- Doctrine
- Academy
- Guardian Wing
- Intelligence Office
- Settings

## Commander Chat Integration

The existing green Commander chat remains intact.

The Commander shell now exposes the active dialogue cadence and posture through stable renderer state, and the typewriter transmission uses room-specific timing. Delivered messages remain static and the existing queue model remains responsible for sequential transmission.

## Room Pacing

Room pacing now differs intentionally:

- Ready Room is patient.
- Observation is slow.
- War Room is direct.
- Debrief is reflective.
- Archive and Doctrine are formal.
- Guardian is firm.
- Intelligence is analytical.

## Acceptance Notes

- Dialogue profiles are deterministic.
- Every Commander room has a profile.
- Observation transmits slower than War Room.
- The existing Commander chat, room navigation, mission lifecycle, and persistence behavior are unchanged.
- No audio, AI, or network behavior was introduced.

## Remaining Gaps

- The profile layer does not yet vary phrasing by long-term behavioral confidence.
- Future work can connect dialogue profiles to more detailed ceremony text and room-specific message libraries.

## Recommendation

Proceed to the next dependency sprint: Commander Ceremony Dialogue Expansion.
