import { describe, expect, it } from 'vitest';
import {
  compareNormalizedEvidence,
  normalizeDirectionLabel,
  normalizeDoctrineRuleText,
  normalizeEmotionLabel,
  normalizeEvidenceText,
  normalizeMarketName,
  normalizeOperatorCommitment,
} from './IntelligenceNormalization';

describe('IntelligenceNormalization', () => {
  it('normalizes approved market and yes/no aliases deterministically', () => {
    expect(normalizeMarketName(' bitcoin ')).toBe('BTC');
    expect(normalizeMarketName('btc')).toBe('BTC');
    expect(normalizeOperatorCommitment('yep')).toBe('yes');
    expect(normalizeOperatorCommitment('none')).toBe('no');
  });

  it('detects exact doctrine duplicates without broad semantic inference', () => {
    expect(normalizeDoctrineRuleText(' Wait for confirmation. ')).toBe('wait for confirmation');
    expect(compareNormalizedEvidence(
      'Wait for confirmation.',
      'wait for confirmation',
      [normalizeDoctrineRuleText],
    ).level).toBe('normalized_exact');
  });

  it('leaves ambiguous text unresolved and avoids emotional diagnosis', () => {
    expect(normalizeEmotionLabel('uneasy but excited')).toBe('uneasy but excited');
    expect(compareNormalizedEvidence('I feel uneasy today', 'overconfidence problem').level)
      .toBe('insufficient_evidence');
  });

  it('exposes related reasons only for approved normalized dimensions', () => {
    const result = compareNormalizedEvidence('rising', 'up');

    expect(result.level).toBe('related');
    expect(result.reasons[0]).toContain('direction matched');
  });

  it('keeps unsupported mappings unchanged', () => {
    expect(normalizeDirectionLabel('coiling upward but failing')).toBe('coiling upward but failing');
    expect(normalizeEvidenceText('  A   nuanced   journal note.  ')).toBe('a nuanced journal note.');
  });
});
