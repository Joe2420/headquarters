import { describe, expect, it } from 'vitest';
import { detectCrossMissionPatterns, type CrossMissionPatternEvidence } from './CrossMissionPatternEngine';

describe('CrossMissionPatternEngine', () => {
  it('does not create a cross-mission pattern from one occurrence', () => {
    const patterns = detectCrossMissionPatterns({
      evidence: [evidence('mission-1', 'repeated_risk_adherence')],
    });

    expect(patterns).toEqual([]);
  });

  it('creates a supported pattern from repeated distinct mission evidence', () => {
    const patterns = detectCrossMissionPatterns({
      evidence: [
        evidence('mission-1', 'repeated_risk_adherence'),
        evidence('mission-2', 'repeated_risk_adherence'),
        evidence('mission-3', 'repeated_risk_adherence'),
      ],
    });

    expect(patterns[0]?.strength).toBe('supported');
    expect(patterns[0]?.evidenceMissionIds).toEqual(['mission-1', 'mission-2', 'mission-3']);
    expect(patterns[0]?.recommendedUse).toContain('risk adherence');
  });

  it('keeps contradictory evidence visible and limits strength', () => {
    const patterns = detectCrossMissionPatterns({
      evidence: [
        evidence('mission-1', 'repeated_authorization_gap'),
        evidence('mission-2', 'repeated_authorization_gap'),
        evidence('mission-3', 'repeated_authorization_gap'),
        evidence('mission-4', 'repeated_authorization_gap', 'contradictory'),
      ],
    });

    expect(patterns[0]?.contradictoryEvidence).toHaveLength(1);
    expect(patterns[0]?.trend).toBe('mixed');
  });

  it('does not treat profitable trades as behavior patterns', () => {
    const patterns = detectCrossMissionPatterns({
      evidence: [
        evidence('mission-1', 'repeated_strength', 'supporting', true),
        evidence('mission-2', 'repeated_strength', 'supporting', true),
        evidence('mission-3', 'repeated_strength', 'supporting', true),
      ],
    });

    expect(patterns).toEqual([]);
  });

  it('deduplicates duplicate mission evidence and marks resolved issues historical', () => {
    const duplicate = evidence('mission-1', 'unresolved_recurring_issue', 'supporting', false, true);
    const patterns = detectCrossMissionPatterns({
      evidence: [
        duplicate,
        duplicate,
        evidence('mission-2', 'unresolved_recurring_issue', 'supporting', false, true),
      ],
    });

    expect(patterns[0]?.occurrenceCount).toBe(2);
    expect(patterns[0]?.status).toBe('resolved');
    expect(patterns[0]?.trend).toBe('improving');
  });
});

function evidence(
  missionId: string,
  category: CrossMissionPatternEvidence['category'],
  polarity: CrossMissionPatternEvidence['polarity'] = 'supporting',
  excludesBehaviorPattern = false,
  resolved = false,
): CrossMissionPatternEvidence {
  return {
    evidenceId: `${missionId}:${category}:${polarity}`,
    missionId,
    category,
    title: category,
    summary: `${category} evidence from ${missionId}.`,
    occurredAt: `2026-07-1${missionId.slice(-1)}T00:00:00.000Z`,
    nodeId: `node:${missionId}`,
    sourceSubsystem: 'evaluation',
    polarity,
    excludesBehaviorPattern,
    resolved,
  };
}
