# Sprint 1 Foundation Tasks v0.3

Status: Engineering Ready
Owner: Engineering

## Goal
Create the minimal runnable Headquarters desktop shell with HQOS, SQLite, event bus, and first mission flow.

## Tasks
1. Initialize monorepo.
2. Create Electron desktop shell.
3. Add React renderer.
4. Add packages/domain.
5. Add packages/hqos.
6. Add packages/database.
7. Implement SQLite migration runner.
8. Implement EventEnvelope and EventBusService.
9. Implement Mission state machine.
10. Implement first-run database creation.
11. Implement basic Command Center route.
12. Implement Mission Board placeholder.
13. Implement create mission flow.
14. Implement archive write placeholder.
15. Add unit tests for EventBus and Mission state machine.
16. Add build command.

## Definition of Done
Operator can launch app, pass boot sequence, assume command, create a mission, move through briefing/observation/debrief/archive, and close app without data loss.
