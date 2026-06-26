# Core UI Component Specs v0.2

## CommandButton
Purpose: primary institutional action button.
Rules:
- One primary CommandButton per screen.
- Text uses operational language: REPORT FOR DUTY, ASSUME COMMAND, REQUEST AUTHORIZATION, RETURN TO BASE.
- No decorative hover effects.

## MissionBoard
Purpose: mission context, not market context.
Displays:
- campaign
- mission objective
- condition
- command authority
- current state
Never displays:
- PnL as primary element
- social content
- market predictions

## ArtificialHorizon
Purpose: subtle operator-stability instrument.
Behavior:
- level when behavior is stable
- slight tilt when drift increases
- never flashes
- supports reduced-motion mode

## OperatorCompass
Purpose: behavioral gyroscope.
Shows drift direction toward/away from Professional Joe.
Never becomes a trading signal.

## GuardianPanel
Purpose: protection status.
States:
- standby
- monitoring
- attention
- intervention
- lock

## BlackBoxTimeline
Purpose: reconstruct behavioral sequence.
Must display events before outcome.

## ArchiveCard
Purpose: represent permanent institutional memory.
Must feel like record retrieval, not dashboard card.

## Acceptance Criteria
- Components render entirely from state and props.
- Components do not directly perform database writes.
- Components publish user-intent events to HQOS.
