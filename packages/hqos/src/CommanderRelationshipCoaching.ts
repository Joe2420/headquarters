import type {
  BehaviorDimension,
  CommanderRelationship,
  RelationshipSnapshot,
} from './CommanderRelationship';

export interface CommanderRelationshipDialogue {
  readonly messageId: string;
  readonly message: string;
  readonly evidenceIds: readonly string[];
}

export function selectCommanderCoachingMode(input: {
  readonly missionCount: number;
  readonly strengths: readonly BehaviorDimension[];
  readonly needsAttention: readonly BehaviorDimension[];
}): CommanderRelationship['coachingMode'] {
  if (input.missionCount < 3) return 'foundational';
  if (input.needsAttention.some((dimension) => dimension.state === 'critical' || dimension.state === 'strained')) {
    return 'challenging';
  }
  if (input.missionCount >= 10 && input.strengths.length >= 3) return 'trusted';
  return 'standard';
}

export function buildCommanderRelationshipDialogue(
  snapshot: RelationshipSnapshot,
): readonly CommanderRelationshipDialogue[] {
  const focus = snapshot.relationship.profile.needsAttention[0];
  const strength = snapshot.relationship.profile.strengths[0];
  const pattern = snapshot.relationship.profile.patterns[0];
  const messages: CommanderRelationshipDialogue[] = [];

  if (focus !== undefined) {
    messages.push({
      messageId: `relationship:focus:${focus.id}:${focus.state}`,
      message: `${focus.title} requires attention. ${focus.explanation}`,
      evidenceIds: focus.supportingEvidence.map((evidence) => evidence.id),
    });
  }

  if (strength !== undefined) {
    messages.push({
      messageId: `relationship:strength:${strength.id}:${strength.state}`,
      message: `${strength.title} is becoming reliable. Headquarters has evidence for that trust.`,
      evidenceIds: strength.supportingEvidence.map((evidence) => evidence.id),
    });
  }

  if (pattern !== undefined) {
    messages.push({
      messageId: `relationship:pattern:${pattern.id}`,
      message: `${pattern.description} ${pattern.missionIds.length} mission${pattern.missionIds.length === 1 ? '' : 's'} support this observation.`,
      evidenceIds: pattern.evidence.map((evidence) => evidence.id),
    });
  }

  return Object.freeze(messages);
}
