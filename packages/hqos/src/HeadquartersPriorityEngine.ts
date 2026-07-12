import type { MissionLifecycleProjection, MissionLifecycleRoom } from './MissionLifecycleProjection';
import type { HealthDimension, InstitutionalHealthSnapshot } from './InstitutionalHealth';

export type HeadquartersPrioritySeverity = 'critical' | 'blocking' | 'immediate' | 'pending' | 'informational';
export type HeadquartersPriorityUrgency = 'now' | 'next' | 'soon' | 'later';
export type HeadquartersPrioritySource =
  | 'mission'
  | 'guardian'
  | 'doctrine'
  | 'journal'
  | 'archive'
  | 'academy'
  | 'intelligence'
  | 'institutional-health'
  | 'system';

export interface HeadquartersPriorityEvidenceRef {
  readonly id: string;
  readonly source: HeadquartersPrioritySource | string;
}

export interface HeadquartersPriorityItem {
  readonly id: string;
  readonly source: HeadquartersPrioritySource;
  readonly type: string;
  readonly title: string;
  readonly explanation: string;
  readonly severity: HeadquartersPrioritySeverity;
  readonly urgency: HeadquartersPriorityUrgency;
  readonly lifecycleRelevance: 'current' | 'related' | 'optional' | 'standby';
  readonly blocking: boolean;
  readonly recommendedRoom: MissionLifecycleRoom;
  readonly recommendedAction: string;
  readonly evidenceReferences: readonly HeadquartersPriorityEvidenceRef[];
  readonly detectedAt: string;
  readonly resolved: boolean;
}

export interface GuardianPrioritySignal {
  readonly id: string;
  readonly title: string;
  readonly message: string;
  readonly priority: 'low' | 'medium' | 'high' | 'critical';
  readonly sourceId: string;
  readonly resolved?: boolean;
}

export interface DoctrinePrioritySignal {
  readonly id: string;
  readonly title: string;
  readonly rationale: string;
  readonly evidenceRecordIds: readonly string[];
  readonly resolved?: boolean;
}

export interface JournalPrioritySignal {
  readonly id: string;
  readonly title: string;
  readonly explanation: string;
  readonly room?: MissionLifecycleRoom;
  readonly blocking?: boolean;
  readonly resolved?: boolean;
}

export interface IntelligencePrioritySignal {
  readonly id: string;
  readonly title: string;
  readonly explanation: string;
  readonly missingEvidenceCount: number;
  readonly resolved?: boolean;
}

export interface HeadquartersPriorityInput {
  readonly lifecycle: MissionLifecycleProjection;
  readonly guardianAlerts?: readonly GuardianPrioritySignal[] | undefined;
  readonly doctrineCandidates?: readonly DoctrinePrioritySignal[] | undefined;
  readonly journalFollowups?: readonly JournalPrioritySignal[] | undefined;
  readonly intelligence?: IntelligencePrioritySignal | undefined;
  readonly reviewAvailable?: boolean | undefined;
  readonly archiveMilestoneCount?: number | undefined;
  readonly institutionalHealth?: InstitutionalHealthSnapshot | undefined;
  readonly detectedAt?: string | undefined;
}

const defaultDetectedAt = '2026-07-02T00:00:00.000Z';

const severityRank: Record<HeadquartersPrioritySeverity, number> = {
  critical: 0,
  blocking: 1,
  immediate: 2,
  pending: 3,
  informational: 4,
};

const urgencyRank: Record<HeadquartersPriorityUrgency, number> = {
  now: 0,
  next: 1,
  soon: 2,
  later: 3,
};

const lifecycleRank: Record<HeadquartersPriorityItem['lifecycleRelevance'], number> = {
  current: 0,
  related: 1,
  optional: 2,
  standby: 3,
};

