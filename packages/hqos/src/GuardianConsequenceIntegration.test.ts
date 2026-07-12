import { describe, expect, it } from 'vitest';
import {
  buildCommanderConsequenceSignal,
  deriveGuardianConsequences,
  resolveGuardianRecoveryCandidate,
} from './GuardianConsequenceIntegration';

describe('GuardianConsequenceIntegration', () => {
  it('creates blocking consequence for Guardian lockout', () => {
    const result = deriveGuardianConsequences({
      missionId: 'mission-guardian',
      evaluatedAt,
      guardianAlerts: [{
        id: 'guardian-lockout',
        level: 'lockout',
        title: 'Guardian lockout',
        message: 'Risk boundary exceeded.',
        ruleId: 'daily-risk-limit',
      }],
    });

    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0]?.severity).toBe('lockout');
    expect(result.candidates[0]?.type).toBe('guardian_lockout');
  });

  it('keeps Guardian caution non-blocking', () => {
    const result = deriveGuardianConsequences({
      missionId: 'mission-guardian',
      evaluatedAt,
      guardianAlerts: [{
        id: 'guardian-caution',
        level: 'caution',
        title: 'Guardian caution',
        message: 'Operator condition should be reviewed.',
      }],
    });

    expect(result.candidates[0]?.severity).toBe('caution');
    expect(buildCommanderConsequenceSignal(result.candidates[0]!).blocking).toBe(false);
  });

  it('deduplicates duplicate Guardian alerts against active consequences', () => {
    const first = deriveGuardianConsequences({
      missionId: 'mission-guardian',
      evaluatedAt,
      guardianAlerts: [guardianWarning],
    });
    const second = deriveGuardianConsequences({
      missionId: 'mission-guardian',
      evaluatedAt,
      guardianAlerts: [guardianWarning],
      existingConsequences: first.candidates,
    });

    expect(first.candidates).toHaveLength(1);
    expect(second.candidates).toEqual([]);
  });

  it('creates structured Commander consequence signal without raw chat text', () => {
    const [consequence] = deriveGuardianConsequences({
      missionId: 'mission-guardian',
      evaluatedAt,
      guardianAlerts: [guardianWarning],
    }).candidates;

    const signal = buildCommanderConsequenceSignal(consequence!);

    expect(signal.rule).toBe('risk-rule');
    expect(signal.operationalEffect).toBe('Commander guidance becomes more conservative.');
    expect(signal.requiredRecoveryAction).toBe('Review and resolve the Guardian condition.');
  });

  it('matches resolved Guardian alerts to recovery candidates', () => {
    const [consequence] = deriveGuardianConsequences({
      missionId: 'mission-guardian',
      evaluatedAt,
      guardianAlerts: [guardianWarning],
    }).candidates;

    expect(resolveGuardianRecoveryCandidate(consequence!, ['guardian-warning'])).toBe(true);
    expect(resolveGuardianRecoveryCandidate(consequence!, ['other-alert'])).toBe(false);
  });
});

const evaluatedAt = '2026-07-12T13:00:00.000Z';
const guardianWarning = {
  id: 'guardian-warning',
  level: 'warning' as const,
  title: 'Guardian warning',
  message: 'Risk condition requires review.',
  ruleId: 'risk-rule',
};
