# Rule-Based First Runtime v0.3

Status: Engineering Ready
Owner: AI Runtime

## Principle
Headquarters must not depend on an LLM for core safety, mission lifecycle, Guardian, or archive behavior.

## Runtime Layers
1. Deterministic rules and state machines.
2. Statistical summaries from local archives.
3. Similarity search over historical missions.
4. Optional LLM phrasing layer.

## LLM Boundaries
LLMs may phrase Commander messages, summarize archive data, and assist debrief review. They may not directly authorize trades, modify doctrine, or override Guardian state.

## Acceptance Criteria
The application remains functional offline without LLM access.
