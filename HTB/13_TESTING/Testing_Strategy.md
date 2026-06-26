# Testing Strategy

    **Owner:** QA  
    **Status:** Engineering Blueprint  
    **Baseline:** HDR v1.0 Design Freeze  
    **Purpose:** Convert the locked Headquarters design into buildable implementation guidance.

    ---


Testing layers:

- Unit tests for services and utilities.
- State-machine transition tests.
- Event bus contract tests.
- SQLite migration and repository tests.
- AI department deterministic fixture tests.
- Playwright UX flow tests.
- Accessibility tests for reduced motion and reduced audio.
- Snapshot tests for design tokens.

Critical test: Mission lifecycle must be reconstructable from event history.


    ---

    ## Acceptance Criteria

    - The implementation can be traced back to HDR v1.0.
    - No new product philosophy is introduced here.
    - The document gives Codex/developers actionable engineering direction.
    - Any unresolved item is marked as an implementation decision, not hidden.
