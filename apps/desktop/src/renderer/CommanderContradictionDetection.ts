import type { MissionContext, MissionContextContradictionFlag } from './MissionContextMemory';

export function detectCommanderContradictions(context: MissionContext): readonly MissionContextContradictionFlag[] {
  return [
    ...detectMarketEnvironmentContradictions(context),
    ...detectReadinessRiskContradictions(context),
    ...detectHypothesisContradictions(context),
  ];
}

export function formatCommanderContradictionMessage(
  contradictions: readonly MissionContextContradictionFlag[],
): string | null {
  const firstContradiction = contradictions[0];
  if (firstContradiction === undefined) return null;

  return `${firstContradiction.message} Explain the change.`;
}

function detectMarketEnvironmentContradictions(context: MissionContext): readonly MissionContextContradictionFlag[] {
  const environment = normalize(context.briefing.marketEnvironment);
  const observed = normalize([
    context.observation.marketStructure,
    context.observation.volume,
    context.observation.operationalSummary,
  ].filter(Boolean).join(' '));

  if (!environment || !observed) return [];

  if (/\blow volatility\b/.test(environment) && /\b(high volatility|expansion|volatile)\b/.test(observed)) {
    return [createContradiction('contradiction:market-environment', 'Market volatility conflicts with the earlier briefing.')];
  }

  if (/\brange|ranging|sideways\b/.test(environment) && /\bstrong trend|trending|higher highs|lower lows|expansion\b/.test(observed)) {
    return [createContradiction('contradiction:market-structure', 'Observed structure conflicts with the earlier range briefing.')];
  }

  return [];
}

function detectReadinessRiskContradictions(context: MissionContext): readonly MissionContextContradictionFlag[] {
  const readiness = normalize(context.briefing.personalReadiness);
  const risk = normalize(context.briefing.riskParameters);

  if (!/\b(tired|stressed|distracted)\b/.test(readiness) || !isHighRisk(risk)) return [];

  return [createContradiction('contradiction:readiness-risk', 'Operational condition conflicts with the declared risk posture.')];
}

function detectHypothesisContradictions(context: MissionContext): readonly MissionContextContradictionFlag[] {
  const hypothesis = normalize(context.observation.directionalHypothesis);
  const invalidation = normalize(context.observation.invalidationEvidence);

  if (!hypothesis || !invalidation) return [];

  if (/\blong|up|bullish\b/.test(hypothesis) && /\blong remains valid|bullish confirmation|supports long\b/.test(invalidation)) {
    return [createContradiction('contradiction:hypothesis-invalidation', 'Hypothesis conflicts with the stated invalidation evidence.')];
  }

  if (/\bshort|down|bearish\b/.test(hypothesis) && /\bshort remains valid|bearish confirmation|supports short\b/.test(invalidation)) {
    return [createContradiction('contradiction:hypothesis-invalidation', 'Hypothesis conflicts with the stated invalidation evidence.')];
  }

  return [];
}

function createContradiction(id: string, message: string): MissionContextContradictionFlag {
  return {
    id,
    sourceRoom: 'ready-room',
    targetRoom: 'observation',
    message: `This conflicts with your earlier briefing. ${message}`,
  };
}

function isHighRisk(value: string): boolean {
  const percentMatch = value.match(/(\d+(?:\.\d+)?)\s*%/);
  if (percentMatch?.[1] !== undefined && Number(percentMatch[1]) > 1) return true;

  const rMatch = value.match(/(\d+(?:\.\d+)?)\s*r\b/);
  return rMatch?.[1] !== undefined && Number(rMatch[1]) > 2;
}

function normalize(value: string | undefined): string {
  return value?.trim().toLowerCase() ?? '';
}
