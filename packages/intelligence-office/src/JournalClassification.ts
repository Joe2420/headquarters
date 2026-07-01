import type { JournalEntry } from '@headquarters/journal';

export type JournalIntelligenceCategory =
  | 'market_observation'
  | 'personal_reflection'
  | 'mission_reflection'
  | 'emotional_state'
  | 'motivation'
  | 'risk_note'
  | 'lesson'
  | 'doctrine_candidate_source'
  | 'growth_event'
  | 'guardian_risk_signal';

export interface JournalClassificationRule {
  readonly category: JournalIntelligenceCategory;
  readonly label: string;
  readonly keywords: readonly string[];
}

export interface JournalClassification {
  readonly entryId: string;
  readonly categories: readonly JournalIntelligenceCategory[];
  readonly evidence: readonly JournalClassificationEvidence[];
  readonly rawEntry: JournalEntry;
}

export interface JournalClassificationEvidence {
  readonly category: JournalIntelligenceCategory;
  readonly keyword: string;
  readonly sourceField: 'rawContent' | 'rawMood' | 'rawMarketConditions';
}

export const journalClassificationRules: readonly JournalClassificationRule[] = [
  { category: 'market_observation', label: 'Market Observation', keywords: ['market', 'price', 'session', 'setup'] },
  { category: 'personal_reflection', label: 'Personal Reflection', keywords: ['i felt', 'reflection', 'noticed', 'realized'] },
  { category: 'mission_reflection', label: 'Mission Reflection', keywords: ['mission', 'briefing', 'debrief', 'objective'] },
  { category: 'emotional_state', label: 'Emotional State', keywords: ['fear', 'angry', 'anxious', 'calm', 'frustrated'] },
  { category: 'motivation', label: 'Motivation', keywords: ['why', 'purpose', 'motivation', 'commitment'] },
  { category: 'risk_note', label: 'Risk Note', keywords: ['risk', 'size', 'loss', 'drawdown'] },
  { category: 'lesson', label: 'Lesson', keywords: ['lesson', 'learned', 'next time', 'remember'] },
  { category: 'doctrine_candidate_source', label: 'Doctrine Candidate Source', keywords: ['rule', 'doctrine', 'always', 'never'] },
  { category: 'growth_event', label: 'Growth Event', keywords: ['discipline', 'patience', 'restraint', 'improved'] },
  { category: 'guardian_risk_signal', label: 'Guardian Risk Signal', keywords: ['revenge', 'overtrade', 'override', 'tilt'] },
];

export function classifyJournalEntries(entries: readonly JournalEntry[]): readonly JournalClassification[] {
  return entries.map(classifyJournalEntry);
}

export function classifyJournalEntry(entry: JournalEntry): JournalClassification {
  const evidence = journalClassificationRules.flatMap((rule) => findRuleEvidence(entry, rule));
  const categories = journalClassificationRules
    .map((rule) => rule.category)
    .filter((category) => evidence.some((item) => item.category === category));

  return {
    entryId: entry.id,
    categories,
    evidence,
    rawEntry: copyJournalEntry(entry),
  };
}

function findRuleEvidence(entry: JournalEntry, rule: JournalClassificationRule): JournalClassificationEvidence[] {
  const fields = [
    { sourceField: 'rawContent' as const, value: entry.rawContent },
    { sourceField: 'rawMood' as const, value: entry.rawMood },
    { sourceField: 'rawMarketConditions' as const, value: entry.rawMarketConditions },
  ];

  return fields.flatMap(({ sourceField, value }) => {
    const normalizedValue = value?.toLowerCase() ?? '';

    return rule.keywords
      .filter((keyword) => normalizedValue.includes(keyword))
      .map((keyword) => ({
        category: rule.category,
        keyword,
        sourceField,
      }));
  });
}

function copyJournalEntry(entry: JournalEntry): JournalEntry {
  return {
    ...entry,
    attachmentReferences: [...entry.attachmentReferences],
  };
}
