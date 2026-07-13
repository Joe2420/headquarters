export type IntelligenceSimilarityLevel = 'exact' | 'normalized_exact' | 'related' | 'insufficient_evidence';

export interface IntelligenceSimilarityResult {
  readonly level: IntelligenceSimilarityLevel;
  readonly left: string;
  readonly right: string;
  readonly normalizedLeft: string;
  readonly normalizedRight: string;
  readonly reasons: readonly string[];
}

const yesNoAliases = new Map([
  ['yes', 'yes'],
  ['yep', 'yes'],
  ['affirmative', 'yes'],
  ['confirmed', 'yes'],
  ['no', 'no'],
  ['nope', 'no'],
  ['none', 'no'],
  ['negative', 'no'],
]);

const marketAliases = new Map([
  ['btc', 'BTC'],
  ['bitcoin', 'BTC'],
  ['xbt', 'BTC'],
  ['eth', 'ETH'],
  ['ethereum', 'ETH'],
  ['es', 'ES'],
  ['s&p 500 futures', 'ES'],
  ['nq', 'NQ'],
  ['nasdaq futures', 'NQ'],
]);

const lifecycleAliases = new Map([
  ['ready', 'ready-room'],
  ['ready room', 'ready-room'],
  ['observation', 'observation'],
  ['observe', 'observation'],
  ['war room', 'war-room'],
  ['authorization', 'war-room'],
  ['debrief', 'debrief'],
  ['archive', 'archive'],
]);

const structureAliases = new Map([
  ['higher highs', 'higher-highs'],
  ['hh-hl', 'higher-highs'],
  ['bullish structure', 'higher-highs'],
  ['lower lows', 'lower-lows',
  ],
  ['ll-lh', 'lower-lows'],
  ['bearish structure', 'lower-lows'],
  ['range', 'range'],
  ['compression', 'compression'],
  ['expansion', 'expansion'],
]);

const directionAliases = new Map([
  ['up', 'up'],
  ['higher', 'up'],
  ['rising', 'up'],
  ['down', 'down'],
  ['lower', 'down'],
  ['falling', 'down'],
  ['sideways', 'sideways'],
  ['flat', 'sideways'],
]);

const emotionAliases = new Map([
  ['focused', 'focused'],
  ['calm', 'calm'],
  ['tired', 'tired'],
  ['stressed', 'stressed'],
  ['distracted', 'distracted'],
  ['confident', 'confident'],
]);

const behaviorAliases = new Map([
  ['patience', 'patience'],
  ['patient', 'patience'],
  ['discipline', 'discipline'],
  ['disciplined', 'discipline'],
  ['preparation', 'preparation'],
  ['prepared', 'preparation'],
  ['review quality', 'review-quality'],
  ['debrief quality', 'review-quality'],
]);

export function normalizeMarketName(value: string): string {
  return normalizeByMap(value, marketAliases, normalizeEvidenceText(value).toUpperCase());
}

export function normalizeLifecycleStage(value: string): string {
  return normalizeByMap(value, lifecycleAliases, normalizeEvidenceText(value));
}

export function normalizeBehaviorLabel(value: string): string {
  return normalizeByMap(value, behaviorAliases, normalizeEvidenceText(value));
}

export function normalizeRiskExpression(value: string): string {
  return normalizeEvidenceText(value).replace(/\s+/g, '').replace(/^risk:/, '');
}

export function normalizeDoctrineRuleText(value: string): string {
  return normalizeEvidenceText(value).replace(/[.;:]+$/g, '');
}

export function normalizeJournalTheme(value: string): string {
  return normalizeEvidenceText(value);
}

export function normalizeDirectionLabel(value: string): string {
  return normalizeByMap(value, directionAliases, normalizeEvidenceText(value));
}

export function normalizeMarketStructureLabel(value: string): string {
  return normalizeByMap(value, structureAliases, normalizeEvidenceText(value));
}

export function normalizeEmotionLabel(value: string): string {
  const normalized = normalizeEvidenceText(value);
  return emotionAliases.get(normalized) ?? normalized;
}

export function normalizeOperatorCommitment(value: string): string {
  return normalizeByMap(value, yesNoAliases, normalizeEvidenceText(value));
}

export function normalizeEvidenceText(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase()
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.!?;:])/g, '$1');
}

export function compareNormalizedEvidence(
  left: string,
  right: string,
  normalizers: readonly ((value: string) => string)[] = [normalizeEvidenceText],
): IntelligenceSimilarityResult {
  const rawLeft = left.trim();
  const rawRight = right.trim();
  if (!rawLeft || !rawRight) {
    return freezeSimilarity('insufficient_evidence', rawLeft, rawRight, '', '', ['One or both evidence values are empty.']);
  }
  if (rawLeft === rawRight) {
    return freezeSimilarity('exact', rawLeft, rawRight, rawLeft, rawRight, ['Raw text matches exactly.']);
  }

  const matches: string[] = [];
  let normalizedLeft = normalizeEvidenceText(rawLeft);
  let normalizedRight = normalizeEvidenceText(rawRight);
  for (const normalizer of normalizers) {
    const nextLeft = normalizer(rawLeft);
    const nextRight = normalizer(rawRight);
    if (nextLeft === nextRight) {
      normalizedLeft = nextLeft;
      normalizedRight = nextRight;
      matches.push(`Approved normalizer matched ${nextLeft}.`);
    }
  }

  if (matches.length > 0) {
    return freezeSimilarity('normalized_exact', rawLeft, rawRight, normalizedLeft, normalizedRight, matches);
  }

  const relatedReasons = getRelatedReasons(rawLeft, rawRight);
  if (relatedReasons.length > 0) {
    return freezeSimilarity('related', rawLeft, rawRight, normalizedLeft, normalizedRight, relatedReasons);
  }

  return freezeSimilarity('insufficient_evidence', rawLeft, rawRight, normalizedLeft, normalizedRight, [
    'No approved normalized dimension matched.',
  ]);
}

function getRelatedReasons(left: string, right: string): readonly string[] {
  const dimensions = [
    ['market', normalizeMarketName(left), normalizeMarketName(right)],
    ['direction', normalizeDirectionLabel(left), normalizeDirectionLabel(right)],
    ['structure', normalizeMarketStructureLabel(left), normalizeMarketStructureLabel(right)],
    ['emotion', normalizeEmotionLabel(left), normalizeEmotionLabel(right)],
    ['commitment', normalizeOperatorCommitment(left), normalizeOperatorCommitment(right)],
  ] as const;

  return Object.freeze(dimensions
    .filter(([, normalizedLeft, normalizedRight]) => normalizedLeft === normalizedRight && normalizedLeft !== normalizeEvidenceText(left))
    .map(([dimension, value]) => `${dimension} matched approved normalized value ${value}.`));
}

function normalizeByMap(value: string, map: ReadonlyMap<string, string>, fallback: string): string {
  return map.get(normalizeEvidenceText(value)) ?? fallback;
}

function freezeSimilarity(
  level: IntelligenceSimilarityLevel,
  left: string,
  right: string,
  normalizedLeft: string,
  normalizedRight: string,
  reasons: readonly string[],
): IntelligenceSimilarityResult {
  return Object.freeze({
    level,
    left,
    right,
    normalizedLeft,
    normalizedRight,
    reasons: Object.freeze([...reasons]),
  });
}
