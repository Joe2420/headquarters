# Sprint 51 - Headquarters Intelligence Graph and Cross-Mission Analytics Review

## Scope

Sprint 51 added a deterministic cross-mission Intelligence foundation. The system connects recorded Headquarters evidence across missions without market prediction, external AI, unsupported causation, or profitability-first scoring.

## Graph Contracts

The authoritative Intelligence Graph contracts live in `packages/hqos`.

- `HeadquartersIntelligenceGraph`
- `IntelligenceNode`
- `IntelligenceEdge`
- `IntelligenceEvidenceReference`
- `IntelligencePattern`
- `IntelligenceInsight`
- `IntelligenceTrend`
- immutable graph snapshots and read queries

Every node and edge requires evidence references. Edge strength is qualitative: weak, supported, repeated, or strong.

## Graph Builder

The graph builder creates deterministic graph nodes and relationships from authoritative Headquarters evidence:

- Missions
- Mission Replay
- Mission Evaluation
- Journal entries
- Doctrine candidates and accepted Doctrine
- Guardian alerts
- Operational consequences and recovery evidence
- Academy growth
- Commander Relationship evidence

Rebuilding from identical evidence produces identical graph identity and duplicate processing is deduplicated.

## Normalization and Similarity Policy

Sprint 51 added explicit safe normalization rules.

Allowed:

- casing and whitespace normalization
- known market aliases
- approved yes/no variants
- approved lifecycle and structured answer aliases
- exact Doctrine duplicate detection

Forbidden:

- diagnosing emotion
- equating nuanced journal text with Doctrine
- inferring causation from co-occurrence
- using fuzzy AI or external similarity services
- treating loosely similar text as the same rule

Similarity levels are exact, normalized_exact, related, and insufficient_evidence.

## Pattern Rules

Cross-mission patterns require multiple distinct missions. A single mission cannot create a cross-mission behavioral pattern.

Strength rules:

- emerging: at least two distinct supporting missions
- supported: at least three distinct supporting missions
- repeated: at least five distinct supporting missions
- established: sustained evidence with limited contradiction

Contradictory evidence remains visible and may block or limit a pattern.

## Trend Windows

Trend analysis is qualitative and windowed.

- recent window defaults to the last five observations
- comparison window defaults to the prior five observations
- sample size is exposed
- duplicate evidence is deduplicated
- PnL is excluded from behavior trends

Trend states include improving, stable, declining, inconsistent, insufficient_history, recovered, and newly_emerging.

## Insight Derivation

The Insight Engine converts patterns and trends into evidence-backed Intelligence insights.

Each insight includes:

- category
- concise summary
- relevance
- urgency
- strength
- supporting evidence
- contradictory missions
- recommended room
- recommended action

Insights cannot contain market-prediction language.

## Historical Relevance

The historical relevance engine identifies prior missions related to the active mission only when multiple supported dimensions match.

Rules:

- same market alone is insufficient
- current mission is excluded
- important differences are shown
- Mission Replay links are preserved
- no result prediction is allowed

## Commander Integration

Commander guidance can selectively reference one Intelligence insight or similar mission. Intelligence does not speak directly. Commander remains the sole operational voice.

Safeguards:

- duplicate insight references are suppressed
- similar mission references include important differences
- background insights remain quiet
- unsupported labels such as "you always do this" are blocked

## Intelligence Room

The Intelligence Room now has a cross-mission analysis experience:

- Intelligence Brief
- Pattern Board
- Evidence Network
- Similar Missions
- Trend Review
- Intelligence History

The room uses authoritative HQOS insight outputs and does not own pattern calculations inside React.

## Priority Integration

Intelligence priority integration maps insights into Commander-owned attention requests.

Policy:

- immediate: critical current mission contradiction or recurring risk
- safe point: repeated process failure or Doctrine conflict
- standby: sustained improvement or training focus
- background: weak or non-actionable similarity

Resolved insights clear active requests.

## Persistence and History

Sprint 51 added an HQOS Intelligence history repository contract with deterministic in-memory implementation for graph snapshots, patterns, insights, review state, resolution state, and ordered history.

No database migration was added in this sprint. Durable SQLite storage remains a future infrastructure task if Founder approval requires it.

## Manual Verification Scenarios

Scenario A - New operator with one mission:
Expected insufficient history; no unsupported cross-mission pattern.

Scenario B - Repeated risk adherence:
Expected risk discipline pattern once distinct mission threshold is met.

Scenario C - Repeated premature authorization:
Expected authorization pattern with supporting evidence and War Room relevance.

Scenario D - Contradictory history:
Expected contradiction remains visible and strength stays limited.

Scenario E - Similar historical mission:
Expected matched dimensions and important differences; no prediction.

Scenario F - Sustained improvement:
Expected improving trend and Commander may acknowledge carefully.

Scenario G - Reload:
Expected graph snapshot, active insights, reviewed state, and history restore from repository state without duplication.

Scenario H - Intelligence Room:
Expected calm cross-mission Intelligence brief, evidence network, patterns, trends, and no dashboard overload.

## Known Limitations

- SQLite-backed Intelligence history persistence is not implemented.
- The Intelligence Room currently renders the cross-mission surface with calm empty state until repository-backed insights are wired in.
- Rich replay opening from Similar Missions remains future UI wiring.
- More evidence adapters can be added as Journal, Doctrine, Guardian, Academy, and Archive contracts mature.

## Next Sprint Recommendation

Sprint 52 should wire repository-backed Intelligence Graph projections into the desktop runtime and Archive/Debrief flows, while preserving the same HQOS-owned graph and insight rules.
