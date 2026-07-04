import type { GuardianAlert } from '@headquarters/guardian';
import type { GrowthEvent } from '@headquarters/journal';
import type { CommanderShellRoomId } from './CommanderShell';
import type { MissionIntelligencePackage } from './MissionIntelligencePackage';
import type { MissionContext } from './MissionContextMemory';

export type CommanderBehaviorTrait =
  | 'patience'
  | 'discipline'
  | 'consistency'
  | 'confidence'
  | 'impulsiveness'
  | 'hesitation'
  | 'preparationQuality'
  | 'reviewQuality'
  | 'ruleAdherence';

export type CommanderBehaviorLevel = 'weak' | 'forming' | 'stable' | 'strong';

export interface CommanderBehaviorEvidence {
  readonly id: string;
  readonly trait: CommanderBehaviorTrait;
  readonly message: string;
  readonly source: 'mission' | 'growth' | 'guardian' | 'intelligence';
}

export interface CommanderBehaviorScore {
  readonly trait: CommanderBehaviorTrait;
  readonly score: number;
  readonly level: CommanderBehaviorLevel;
  readonly evidence: readonly CommanderBehaviorEvidence[];
}

export interface CommanderBehaviorProfile {
  readonly missionCount: number;
  readonly traits: readonly CommanderBehaviorScore[];
  readonly warnings: readonly CommanderBehaviorEvidence[];
  readonly reinforcements: readonly CommanderBehaviorEvidence[];
  readonly dominantTrait?: CommanderBehaviorTrait;
  readonly coachingFocus?: CommanderBehaviorTrait;
}

export interface CommanderBehaviorMission {
  readonly id: string;
  readonly campaign: string;
  readonly currentState: string;
  readonly missionContext?: MissionContext;
}

export interface CommanderBehaviorProfileInput {
  readonly missions: readonly CommanderBehaviorMission[];
  readonly growthEvents?: readonly GrowthEvent[];
  readonly guardianAlerts?: readonly GuardianAlert[];
  readonly missionIntelligence?: MissionIntelligencePackage | undefined;
}

const behaviorTraits: readonly CommanderBehaviorTrait[] = [
  'patience',
  'discipline',
  'consistency',
  'confidence',
  'impulsiveness',
  'hesitation',
  'preparationQuality',
  'reviewQuality',
  'ruleAdherence',
];

export function buildCommanderBehaviorProfile(input: CommanderBehaviorProfileInput): CommanderBehaviorProfile {
  const evidence = collectBehaviorEvidence(input);
  const traits = behaviorTraits.map((trait) => scoreBehaviorTrait(trait, evidence));
  const warnings = evidence.filter((item) => item.trait === 'impulsiveness' || item.trait === 'hesitation' || item.trait === 'ruleAdherence');
  const reinforcements = evidence.filter((item) => (
    item.trait === 'patience'
    || item.trait === 'discipline'
    || item.trait === 'preparationQuality'
    || item.trait === 'reviewQuality'
  ));
  const dominantTrait = traits
    .filter((trait) => trait.score >= 50 && trait.trait !== 'impulsiveness' && trait.trait !== 'hesitation')
    .sort((left, right) => right.score - left.score)[0]?.trait;
  const coachingFocus = traits
    .filter((trait) => trait.trait === 'impulsiveness' || trait.trait === 'hesitation' || trait.trait === 'ruleAdherence')
    .sort((left, right) => right.score - left.score)[0]?.trait;

  return {
    missionCount: input.missions.length,
    traits,
    warnings,
    reinforcements,
    ...(dominantTrait ? { dominantTrait } : {}),
    ...(coachingFocus ? { coachingFocus } : {}),
  };
}

export function buildAdaptiveCommanderGuidance(
  profile: CommanderBehaviorProfile | undefined,
  room: CommanderShellRoomId,
  missionIntelligence?: MissionIntelligencePackage | undefined,
): string | undefined {
  if (profile === undefined || profile.missionCount === 0) return undefined;

  const warning = selectRoomWarning(profile, room, missionIntelligence);
  if (warning) return warning.message;

  const reinforcement = selectRoomReinforcement(profile, room);
  if (reinforcement) return reinforcement.message;

  if (profile.dominantTrait === 'preparationQuality') {
    return 'Headquarters has observed structured preparation across recent missions.';
  }

  return undefined;
}

export function adaptCommanderQuestion(
  question: string,
  profile: CommanderBehaviorProfile | undefined,
  room: CommanderShellRoomId,
): string {
  if (profile === undefined) return question;

  if (room === 'observation' && profile.coachingFocus === 'impulsiveness') {
    return `${question}\n\nPrevious missions showed premature conclusions. Report evidence, not expectation.`;
  }

  if (room === 'war-room' && profile.coachingFocus === 'ruleAdherence') {
    return `${question}\n\nYour recent missions require explicit rule protection before authorization.`;
  }

  if (room === 'war-room' && profile.coachingFocus === 'hesitation') {
    return `${question}\n\nIf hesitation is present, state what evidence would justify action and what evidence cancels it.`;
  }

  if (room === 'ready-room' && profile.dominantTrait === 'preparationQuality') {
    return `${question}\n\nRecent preparation has been structured; keep this briefing concise and complete.`;
  }

  return question;
}

export function formatCommanderBehaviorMemory(profile: CommanderBehaviorProfile | undefined): string {
  if (profile === undefined || profile.missionCount === 0) return 'No behavioral profile yet';

  const dominant = profile.dominantTrait ? formatTrait(profile.dominantTrait) : 'No dominant strength yet';
  const focus = profile.coachingFocus ? formatTrait(profile.coachingFocus) : 'No coaching focus';
  return `${dominant}; focus: ${focus}`;
}

