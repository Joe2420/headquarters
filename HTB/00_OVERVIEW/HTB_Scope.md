# HTB Scope

    **Owner:** Chief Systems Architect  
    **Status:** Engineering Blueprint  
    **Baseline:** HDR v1.0 Design Freeze  
    **Purpose:** Convert the locked Headquarters design into buildable implementation guidance.

    ---


HTB covers the first production-capable desktop implementation of Headquarters.

Included:
- Desktop application architecture.
- Monorepo structure.
- SQLite-backed local-first data model.
- HQOS event-driven runtime.
- Room navigation and state engines.
- AI department orchestration layer.
- Component and service inventories.
- Codex implementation handoff.

Excluded from first implementation:
- Broker execution automation.
- Market prediction.
- Social features.
- Copy trading.
- Cloud account sync.
- Mobile apps.

Headquarters remains battlefield-independent. The app observes, prepares, records, and guides the Operator; it does not execute trades.


    ---

    ## Acceptance Criteria

    - The implementation can be traced back to HDR v1.0.
    - No new product philosophy is introduced here.
    - The document gives Codex/developers actionable engineering direction.
    - Any unresolved item is marked as an implementation decision, not hidden.
