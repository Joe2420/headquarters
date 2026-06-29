# Mission Authorization Desktop Experience

HIG Task: HIG-TASK-028 - Mission Authorization

HQ Task: HQ-TASK-0065 - Mission Authorization

## Scope Confirmed

- The desktop Command Center now exposes a mission authorization panel.
- Authorization uses deterministic rule-based fields aligned with the existing HQOS authorization contract: operator justification and invalidation.
- Complete manual authorization fields approve the request.
- Missing manual authorization evidence denies the request.

## Boundaries

- No market prediction behavior was introduced.
- No future lifecycle transitions were introduced.
- No EventBus publishing, database schema changes, Guardian, Academy, or journal behavior was introduced.
- The panel remains inside the existing desktop mission operations surface.

## Verification

- Renderer tests verify approval and denial outcomes.
- Renderer tests verify authorization status formatting.
- The Command Center render test verifies the authorization surface is present.
