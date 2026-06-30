import { describe, expect, it } from 'vitest';
import { buildAcademyRecognitions } from './AcademyRecognition';
import type { AcademyGrowthEvent } from './AcademyGrowthEvent';

describe('Academy recognition', () => {
  it('recognizes behavior category milestones from approved growth evidence', () => {
    const recognitions = buildAcademyRecognitions([
      createEvent('growth-001', 'discipline'),
      createEvent('growth-002', 'discipline'),
      createEvent('growth-003', 'discipline'),
    ]);

    expect(recognitions).toEqual([{
      id: 'recognition:discipline:3',
      type: 'category_milestone',
      title: 'Discipline milestone noted',
      description: 'Discipline has appeared repeatedly in approved growth evidence.',
      sourceEventIds: ['growth-001', 'growth-002', 'growth-003'],
    }]);
  });

  it('adds quiet consistency recognition without financial outcome fields', () => {
    const recognitions = buildAcademyRecognitions([
      createEvent('growth-001', 'discipline'),
      createEvent('growth-002', 'patience'),
      createEvent('growth-003', 'risk_awareness'),
      createEvent('growth-004', 'emotional_regulation'),
      createEvent('growth-005', 'process_improvement'),
    ]);

    expect(recognitions).toContainEqual({
      id: 'recognition:quiet-consistency:5',
      type: 'quiet_consistency',
      title: 'Quiet consistency noted',
      description: 'Approved growth evidence shows repeated professional behavior.',
      sourceEventIds: ['growth-001', 'growth-002', 'growth-003', 'growth-004', 'growth-005'],
    });
    expect(recognitions[0]).not.toHaveProperty('profit');
    expect(recognitions[0]).not.toHaveProperty('pnl');
    expect(recognitions[0]).not.toHaveProperty('rewardAmount');
  });

  it('does not create recognition before a behavior milestone exists', () => {
    expect(buildAcademyRecognitions([
      createEvent('growth-001', 'patience'),
      createEvent('growth-002', 'patience'),
    ])).toEqual([]);
  });
});

function createEvent(
  id: string,
  category: AcademyGrowthEvent['category'],
): AcademyGrowthEvent {
  return {
    id,
    occurredOn: '2026-06-30',
    title: `Growth event ${id}`,
    description: 'Approved growth evidence.',
    category,
    evidence: {
      sourceType: 'journal_growth_event',
      growthEventId: id,
      journalSourceType: 'journal_entry',
      journalSourceId: `journal-${id}`,
    },
    createdAt: '2026-06-30T00:00:00.000Z',
  };
}
