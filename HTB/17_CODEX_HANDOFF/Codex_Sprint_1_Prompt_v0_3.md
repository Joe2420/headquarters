# Codex Sprint 1 Prompt v0.3

Status: Engineering Ready
Owner: Engineering

## Instruction
Implement Sprint 1 only. Do not invent new features. Follow HTB files exactly.

## Required Inputs
- HTB/02_MONOREPO/Package_Boundaries_v0_3.md
- HTB/03_DESKTOP_APP/Electron_IPC_Contract_v0_3.md
- HTB/04_HQOS/Event_Envelope_Spec_v0_3.md
- HTB/04_HQOS/HQOS_Service_Registry_v0_3.md
- HTB/05_DATABASE/SQLite_Schema_v1.md
- HTB/05_DATABASE/Repository_Pattern_v0_3.md
- HTB/06_EVENTS/Core_Event_Contracts_v0_3.md
- HTB/07_STATE_MACHINES/Mission_State_Machine.md
- HTB/16_IMPLEMENTATION_ROADMAP/Sprint_1_Foundation_Tasks_v0_3.md

## Hard Constraints
- Do not add broker integration.
- Do not add market prediction.
- Do not add cloud sync.
- Do not implement untyped IPC.
- Do not let React components call SQLite directly.

## Output Expected
A runnable desktop shell with persisted mission lifecycle.
