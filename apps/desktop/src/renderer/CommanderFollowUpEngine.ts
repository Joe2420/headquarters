import type { MissionContext } from './MissionContextMemory';

export type CommanderFollowUpId =
  | 'briefing:high-impact-news-risk'
  | 'briefing:readiness-restriction'
  | 'briefing:risk-justification'
  | 'observation:hypothesis-invalidation';

export interface CommanderFollowUpQuestion {
  readonly id: CommanderFollowUpId;
  readonly question: string;
  readonly source: 'ready-room' | 'observation';
  readonly reason: string;
}

export interface CommanderFollowUpOptions {
  readonly answeredFollowUpIds?: readonly CommanderFollowUpId[];
}

const followUpCatalog: readonly CommanderFollowUpQuestion[] = [
  {
    id: 'briefing:high-impact-news-risk',
    question: 'How will this event affect your timing or risk?',
    source: 'ready-room',
    reason: 'High-impact news was declared during briefing.',
  },
  {
    id: 'briefing:readiness-restriction',
    question: 'What restriction will protect you from poor execution today?',
    source: 'ready-room',
    reason: 'Operational condition requires a protective restriction.',
  },
  {
    id: 'briefing:risk-justification',
    question: 'Why is this risk justified today?',
    source: 'ready-room',
    reason: 'Declared risk is above the conservative threshold.',
  },
  {
    id: 'observation:hypothesis-invalidation',
    question: 'What would prove this hypothesis wrong?',
    source: 'observation',
    reason: 'Directional hypothesis exists without invalidation evidence.',
  },
];

export function getNextCommanderFollowUp(
  context: MissionContext,
  options: CommanderFollowUpOptions = {},
): CommanderFollowUpQuestion | null {
  const answeredIds = new Set(options.answeredFollowUpIds ?? []);

  return followUpCatalog.find((followUp) => (
    !answeredIds.has(followUp.id) && shouldAskFollowUp(context, followUp.id)
  )) ?? null;
}

function shouldAskFollowUp(context: MissionContext, id: CommanderFollowUpId): boolean {
  if (id === 'briefing:high-impact-news-risk') {
    return hasMeaningfulNews(context.briefing.highImpactNews);
  }

  if (id === 'briefing:readiness-restriction') {
    return hasReadinessConstraint(context.briefing.personalReadiness);
  }

  if (id === 'briefing:risk-justification') {
    return isHighRisk(context.briefing.riskParameters);
  }

  return hasText(context.observation.directionalHypothesis)
    && !hasText(context.observation.invalidationEvidence);
}

function hasMeaningfulNews(value: string | undefined): boolean {
  if (!hasText(value)) return false;
  return !/^(none|no|nope|no news|negative|nothing|n\/a)$/i.test(value.trim());
}

function hasReadinessConstraint(value: string | undefined): boolean {
  return hasText(value) && /\b(tired|stressed|distracted)\b/i.test(value);
}

function isHighRisk(value: string | undefined): boolean {
  if (!hasText(value)) return false;

  const normalized = value.trim().toLowerCase();
  const percentMatch = normalized.match(/(\d+(?:\.\d+)?)\s*%/);
  if (percentMatch?.[1] !== undefined && Number(percentMatch[1]) > 1) return true;

  const rMatch = normalized.match(/(\d+(?:\.\d+)?)\s*r\b/);
  return rMatch?.[1] !== undefined && Number(rMatch[1]) > 2;
}

function hasText(value: string | undefined): value is string {
  return value !== undefined && value.trim().length > 0;
}
