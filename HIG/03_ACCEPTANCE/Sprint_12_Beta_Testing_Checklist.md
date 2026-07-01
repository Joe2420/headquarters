# Sprint 12 Beta Testing Checklist

## Scope

HIG-TASK-097 prepares Headquarters beta testing without adding runtime behavior.

## Required Verification

- Desktop launches without startup errors.
- Report for Duty reaches the Command Center.
- Primary navigation reaches each Headquarters room.
- Mission, Journal, Doctrine, Academy, Guardian, Archive Intelligence, Commander, and Intelligence Office surfaces render without runtime errors.
- Startup status, recovery guidance, performance status, backup foundation, and import/export validation remain covered by tests.

## Validation Commands

- `corepack pnpm typecheck`
- `corepack pnpm lint`
- `corepack pnpm test`
- `corepack pnpm build`

## Known Limitations

- Backup and import/export are foundations only; no desktop file picker or download workflow is approved yet.
- Recovery guidance is explicit and safe, but automatic retry/rebuild behavior is not implemented.
- Beta testing requires Founder review before release-candidate labeling.
