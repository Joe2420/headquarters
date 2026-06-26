# Desktop App Architecture

    **Owner:** Desktop Engineering  
    **Status:** Engineering Blueprint  
    **Baseline:** HDR v1.0 Design Freeze  
    **Purpose:** Convert the locked Headquarters design into buildable implementation guidance.

    ---


The desktop app has three layers:

1. **Shell Layer**
   - Window management.
   - Local file permissions.
   - Safe filesystem access.
   - App lifecycle events.

2. **Headquarters Runtime Layer**
   - HQOS heartbeat.
   - Mission state.
   - Room navigation.
   - Service orchestration.

3. **Interface Layer**
   - Rooms.
   - Panels.
   - Animations.
   - Audio triggers.

The shell must not contain product logic. All Headquarters logic lives in packages.


    ---

    ## Acceptance Criteria

    - The implementation can be traced back to HDR v1.0.
    - No new product philosophy is introduced here.
    - The document gives Codex/developers actionable engineering direction.
    - Any unresolved item is marked as an implementation decision, not hidden.
