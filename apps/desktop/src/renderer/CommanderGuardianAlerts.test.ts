import { describe, expect, it } from 'vitest';

import { buildCommanderGuardianAlertLines, formatCommanderGuardianStatus } from './CommanderGuardianAlerts';

describe('CommanderGuardianAlerts', () => {
  it('keeps only Commander-level Guardian alerts and formats status', () => {
    const lines = buildCommanderGuardianAlertLines([
      { id: 'info', title: 'Info', message: 'Informational only.', priority: 'low', sourceId: 'test' },
      { id: 'risk', title: 'Risk', message: 'Risk boundary active.', priority: 'high', sourceId: 'test' },
    ]);

    expect(lines).toEqual([
      {
        id: 'commander:risk',
        priority: 'high',
        message: 'Guardian: Risk boundary active.',
      },
    ]);
    expect(formatCommanderGuardianStatus(lines)).toBe('1 Guardian alert requires Commander attention.');
    expect(formatCommanderGuardianStatus([])).toBe('Guardian reports no Commander-level alerts.');
  });
});
