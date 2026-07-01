# Release Candidate Readiness Checklist

## Scope

HIG-TASK-099 prepares the release-candidate readiness package. It does not release Headquarters.

## Release Candidate Gates

- Typecheck, lint, test, and build must pass on `develop`.
- Desktop startup must remain free of visible startup errors.
- All Headquarters rooms must remain reachable through the established room architecture.
- Backup and import/export foundations must remain deterministic and safely validated.
- Known limitations must be carried forward into the beta handoff.

## Packaging Status

Packaging and signing are not completed by this checklist. They require Founder approval before release work begins.

## Founder Approval Requirement

Headquarters must not be labeled, packaged, or distributed as a release candidate without explicit Founder approval.
