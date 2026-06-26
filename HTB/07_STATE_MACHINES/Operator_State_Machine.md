# Operator State Machine

    **Owner:** HQOS  
    **Status:** Engineering Blueprint  
    **Baseline:** HDR v1.0 Design Freeze  
    **Purpose:** Convert the locked Headquarters design into buildable implementation guidance.

    ---


Operator state tracks readiness, command authority, and identity drift.

Primary states:
- civilian
- reporting_for_duty
- command_assumed
- prepared
- observing
- deploying
- recovering
- off_duty

Identity labels:
- Professional Joe
- Civilian Joe
- Impatient Joe
- Greedy Joe
- Fearful Joe
- Guardian Joe
- Research Joe
- Instructor Joe

Identity labels are descriptive telemetry, never insults.


    ---

    ## Acceptance Criteria

    - The implementation can be traced back to HDR v1.0.
    - No new product philosophy is introduced here.
    - The document gives Codex/developers actionable engineering direction.
    - Any unresolved item is marked as an implementation decision, not hidden.
