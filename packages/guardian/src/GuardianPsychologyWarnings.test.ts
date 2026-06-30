import { describe, expect, it } from 'vitest';
import { buildGuardianPsychologyWarnings } from './GuardianPsychologyWarnings';

describe('Guardian psychology warnings', () => {
  it('builds deterministic calm warnings from approved behavior evidence', () => {
    const warnings = buildGuardianPsychologyWarnings([
      {
        id: 'journal-001',
        signal: 'revenge_language',
        source: 'journal',
        excerpt: 'I want to win it back.',
      },
      {
        id: 'debrief-001',
        signal: 'rule_negotiation',
        source: 'mission_debrief',
        excerpt: 'Maybe the rule can bend this one time.',
      },
    ]);

    expect(warnings).toEqual([
      {
        id: 'guardian-warning-journal-001',
        signal: 'revenge_language',
        message: 'Pause and return to the plan before continuing.',
        evidenceId: 'journal-001',
      },
      {
        id: 'guardian-warning-debrief-001',
        signal: 'rule_negotiation',
        message: 'Rule negotiation is present; follow the accepted doctrine before acting.',
        evidenceId: 'debrief-001',
      },
    ]);
  });

  it('does not predict market direction', () => {
    const [warning] = buildGuardianPsychologyWarnings([
      {
        id: 'journal-002',
        signal: 'fomo_language',
        source: 'journal',
        excerpt: 'This move is leaving without me.',
      },
    ]);

    expect(warning?.message).toBe('Opportunity pressure is present; wait for confirmed process evidence.');
    expect(warning?.message.toLowerCase()).not.toContain('market will');
  });
});
