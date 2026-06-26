# Privacy and Local-First Architecture

    **Owner:** Security  
    **Status:** Engineering Blueprint  
    **Baseline:** HDR v1.0 Design Freeze  
    **Purpose:** Convert the locked Headquarters design into buildable implementation guidance.

    ---


Headquarters starts local-first.

Principles:
- User owns their data.
- SQLite database is local by default.
- No broker credentials are stored in v1.
- No execution automation in v1.
- Export and backup must be simple.
- Optional encryption should be planned.

Future cloud sync must be optional and must not weaken local ownership.


    ---

    ## Acceptance Criteria

    - The implementation can be traced back to HDR v1.0.
    - No new product philosophy is introduced here.
    - The document gives Codex/developers actionable engineering direction.
    - Any unresolved item is marked as an implementation decision, not hidden.
