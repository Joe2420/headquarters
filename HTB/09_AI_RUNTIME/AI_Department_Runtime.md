# AI Department Runtime

    **Owner:** AI Engineering  
    **Status:** Engineering Blueprint  
    **Baseline:** HDR v1.0 Design Freeze  
    **Purpose:** Convert the locked Headquarters design into buildable implementation guidance.

    ---


AI departments are implemented as role-specific agents behind a common interface.

Interface:
```ts
interface DepartmentAgent {
  id: DepartmentId;
  evaluate(context: CouncilContext): Promise<DepartmentAssessment>;
}
```

DepartmentAssessment includes:
- confidence
- risk_level
- suggested_action
- evidence_refs
- message_candidate optional

Initial agents can be deterministic/rule-based. LLM integration comes later behind the same interface.


    ---

    ## Acceptance Criteria

    - The implementation can be traced back to HDR v1.0.
    - No new product philosophy is introduced here.
    - The document gives Codex/developers actionable engineering direction.
    - Any unresolved item is marked as an implementation decision, not hidden.
