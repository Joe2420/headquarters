# Event Catalog v1

    **Owner:** HQOS  
    **Status:** Engineering Blueprint  
    **Baseline:** HDR v1.0 Design Freeze  
    **Purpose:** Convert the locked Headquarters design into buildable implementation guidance.

    ---


Initial event families:

- `app.boot.started`
- `app.boot.completed`
- `operator.command.accepted`
- `operator.command.released`
- `mission.created`
- `mission.briefing.completed`
- `mission.observation.started`
- `mission.authorization.requested`
- `mission.authorization.granted`
- `mission.authorization.denied`
- `mission.deployment.confirmed`
- `mission.return_to_base.requested`
- `mission.debrief.completed`
- `mission.archived`
- `guardian.intervention.raised`
- `guardian.lock.activated`
- `identity.drift.detected`
- `behavior.noise_floor.exceeded`
- `archive.write.queued`
- `system.night_operations.started`

Every event includes:
- id
- type
- timestamp
- source
- mission_id optional
- payload
- correlation_id


    ---

    ## Acceptance Criteria

    - The implementation can be traced back to HDR v1.0.
    - No new product philosophy is introduced here.
    - The document gives Codex/developers actionable engineering direction.
    - Any unresolved item is marked as an implementation decision, not hidden.
