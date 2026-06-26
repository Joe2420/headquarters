# Mission State Machine

    **Owner:** HQOS  
    **Status:** Engineering Blueprint  
    **Baseline:** HDR v1.0 Design Freeze  
    **Purpose:** Convert the locked Headquarters design into buildable implementation guidance.

    ---


Mission states:

```text
idle
→ preparing
→ briefing
→ ready_room
→ observation
→ authorization_pending
→ authorized
→ deployed
→ managing
→ return_to_base
→ debrief_pending
→ archived
→ closed
```

Emergency branch:
```text
any active state → guardian_lock → recovery → debrief_pending
```

Rules:
- No deployment without authorization event.
- Debrief is required before archive.
- Archive is required before mission close.
- Guardian may recommend lock; Operator remains responsible unless user-configured hard lock is enabled.


    ---

    ## Acceptance Criteria

    - The implementation can be traced back to HDR v1.0.
    - No new product philosophy is introduced here.
    - The document gives Codex/developers actionable engineering direction.
    - Any unresolved item is marked as an implementation decision, not hidden.