export function getHeadquartersPriorities(input: HeadquartersPriorityInput): readonly HeadquartersPriorityItem[] {
  return dedupePriorities([
    ...buildGuardianPriorities(input),
    buildMissionLifecyclePriority(input),
    ...buildIntelligencePriorities(input),
    ...buildDoctrinePriorities(input),
    ...buildJournalPriorities(input),
    ...buildReviewPriorities(input),
    ...buildArchivePriorities(input),
    ...buildInstitutionalHealthPriorities(input),
  ].filter((priority) => !priority.resolved)).sort(comparePriorities);
}

export function getHighestPriority(input: HeadquartersPriorityInput): HeadquartersPriorityItem {
  return getHeadquartersPriorities(input)[0] ?? buildStandbyPriority(input);
}

export function getTopPriorities(input: HeadquartersPriorityInput, limit: number): readonly HeadquartersPriorityItem[] {
  return getHeadquartersPriorities(input).slice(0, Math.max(0, limit));
}

export function getRecommendedRoomFromPriorities(input: HeadquartersPriorityInput): MissionLifecycleRoom {
  return getHighestPriority(input).recommendedRoom;
}

export function getBlockingPriority(input: HeadquartersPriorityInput): HeadquartersPriorityItem | undefined {
  return getHeadquartersPriorities(input).find((priority) => priority.blocking);
}

export function getPriorityExplanation(priority: HeadquartersPriorityItem): string {
  return `${priority.title}: ${priority.explanation}`;
}

export function getPriorityCountBySeverity(
  input: HeadquartersPriorityInput,
): Record<HeadquartersPrioritySeverity, number> {
  const counts: Record<HeadquartersPrioritySeverity, number> = {
    critical: 0,
    blocking: 0,
    immediate: 0,
    pending: 0,
    informational: 0,
  };

  for (const priority of getHeadquartersPriorities(input)) {
    counts[priority.severity] += 1;
  }

  return counts;
}

function buildMissionLifecyclePriority(input: HeadquartersPriorityInput): HeadquartersPriorityItem {
  const action = input.lifecycle.currentPrimaryAction;
  const blocking = input.lifecycle.blockedActions.length > 0;

  return {
    id: `priority:mission:${action.id}`,
    source: 'mission',
    type: 'mission_lifecycle',
    title: action.label,
    explanation: action.explanation,
    severity: blocking ? 'blocking' : input.lifecycle.missionActive ? 'immediate' : 'pending',
    urgency: blocking ? 'now' : 'next',
    lifecycleRelevance: input.lifecycle.missionActive ? 'current' : 'standby',
    blocking,
    recommendedRoom: action.room,
    recommendedAction: action.label,
    evidenceReferences: input.lifecycle.missionId
      ? [{ id: input.lifecycle.missionId, source: 'mission' }]
      : [],
    detectedAt: input.detectedAt ?? defaultDetectedAt,
    resolved: false,
  };
}

function buildGuardianPriorities(input: HeadquartersPriorityInput): HeadquartersPriorityItem[] {
  return (input.guardianAlerts ?? []).map((alert) => {
    const severity = alert.priority === 'critical'
      ? 'critical'
      : alert.priority === 'high'
        ? 'blocking'
        : alert.priority === 'medium'
          ? 'immediate'
          : 'informational';

    return {
      id: `priority:guardian:${alert.id}`,
      source: 'guardian',
      type: 'guardian_alert',
      title: alert.title,
      explanation: alert.message,
      severity,
      urgency: severity === 'critical' || severity === 'blocking' ? 'now' : 'soon',
      lifecycleRelevance: severity === 'informational' ? 'related' : 'current',
      blocking: severity === 'critical' || severity === 'blocking',
      recommendedRoom: 'war-room',
      recommendedAction: severity === 'informational' ? 'Review Guardian status' : 'Resolve Guardian restriction',
      evidenceReferences: [{ id: alert.sourceId, source: 'guardian' }],
      detectedAt: input.detectedAt ?? defaultDetectedAt,
      resolved: alert.resolved ?? false,
    } satisfies HeadquartersPriorityItem;
  });
}

