import { describe, expect, it } from 'vitest';
import { buildGuardianAlerts } from './GuardianAlerts';

describe('Guardian alerts', () => {
  it('represents typed traceable Guardian alerts', () => {
    expect(
      buildGuardianAlerts([
        {
          id: 'risk-001',
          title: 'Risk Attention',
          detail: 'Daily loss pressure requires attention.',
          severity: 'caution',
        },
        {
          id: 'lock-001',
          title: 'Capital Protection',
          detail: 'Lock state is required by explicit Guardian rules.',
          severity: 'lock',
        },
      ]),
    ).toEqual([
      {
        id: 'guardian-alert-risk-001',
        title: 'Risk Attention',
        message: 'Daily loss pressure requires attention.',
        priority: 'medium',
        sourceId: 'risk-001',
      },
      {
        id: 'guardian-alert-lock-001',
        title: 'Capital Protection',
        message: 'Lock state is required by explicit Guardian rules.',
        priority: 'critical',
        sourceId: 'lock-001',
      },
    ]);
  });
});
