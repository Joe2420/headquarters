# Technology Stack

    **Owner:** Engineering  
    **Status:** Engineering Blueprint  
    **Baseline:** HDR v1.0 Design Freeze  
    **Purpose:** Convert the locked Headquarters design into buildable implementation guidance.

    ---


Recommended initial stack:

- **Desktop shell:** Tauri v2 preferred. Electron acceptable fallback.
- **Frontend:** React + TypeScript.
- **Styling:** CSS modules or Tailwind with strict design tokens.
- **State:** Zustand for client state; xstate optional for formal state machines.
- **Database:** SQLite local-first.
- **Database access:** TypeScript repository layer; migrations managed in code.
- **Runtime events:** typed internal event bus.
- **Charts/visuals:** lightweight custom SVG/canvas for Headquarters visuals.
- **AI:** provider-agnostic orchestration layer; can start rule-based and later connect to LLM/local model.
- **Testing:** Vitest, Playwright, SQLite migration tests.

Reasoning:
The first version must be fast, local, private, and stable. The app should feel like an installed professional tool, not a website.


    ---

    ## Acceptance Criteria

    - The implementation can be traced back to HDR v1.0.
    - No new product philosophy is introduced here.
    - The document gives Codex/developers actionable engineering direction.
    - Any unresolved item is marked as an implementation decision, not hidden.