function collectBehaviorEvidence(input: CommanderBehaviorProfileInput): CommanderBehaviorEvidence[] {
  const evidence: CommanderBehaviorEvidence[] = [];

  for (const mission of input.missions) {
    if (mission.missionContext?.readiness.briefingComplete) {
      evidence.push({
        id: `mission:${mission.id}:briefing-complete`,
        trait: 'preparationQuality',
        message: `${mission.campaign} completed operational briefing.`,
        source: 'mission',
      });
    }

    if (mission.missionContext?.readiness.observationComplete) {
      evidence.push({
        id: `mission:${mission.id}:observation-complete`,
        trait: 'patience',
        message: `${mission.campaign} completed Observation before War Room.`,
        source: 'mission',
      });
    }

    if (mission.missionContext?.observation.evidenceReadiness === 'no') {
      evidence.push({
        id: `mission:${mission.id}:hesitation`,
        trait: 'hesitation',
        message: `${mission.campaign} required additional evidence before authorization.`,
        source: 'mission',
      });
    }

    if (mission.missionContext?.observation.invalidationEvidence) {
      evidence.push({
        id: `mission:${mission.id}:invalidation`,
        trait: 'ruleAdherence',
        message: `${mission.campaign} recorded invalidation before authorization.`,
        source: 'mission',
      });
    }

    if (mission.currentState === 'debrief' || mission.currentState === 'archived') {
      evidence.push({
        id: `mission:${mission.id}:review`,
        trait: 'reviewQuality',
        message: `${mission.campaign} reached review and archive discipline.`,
        source: 'mission',
      });
    }
  }

  for (const event of input.growthEvents ?? []) {
    evidence.push({
      id: `growth:${event.id}`,
      trait: mapGrowthCategoryToTrait(event.category),
      message: event.title,
      source: 'growth',
    });
  }

  for (const alert of input.guardianAlerts ?? []) {
    if (alert.priority === 'medium' || alert.priority === 'high' || alert.priority === 'critical') {
      evidence.push({
        id: `guardian:${alert.id}`,
        trait: 'ruleAdherence',
        message: `Guardian reports: ${alert.message}`,
        source: 'guardian',
      });
    }
  }

  if (input.missionIntelligence?.missingEvidence.length === 0 && input.missionIntelligence.confidence.score >= 80) {
    evidence.push({
      id: `intelligence:${input.missionIntelligence.missionId}:complete`,
      trait: 'confidence',
      message: 'Current mission intelligence is complete enough for confident review.',
      source: 'intelligence',
    });
  }

  if ((input.missionIntelligence?.contradictions.length ?? 0) > 0) {
    evidence.push({
      id: `intelligence:${input.missionIntelligence?.missionId ?? 'current'}:contradiction`,
      trait: 'impulsiveness',
      message: 'Similar inconsistency requires explanation before authorization.',
      source: 'intelligence',
    });
  }

  return evidence;
}

function scoreBehaviorTrait(
  trait: CommanderBehaviorTrait,
  evidence: readonly CommanderBehaviorEvidence[],
): CommanderBehaviorScore {
  const traitEvidence = evidence.filter((item) => item.trait === trait);
  const score = Math.min(100, traitEvidence.length * 25);

  return {
    trait,
    score,
    level: getBehaviorLevel(score),
    evidence: traitEvidence,
  };
}

function selectRoomWarning(
  profile: CommanderBehaviorProfile,
  room: CommanderShellRoomId,
  missionIntelligence?: MissionIntelligencePackage | undefined,
): CommanderBehaviorEvidence | undefined {
  if (room === 'war-room') {
    const guardianWarning = profile.warnings.find((item) => item.source === 'guardian');
    if (guardianWarning) return guardianWarning;
  }

  if (room === 'observation' && profile.coachingFocus === 'impulsiveness') {
    return profile.warnings.find((item) => item.trait === 'impulsiveness');
  }

  if ((missionIntelligence?.contradictions.length ?? 0) > 0) {
    return profile.warnings.find((item) => item.trait === 'impulsiveness');
  }

  return undefined;
}

function selectRoomReinforcement(
  profile: CommanderBehaviorProfile,
  room: CommanderShellRoomId,
): CommanderBehaviorEvidence | undefined {
  if (room === 'ready-room') return profile.reinforcements.find((item) => item.trait === 'preparationQuality');
  if (room === 'observation') return profile.reinforcements.find((item) => item.trait === 'patience');
  if (room === 'debrief') return profile.reinforcements.find((item) => item.trait === 'reviewQuality');
  return profile.reinforcements.find((item) => item.trait === 'discipline');
}

function mapGrowthCategoryToTrait(category: GrowthEvent['category']): CommanderBehaviorTrait {
  if (category === 'patience') return 'patience';
  if (category === 'risk_awareness') return 'ruleAdherence';
  if (category === 'emotional_regulation') return 'discipline';
  if (category === 'process_improvement') return 'consistency';
  return 'discipline';
}

function getBehaviorLevel(score: number): CommanderBehaviorLevel {
  if (score >= 75) return 'strong';
  if (score >= 50) return 'stable';
  if (score >= 25) return 'forming';
  return 'weak';
}

function formatTrait(trait: CommanderBehaviorTrait): string {
  return trait
    .replace(/([A-Z])/g, ' $1')
    .toLowerCase();
}
