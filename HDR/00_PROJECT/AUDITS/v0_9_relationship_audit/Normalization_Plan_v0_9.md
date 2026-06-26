# HDR v0.9 — Normalization Plan

**Purpose:** Convert recovered phase files into permanent HDR structure.

## Rules
1. `13_PHASE_RECOVERY` remains a staging archive until normalization is complete.
2. Every recovered object must either be migrated, merged, superseded, or retired.
3. No recovered object should be deleted without an archive record.
4. The final HDR v1.0 repository should not rely on the recovery folder for active specifications.

## Migration Strategy
- Constitution and culture objects → `01_CONSTITUTION/`
- Institutional departments and roles → `02_INSTITUTION/`
- Room and environment objects → `03_BUILDING/`
- Operator psychology and behavior systems → `04_OPERATOR/`
- Mission, campaign, Guardian, and recovery flows → `05_OPERATIONS/`
- AI, Council, pattern recognition, Ghost, and intelligence systems → `06_INTELLIGENCE/`
- HQOS, event bus, state engine, services → `07_HQOS/`
- Archive, memory, database, time capsules → `08_ARCHIVES/`
- Screens, UI, motion, audio, lighting → `09_INTERFACE/`
- Engineering standards, repository process, testing → `10_ENGINEERING/`
- Training, Academy, simulations, certifications → `11_ACADEMY/`
- Founder, legacy, evolution doctrine → `12_LEGACY/`

## Normalization Outputs
- `Master_Index_v1_0_candidate.csv`
- `Dependency_Graph_v1_0_candidate.csv`
- `Canonical_File_Map_v1_0_candidate.csv`
- `Duplicate_Merge_Report_v1_0_candidate.md`
- `HDR_v1_0_Design_Freeze_Candidate.zip`