function buildDoctrinePriorities(input: HeadquartersPriorityInput): HeadquartersPriorityItem[] {
  return (input.doctrineCandidates ?? []).map((candidate) => ({
    id: `priority:doctrine:${candidate.id}`,
    source: 'doctrine',
    type: 'doctrine_candidate',
    title: candidate.title,
    explanation: candidate.rationale,
    severity: 'pending',
    urgency: 'soon',
    lifecycleRelevance: input.lifecycle.missionActive ? 'related' : 'optional',
    blocking: false,
    recommendedRoom: 'mission-room',
    recommendedAction: 'Review doctrine candidate',
    evidenceReferences: candidate.evidenceRecordIds.map((id) => ({ id, source: 'doctrine' })),
    detectedAt: input.detectedAt ?? defaultDetectedAt,
    resolved: candidate.resolved ?? false,
  }));
}

function buildJournalPriorities(input: HeadquartersPriorityInput): HeadquartersPriorityItem[] {
  return (input.journalFollowups ?? []).map((followup) => ({
    id: `priority:journal:${followup.id}`,
    source: 'journal',
    type: 'journal_followup',
    title: followup.title,
    explanation: followup.explanation,
    severity: followup.blocking ? 'blocking' : 'pending',
    urgency: followup.blocking ? 'now' : 'soon',
    lifecycleRelevance: followup.blocking ? 'current' : 'optional',
    blocking: followup.blocking ?? false,
    recommendedRoom: followup.room ?? 'mission-room',
    recommendedAction: followup.title,
    evidenceReferences: [{ id: followup.id, source: 'journal' }],
    detectedAt: input.detectedAt ?? defaultDetectedAt,
    resolved: followup.resolved ?? false,
  }));
}

function buildIntelligencePriorities(input: HeadquartersPriorityInput): HeadquartersPriorityItem[] {
  const intelligence = input.intelligence;
  if (intelligence === undefined || intelligence.resolved === true || intelligence.missingEvidenceCount <= 0) return [];

  return [{
    id: `priority:intelligence:${intelligence.id}`,
    source: 'intelligence',
    type: 'missing_evidence',
    title: intelligence.title,
    explanation: intelligence.explanation,
    severity: input.lifecycle.missionActive ? 'blocking' : 'pending',
    urgency: input.lifecycle.missionActive ? 'now' : 'soon',
    lifecycleRelevance: input.lifecycle.missionActive ? 'current' : 'optional',
    blocking: input.lifecycle.missionActive,
    recommendedRoom: input.lifecycle.recommendedRoom,
    recommendedAction: 'Complete missing evidence',
    evidenceReferences: [{ id: intelligence.id, source: 'intelligence' }],
    detectedAt: input.detectedAt ?? defaultDetectedAt,
    resolved: false,
  }];
}

function buildReviewPriorities(input: HeadquartersPriorityInput): HeadquartersPriorityItem[] {
  if (input.reviewAvailable !== true) return [];

  return [{
    id: 'priority:review:weekly',
    source: 'system',
    type: 'review_available',
    title: 'Review available',
    explanation: 'A Headquarters review is available after recent evidence.',
    severity: 'informational',
    urgency: 'later',
    lifecycleRelevance: 'optional',
    blocking: false,
    recommendedRoom: 'command-center',
    recommendedAction: 'Open review',
    evidenceReferences: [{ id: 'weekly-review', source: 'system' }],
    detectedAt: input.detectedAt ?? defaultDetectedAt,
    resolved: false,
  }];
}

