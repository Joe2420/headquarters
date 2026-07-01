import { describe, expect, it } from 'vitest';
import { buildCommanderSprint10Review } from './Sprint10Review';

describe('buildCommanderSprint10Review', () => {
  it('confirms the approved Sprint 10 Commander scope', () => {
    const review = buildCommanderSprint10Review();

    expect(review.completed.map((item) => item.higTask)).toEqual([
      'HIG-TASK-075',
      'HIG-TASK-076',
      'HIG-TASK-077',
      'HIG-TASK-078',
      'HIG-TASK-079',
      'HIG-TASK-080',
      'HIG-TASK-081',
    ]);
    expect(review.completed.every((item) => item.status === 'complete')).toBe(true);
    expect(review.confirmations).toContain('Commander does not predict markets.');
    expect(review.confirmations).toContain('Commander does not introduce chat or avatar behavior.');
    expect(review.blockers).toEqual([]);
  });
});
