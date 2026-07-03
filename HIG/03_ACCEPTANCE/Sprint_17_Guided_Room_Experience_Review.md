# Sprint 17 Guided Room Experience Review

## Scope

Sprint 17 moves the mission path from page-like panels toward guided operational rooms. The work preserves existing desktop behavior while standardizing the room sequence:

Commander -> Room title -> Current objective -> Primary action -> Workspace -> Timeline / history -> Secondary tools.

## GuidedRoom Component

- Added `GuidedRoom` as the reusable renderer component for Commander-led rooms.
- The component carries room identity and atmosphere attributes for the existing navigation and atmosphere layers.
- Timeline/history and secondary tools render collapsed by default so the current objective and workspace remain primary.

## Ready Room

- Ready Room now presents preparation as the main experience.
- Commander guidance appears first.
- The primary action is Begin Observation.
- Daily orders, oath, and locker state remain available but no longer compete with the main workflow.

## Observation Room

- Observation now centers calm observation state and timeline context.
- Authorization controls are absent from the room.
- Secondary observation instruments are collapsed behind the current workspace.
- War Room remains unlocked only by the mission lifecycle after observation completion.

## War Room

- War Room now presents one decision: authorization.
- Commander explains authorization denial when evidence is incomplete.
- Guardian and comparison surfaces are secondary tools.
- The no-broker-control boundary remains explicit.

## Debrief Theater

- Debrief now starts with behavior sequence.
- Behavior summary, reflection, and lesson appear before archive.
- Timeline and decision report are available without replacing reflection as the main objective.
- Archive remains a later Commander action after debrief completion.

## Archive

- Archive now reads as a historical dossier.
- Mission summaries, event inspection, sessions, journal archive, doctrine records, and search remain available.
- Chronological record and preserved mission memory are primary.
- The room avoids CRUD framing.

## Remaining Rooms

Journal, Doctrine, Academy, Guardian, and Intelligence retain their existing support-room workflows. They already sit behind secondary navigation and were not rewritten in this sprint.

## UX Risks

- Some mission controls now live primarily in the Commander top workflow, so manual testers should verify the top Continue action in every mission phase.
- Command Center still contains richer Commander overview material and may need the same GuidedRoom treatment in a later sprint.
- The desktop app still keeps sidebar recovery navigation during beta.

## Recommendation for Sprint 18

Sprint 18 should extend the guided room pattern to support rooms and add an explicit Commander-led mission creation surface so no-active-mission startup feels as guided as the active mission path.