function buildArchivePriorities(input: HeadquartersPriorityInput): HeadquartersPriorityItem[] {
  const count = input.archiveMilestoneCount ?? 0;
  if (count <= 0) return [];

  return [{
    id: `priority:archive:milestone:${count}`,
    source: 'archive',
    type: 'archive_milestone',
    title: 'Archive milestone',
    explanation: `${count} archive record${count === 1 ? '' : 's'} available for historical review.`,
    severity: 'informational',
    urgency: 'later',
    lifecycleRelevance: 'optional',
    blocking: false,
    recommendedRoom: 'archive',
    recommendedAction: 'Review archive history',
    evidenceReferences: [{ id: `archive-count:${count}`, source: 'archive' }],
    detectedAt: input.detectedAt ?? defaultDetectedAt,
    resolved: false,
  }];
}

function buildInstitutionalHealthPriorities(input: HeadquartersPriorityInput): HeadquartersPriorityItem[] {
  return (input.institutionalHealth?.dimensions ?? [])
    .filter((dimension) => dimension.state === 'critical' || dimension.state === 'degraded')
    .map((dimension) => ({
      id: `priority:institutional-health:${dimension.id}`,
      source: 'institutional-health',
      type: 'institutional_health',
      title: `${dimension.title} requires attention`,
      explanation: dimension.explanation.why,
      severity: dimension.state === 'critical' ? 'critical' : 'blocking',
      urgency: dimension.state === 'critical' ? 'now' : 'next',
      lifecycleRelevance: 'current',
      blocking: dimension.state === 'critical',
      recommendedRoom: getRoomForHealthDimension(dimension),
      recommendedAction: `Review ${dimension.title}`,
      evidenceReferences: dimension.supportingEvidence.map((evidenceItem) => ({
        id: evidenceItem.id,
        source: 'institutional-health',
      })),
      detectedAt: input.detectedAt ?? input.institutionalHealth?.evaluatedAt ?? defaultDetectedAt,
      resolved: false,
    } satisfies HeadquartersPriorityItem));
}

function getRoomForHealthDimension(dimension: HealthDimension): MissionLifecycleRoom {
  if (dimension.id === 'guardian-stability' || dimension.id === 'operational-readiness') return 'war-room';
  if (dimension.id === 'doctrine-coverage') return 'mission-room';
  if (dimension.id === 'academy-development') return 'command-center';
  if (dimension.id === 'archive-integrity') return 'archive';
  if (dimension.id === 'intelligence-completeness' || dimension.id === 'evidence-quality') return 'observation-room';
  return 'mission-room';
}

function buildStandbyPriority(input: HeadquartersPriorityInput): HeadquartersPriorityItem {
  return {
    id: 'priority:standby',
    source: 'system',
    type: 'standby',
    title: 'Headquarters standing by',
    explanation: 'No active work requires attention.',
    severity: 'informational',
    urgency: 'later',
    lifecycleRelevance: 'standby',
    blocking: false,
    recommendedRoom: input.lifecycle.recommendedRoom,
    recommendedAction: input.lifecycle.currentPrimaryAction.label,
    evidenceReferences: [],
    detectedAt: input.detectedAt ?? defaultDetectedAt,
    resolved: false,
  };
}

function dedupePriorities(priorities: readonly HeadquartersPriorityItem[]): HeadquartersPriorityItem[] {
  const byId = new Map<string, HeadquartersPriorityItem>();
  for (const priority of priorities) {
    if (!byId.has(priority.id)) byId.set(priority.id, priority);
  }
  return [...byId.values()];
}

function comparePriorities(left: HeadquartersPriorityItem, right: HeadquartersPriorityItem): number {
  return severityRank[left.severity] - severityRank[right.severity]
    || Number(right.blocking) - Number(left.blocking)
    || lifecycleRank[left.lifecycleRelevance] - lifecycleRank[right.lifecycleRelevance]
    || urgencyRank[left.urgency] - urgencyRank[right.urgency]
    || left.detectedAt.localeCompare(right.detectedAt)
    || left.source.localeCompare(right.source)
    || left.id.localeCompare(right.id);
}
