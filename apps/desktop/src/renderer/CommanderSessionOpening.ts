import type {
  CommanderRelationship,
  HeadquartersAttentionRequest,
  LivingHeadquartersDecision,
  MissionLifecycleProjection,
} from '@headquarters/hqos';

export interface CommanderSessionOpeningInput {
  readonly lifecycle: MissionLifecycleProjection;
  readonly requests: readonly HeadquartersAttentionRequest[];
  readonly decision: LivingHeadquartersDecision;
  readonly relationship?: CommanderRelationship | undefined;
  readonly alreadyBriefedRequestIds?: readonly string[] | undefined;
}

export interface CommanderSessionOpeningBrief {
  readonly continuity: string;
  readonly highestPriority: string;
  readonly secondaryAttention: readonly string[];
  readonly recommendedAction: string;
  readonly relationshipStatement?: string | undefined;
  readonly surfacedRequestIds: readonly string[];
}

export function buildCommanderSessionOpeningBrief(
  input: CommanderSessionOpeningInput,
): CommanderSessionOpeningBrief {
  const candidates = input.requests
    .filter((request) => request.status !== 'resolved' && request.status !== 'dismissed')
    .filter((request) => !(input.alreadyBriefedRequestIds ?? []).includes(request.requestId))
    .sort(compareRequests);
  const primary = selectPrimary(input.lifecycle, candidates, input.decision);
  const secondary = candidates
    .filter((request) => request.requestId !== primary?.requestId)
    .slice(0, 2);
  const relationshipStatement = buildRelationshipStatement(input.relationship);

  return Object.freeze({
    continuity: input.lifecycle.missionActive
      ? `Active mission recovered at ${input.lifecycle.activeStage}.`
      : 'Headquarters is in standby.',
    highestPriority: primary
      ? `${primary.title}: ${primary.reason}`
      : input.lifecycle.currentPrimaryAction.explanation,
    secondaryAttention: Object.freeze(secondary.map((request) => `${request.title}: ${request.reason}`)),
    recommendedAction: primary?.recommendedAction ?? input.lifecycle.currentPrimaryAction.label,
    ...(relationshipStatement ? { relationshipStatement } : {}),
    surfacedRequestIds: Object.freeze(primary ? [primary.requestId, ...secondary.map((request) => request.requestId)] : []),
  });
}

export function renderCommanderSessionOpeningBrief(brief: CommanderSessionOpeningBrief): string {
  const secondary = brief.secondaryAttention.length > 0
    ? ` Secondary attention: ${brief.secondaryAttention.join(' ')}`
    : '';
  const relationship = brief.relationshipStatement ? ` ${brief.relationshipStatement}` : '';
  return `${brief.continuity} Highest priority: ${brief.highestPriority}.${secondary} Recommended action: ${brief.recommendedAction}.${relationship}`;
}

function selectPrimary(
  lifecycle: MissionLifecycleProjection,
  requests: readonly HeadquartersAttentionRequest[],
  decision: LivingHeadquartersDecision,
): HeadquartersAttentionRequest | undefined {
  const guardianLockout = requests.find((request) => request.requestType === 'guardian_lockout_active');
  if (guardianLockout) return guardianLockout;
  const recovery = requests.find((request) => request.requestType === 'mission_recovery_required');
  if (recovery) return recovery;
  const debrief = requests.find((request) => request.requestType === 'journal_follow_up_required' && request.blocking);
  if (debrief) return debrief;
  if (decision.requestToSurface) return decision.requestToSurface;
  if (lifecycle.missionActive) return requests.find((request) => request.blocking) ?? requests[0];
  return requests[0];
}

function buildRelationshipStatement(relationship: CommanderRelationship | undefined): string | undefined {
  if (relationship === undefined) return undefined;
  const strongest = relationship.profile.strengths[0];
  const attention = relationship.profile.needsAttention[0];
  if (attention) return `Commander notes ${attention} requires continued discipline.`;
  if (strongest) return `Commander notes ${strongest} remains a strength.`;
  return undefined;
}

function compareRequests(left: HeadquartersAttentionRequest, right: HeadquartersAttentionRequest): number {
  const urgencyRank = { critical: 0, immediate: 1, soon: 2, routine: 3, background: 4 };
  return urgencyRank[left.urgency] - urgencyRank[right.urgency]
    || Number(right.blocking) - Number(left.blocking)
    || left.createdAt.localeCompare(right.createdAt);
}
