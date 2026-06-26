# HTB v0.2 Changelog

Status: Active technical expansion  
Base: HTB v0.1  
Focus: database schema, event contracts, state-machine diagrams, service contracts, and Codex implementation boundaries.

## Added
- Detailed SQLite schema specification.
- Initial migration plan.
- Event contract catalogue with payload shapes.
- HQOS event bus architecture.
- Mission, Operator, Guardian, Campaign, Recovery, and Archive state-machine diagrams.
- Service contracts for core runtime modules.
- AI department input/output contracts.
- UI component implementation rules.
- Acceptance criteria for the first engineering milestone.

## Engineering Decision
HTB v0.2 formalizes Headquarters as an event-sourced local-first desktop application. SQLite is the institutional archive. The event bus is the operational nervous system. React renders rooms from state. AI departments read evidence and produce recommendations, but never directly mutate mission state without HQOS authorization.
