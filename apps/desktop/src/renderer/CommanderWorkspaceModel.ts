import type {
  HeadquartersAttentionRequest,
  HeadquartersPriorityItem,
  InstitutionalHealthSnapshot,
  MissionLifecycleProjection,
  MissionLifecycleRoom,
  OperationalConsequence,
  RelationshipSnapshot,
} from '@headquarters/hqos';

export type CommanderWorkspaceMode =
  | 'standby'
  | 'active'
  | 'blocked'
  | 'interrupted'
  | 'recovering'
  | 'archived';

export interface CommanderWorkspaceAction {
  readonly id: string;
  readonly label: string;
  readonly room: MissionLifecycleRoom;
  readonly reason: string;
  readonly disabled: boolean;
}

export interface CommanderWorkspaceBlocker {
  readonly id: string;
  readonly label: string;
  readonly source: string;
  readonly reason: string;
}

export interface CommanderWorkspaceSnapshot {
  readonly mode: CommanderWorkspaceMode;
  readonly missionId?: string | undefined;
  readonly activeStage: MissionLifecycleProjection['activeStage'];
  readonly currentRoom: MissionLifecycleRoom;
  readonly recommendedRoom: MissionLifecycleRoom;
  readonly primaryAction: CommanderWorkspaceAction;
  readonly blockers: readonly CommanderWorkspaceBlocker[];
  readonly priority: {
    readonly id: string;
    readonly title: string;
    readonly severity: HeadquartersPriorityItem['severity'];
    readonly urgency: HeadquartersPriorityItem['urgency'];
    readonly source: HeadquartersPriorityItem['source'];
    readonly explanation: string;
  };
  readonly health: {
    readonly state: InstitutionalHealthSnapshot['overallState'] | 'unknown';
    readonly summary: string;
    readonly highestConcern?: string | undefined;
  };
  readonly relationship: {
    readonly summary: string;
    readonly confidence: string;
  };
  readonly evidenceCount: number;
}

export interface CommanderWorkspaceModelInput {
  readonly lifecycle: MissionLifecycleProjection;
  readonly highestPriority: HeadquartersPriorityItem;
  readonly attentionRequests?: readonly HeadquartersAttentionRequest[] | undefined;
  readonly institutionalHealth?: InstitutionalHealthSnapshot | undefined;
  readonly relationship?: RelationshipSnapshot | undefined;
  readonly operationalConsequences?: readonly OperationalConsequence[] | undefined;
}

export function buildCommanderWorkspaceSnapshot(
  input: CommanderWorkspaceModelInput,
): CommanderWorkspaceSnapshot {
  const missionScopedConsequences = shouldShowMissionScopedEvidence(input.lifecycle)
    ? (input.operationalConsequences ?? [])
    : [];
  const actionableAttention = (input.attentionRequests ?? [])
    .filter((request) => request.status !== 'resolved' && request.status !== 'dismissed');
  const blockingConsequences = missionScopedConsequences
    .filter((consequence) => consequence.status !== 'resolved' && (
      consequence.severity === 'restriction' || consequence.severity === 'lockout'
    ));
  const blockers = [
    ...input.lifecycle.blockedActions.map((blocker) => ({
      id: blocker.id,
      label: blocker.label,
      source: 'mission',
      reason: blocker.explanation,
    })),
    ...actionableAttention.filter((request) => request.blocking).map((request) => ({
      id: request.requestId,
      label: request.title,
      source: request.sourceSubsystem,
      reason: request.reason,
    })),
    ...blockingConsequences.map((consequence) => ({
      id: consequence.consequenceId,
      label: consequence.title,
      source: consequence.category,
      reason: consequence.explanation,
    })),
  ];

  return {
    mode: getCommanderWorkspaceMode({
      lifecycle: input.lifecycle,
      attentionRequests: actionableAttention,
      blockers,
      operationalConsequences: missionScopedConsequences,
    }),
    missionId: input.lifecycle.missionId,
    activeStage: input.lifecycle.activeStage,
    currentRoom: input.lifecycle.recommendedRoom,
    recommendedRoom: getWorkspaceRecommendedRoom(input.lifecycle, input.highestPriority, actionableAttention),
    primaryAction: getWorkspacePrimaryAction(input.lifecycle, input.highestPriority, actionableAttention, blockers),
    blockers,
    priority: {
      id: input.highestPriority.id,
      title: input.highestPriority.title,
      severity: input.highestPriority.severity,
      urgency: input.highestPriority.urgency,
      source: input.highestPriority.source,
      explanation: input.highestPriority.explanation,
    },
    health: {
      state: input.institutionalHealth?.overallState ?? 'unknown',
      summary: input.institutionalHealth?.summary ?? 'Institutional health has not been evaluated for this workspace.',
      highestConcern: input.institutionalHealth?.highestConcern?.title,
    },
    relationship: {
      summary: input.relationship?.relationship.summary ?? 'Commander relationship evidence is still forming.',
      confidence: formatRelationshipConfidence(input.relationship),
    },
    evidenceCount: countWorkspaceEvidence(input, missionScopedConsequences),
  };
}

