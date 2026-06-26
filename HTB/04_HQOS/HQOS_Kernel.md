# HQOS Kernel

    **Owner:** HQOS  
    **Status:** Engineering Blueprint  
    **Baseline:** HDR v1.0 Design Freeze  
    **Purpose:** Convert the locked Headquarters design into buildable implementation guidance.

    ---


HQOS is the invisible operating layer of Headquarters.

Core responsibilities:
- Maintain one authoritative application state.
- Emit and route events.
- Run the heartbeat.
- Coordinate services.
- Control mission lifecycle.
- Trigger room/environment state.
- Queue archive writes.
- Provide hooks for AI departments.

Core loop:
```text
Observe → Understand → Evaluate → Decide → Preserve → Learn → Repeat
```

HQOS does not render UI. It publishes state and events. UI subscribes.


    ---

    ## Acceptance Criteria

    - The implementation can be traced back to HDR v1.0.
    - No new product philosophy is introduced here.
    - The document gives Codex/developers actionable engineering direction.
    - Any unresolved item is marked as an implementation decision, not hidden.
