import { describe, expect, it } from 'vitest';
import { buildIntelligenceSprint11Review } from './Sprint11Review';

describe('buildIntelligenceSprint11Review', () => {
  it('confirms the approved Sprint 11 Intelligence Office scope', () => {
    const review = buildIntelligenceSprint11Review();

    expect(review.completed.map((item) => item.higTask)).toEqual([
      'HIG-TASK-083',
      'HIG-TASK-084',
      'HIG-TASK-085',
      'HIG-TASK-086',
      'HIG-TASK-087',
      'HIG-TASK-088',
      'HIG-TASK-089',
    ]);
    expect(review.completed.every((item) => item.status === 'complete')).toBe(true);
    expect(review.confirmations).toContain('Raw journal evidence is preserved and not rewritten.');
    expect(review.confirmations).toContain('No AI classification or prediction behavior was introduced.');
    expect(review.blockers).toEqual([]);
  });
});
