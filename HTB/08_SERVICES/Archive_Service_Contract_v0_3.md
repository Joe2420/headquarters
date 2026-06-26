# Archive Service Contract v0.3

Status: Engineering Ready
Owner: Historian

## Responsibilities
Writes permanent mission artifacts and enables retrieval.

## Required Artifacts Per Mission
1. Mission Report
2. Behavior Report
3. Decision Report
4. Intelligence Report
5. Doctrine Report

## Public Methods
```ts
writeMissionArtifacts(missionId: string): Promise<ArchiveBundle>;
retrieveMissionArchive(missionId: string): Promise<ArchiveBundle>;
searchArchives(query: ArchiveSearchQuery): Promise<ArchiveSearchResult[]>;
writeBlackBox(missionId: string): Promise<BlackBoxRecord>;
```

## Acceptance Criteria
A mission cannot enter archived state until all required artifacts are written or explicitly marked unavailable with reason.
