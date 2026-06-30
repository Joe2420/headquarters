import { describe, expect, it } from 'vitest';
import { buildTradingPlanDoctrineReferences } from './TradingPlanDoctrine';
import type { DoctrineRecord } from './DoctrineRecord';

const validatedDoctrine: DoctrineRecord = {
  id: 'doctrine-001',
  title: 'Follow the plan',
  summary: 'Follow the trading plan instead of improvising.',
  confidence: 'validated',
  source: {
    sourceType: 'journal_entry',
    sourceId: 'journal-001',
  },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('TradingPlanDoctrine', () => {
  it('builds read-only references from accepted doctrine only', () => {
    const candidateDoctrine: DoctrineRecord = {
      ...validatedDoctrine,
      id: 'doctrine-002',
      confidence: 'candidate',
    };

    expect(buildTradingPlanDoctrineReferences({
      id: 'trading-plan-001',
      name: 'Primary Trading Plan',
    }, [candidateDoctrine, validatedDoctrine])).toEqual([
      {
        tradingPlanId: 'trading-plan-001',
        tradingPlanName: 'Primary Trading Plan',
        doctrineId: 'doctrine-001',
        title: 'Follow the plan',
        summary: 'Follow the trading plan instead of improvising.',
        sourceId: 'journal-001',
      },
    ]);
  });
});
