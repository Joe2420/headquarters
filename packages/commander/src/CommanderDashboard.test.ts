import { describe, expect, it } from 'vitest';
import { buildCommanderDashboard } from './CommanderDashboard';

describe('buildCommanderDashboard', () => {
  it('surfaces briefing, review, planning, and objective status deterministically', () => {
    const dashboard = buildCommanderDashboard({
      hasDailyBriefing: true,
      hasSessionDebrief: true,
      hasWeeklyReview: true,
      hasMonthlyReview: true,
      hasMissionPlanning: false,
      objectiveCount: 0,
      generatedAt: '2026-07-01T00:00:00.000Z',
    });

    expect(dashboard.title).toBe('Commander Dashboard');
    expect(dashboard.sections).toEqual([
      { label: 'Briefing', status: 'available', summary: 'Daily briefing is available.' },
      { label: 'Reviews', status: 'available', summary: '3 Commander review surfaces available.' },
      {
        label: 'Planning',
        status: 'pending',
        summary: 'Mission planning support remains pending its approved workflow.',
      },
      { label: 'Objectives', status: 'pending', summary: 'Objectives remain pending their approved workflow.' },
    ]);
    expect(dashboard.constraints).toContain('No chat behavior.');
    expect(dashboard.constraints).toContain('No avatar behavior.');
    expect(dashboard.constraints).toContain('No market prediction.');
  });

  it('handles an empty Commander dashboard safely', () => {
    const dashboard = buildCommanderDashboard({
      hasDailyBriefing: false,
      hasSessionDebrief: false,
      hasWeeklyReview: false,
      hasMonthlyReview: false,
      hasMissionPlanning: false,
      objectiveCount: 0,
      generatedAt: 'standby',
    });

    expect(dashboard.sections.map((section) => section.status)).toEqual([
      'pending',
      'pending',
      'pending',
      'pending',
    ]);
  });
});
