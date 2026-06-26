# Council Orchestration

    **Owner:** AI Engineering  
    **Status:** Engineering Blueprint  
    **Baseline:** HDR v1.0 Design Freeze  
    **Purpose:** Convert the locked Headquarters design into buildable implementation guidance.

    ---


The Council aggregates department assessments before Commander output.

Flow:
1. Build CouncilContext.
2. Query required departments.
3. Normalize confidence.
4. Check emergency authority.
5. Decide whether silence is better than communication.
6. If message is required, Commander synthesizes one concise output.

Default rule:
No department speaks directly to the Operator during normal operations. Commander delivers institutional synthesis.


    ---

    ## Acceptance Criteria

    - The implementation can be traced back to HDR v1.0.
    - No new product philosophy is introduced here.
    - The document gives Codex/developers actionable engineering direction.
    - Any unresolved item is marked as an implementation decision, not hidden.