function shouldShowMissionScopedEvidence(lifecycle: MissionLifecycleProjection): boolean {
  return lifecycle.missionCompletionState !== 'standby' && lifecycle.missionCompletionState !== 'complete';
}

function getCommanderWorkspaceMode(input: {
  readonly lifecycle: MissionLifecycleProjection;
  readonly attentionRequests: readonly HeadquartersAttentionRequest[];
  readonly blockers: readonly CommanderWorkspaceBlocker[];
  readonly operationalConsequences: readonly OperationalConsequence[];
}): CommanderWorkspaceMode {
  if (input.attentionRequests.some((request) => request.interruptionPolicy === 'interrupt_immediately')) {
    return 'interrupted';
  }

  if (input.blockers.length > 0) return 'blocked';
  if (input.operationalConsequences.some((consequence) => consequence.status === 'recovering')) {
    return 'recovering';
  }
  if (input.lifecycle.missionCompletionState === 'complete') return 'archived';
  if (input.lifecycle.missionCompletionState === 'standby') return 'standby';
  return 'active';
}

function getWorkspaceRecommendedRoom(
  lifecycle: MissionLifecycleProjection,
  priority: HeadquartersPriorityItem,
  attentionRequests: readonly HeadquartersAttentionRequest[],
): MissionLifecycleRoom {
  const interrupt = attentionRequests.find((request) => request.interruptionPolicy === 'interrupt_immediately');
  return interrupt?.recommendedRoom ?? priority.recommendedRoom ?? lifecycle.recommendedRoom;
}

function getWorkspacePrimaryAction(
  lifecycle: MissionLifecycleProjection,
  priority: HeadquartersPriorityItem,
  attentionRequests: readonly HeadquartersAttentionRequest[],
  blockers: readonly CommanderWorkspaceBlocker[],
): CommanderWorkspaceAction {
  const interrupt = attentionRequests.find((request) => request.interruptionPolicy === 'interrupt_immediately');
  if (interrupt) {
    return {
      id: interrupt.requestId,
      label: interrupt.recommendedAction,
      room: interrupt.recommendedRoom,
      reason: interrupt.reason,
      disabled: false,
    };
  }

  if (blockers.length > 0 && priority.blocking) {
    return {
      id: priority.id,
      label: priority.recommendedAction,
      room: priority.recommendedRoom,
      reason: priority.explanation,
      disabled: false,
    };
  }

  return {
    id: lifecycle.currentPrimaryAction.id,
    label: lifecycle.currentPrimaryAction.label,
    room: lifecycle.currentPrimaryAction.room,
    reason: lifecycle.currentPrimaryAction.explanation,
    disabled: lifecycle.currentPrimaryAction.disabled,
  };
}

function countWorkspaceEvidence(
  input: CommanderWorkspaceModelInput,
  operationalConsequences: readonly OperationalConsequence[],
): number {
  return input.highestPriority.evidenceReferences.length
    + (input.attentionRequests ?? []).flatMap((request) => request.evidenceReferences).length
    + (input.institutionalHealth?.sourceEvidence.length ?? 0)
    + (input.relationship?.sourceEvidence.length ?? 0)
    + operationalConsequences.flatMap((consequence) => consequence.evidenceReferences).length;
}

function formatRelationshipConfidence(snapshot: RelationshipSnapshot | undefined): string {
  const count = snapshot?.sourceEvidence.length ?? 0;
  if (count >= 10) return 'high';
  if (count >= 3) return 'forming';
  return 'limited';
}
