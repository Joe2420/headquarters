import type { EventPriority, HeadquartersEventType, MissionStateChangedPayload } from './events';
import type { UUID } from './domain';

export type EventCategory = 'system' | 'mission' | 'operator' | 'guardian' | 'archive' | 'environment';

export interface SystemBootCompletedPayload {
  bootMode?: 'normal' | 'recovery' | 'safe';
  integrityStatus?: 'secure' | 'degraded' | 'unknown';
}

export interface SystemBootStartedPayload {
  bootMode?: 'normal' | 'recovery' | 'safe';
}

export interface MissionCreatedPayload {
  missionId: UUID;
  campaignId?: UUID;
  codename: string;
  objective?: string;
}

export interface MissionBriefingCompletedPayload {
  missionId: UUID;
}

export interface MissionObservationStartedPayload {
  missionId: UUID;
}

export interface MissionAuthorizationRequestedPayload {
  missionId: UUID;
  setupSummary?: string;
  riskPlanned?: number;
  invalidation?: string;
  operatorJustification?: string;
}

export interface MissionAuthorizedPayload {
  missionId: UUID;
  confidence?: number;
  evidenceRefs?: string[];
}

export interface MissionAuthorizationDeniedPayload {
  missionId: UUID;
  reason?: string;
  evidenceRefs?: string[];
}

export interface MissionDeploymentDeclaredPayload {
  missionId: UUID;
}

export interface MissionObjectiveAchievedPayload {
  missionId: UUID;
}

export interface MissionReturnToBaseRequestedPayload {
  missionId: UUID;
  reason?: string;
}

export interface MissionCompletedPayload {
  missionId: UUID;
}

export interface MissionDebriefStartedPayload {
  missionId: UUID;
}

export interface MissionDebriefCompletedPayload {
  missionId: UUID;
  honestyConfidence?: number;
  decisionIntegrity?: number;
  missionIntegrity?: number;
}

export interface MissionArchivedPayload {
  missionId: UUID;
  archiveRecordId?: UUID;
}

export interface MissionCommandSucceededPayload {
  commandId: UUID;
  commandType: string;
  ok: true;
  result: unknown;
}

export interface MissionCommandFailedPayload {
  commandId?: UUID;
  commandType: string;
  ok: false;
  code: string;
  message: string;
  validationErrors?: readonly {
    path: string;
    code: string;
    message: string;
  }[];
}

export interface OperatorCommandAssumedPayload {
  operatorId?: UUID;
  commandAuthority?: string;
}

export interface OperatorCommandReleasedPayload {
  operatorId?: UUID;
  reason?: string;
}

export interface OperatorIdentitySnapshotRecordedPayload {
  snapshotId: UUID;
  missionId?: UUID;
  professionalAlignment: number;
  identityDrift: number;
  commandAuthority: string;
}

export interface OperatorIdentityDriftDetectedPayload {
  snapshotId?: UUID;
  identityDrift: number;
  confidence?: number;
}

export interface OperatorJudgmentReserveChangedPayload {
  previous: number;
  current: number;
}

export interface OperatorReadinessReportSubmittedPayload {
  reportId: UUID;
  readinessScore?: number;
}

export interface OperatorRecoveryWindowPayload {
  recoveryWindowId: UUID;
  missionId?: UUID;
}

export interface GuardianProtocolActivatedPayload {
  protocol: string;
  reason?: string;
}

export interface GuardianInterventionRecommendedPayload {
  interventionType: 'stand_down' | 'return_to_base' | 'recovery_window' | 'guardian_lock';
  reason: string;
  confidence?: number;
  evidenceRefs?: string[];
}

export interface GuardianVaultSecuredPayload {
  vaultId?: UUID;
  reason?: string;
}

export interface GuardianUnlockRequestedPayload {
  requestId: UUID;
  reason?: string;
}

export interface GuardianSuccessProtocolActivatedPayload {
  missionId?: UUID;
  reason?: string;
}

export interface GuardianCapitalIntegrityChangedPayload {
  previous: number;
  current: number;
  reason?: string;
}

export interface ArchiveArtifactWrittenPayload {
  artifactId: UUID;
  artifactType: 'event' | 'mission_report' | 'doctrine_snapshot' | 'operator_snapshot' | 'black_box';
  missionId?: UUID;
  importance?: number;
}

export interface ArchiveCampaignBookUpdatedPayload {
  campaignId: UUID;
  bookId?: UUID;
}

export interface ArchiveDoctrineSnapshotSavedPayload {
  doctrineId: UUID;
  snapshotId: UUID;
}

export interface ArchiveBlackBoxClosedPayload {
  missionId: UUID;
  artifactId?: UUID;
}

export interface EnvironmentRoomEnteredPayload {
  roomId: string;
  previousRoomId?: string;
}

export interface EnvironmentLightingProfileChangedPayload {
  profileId: string;
  roomId?: string;
}

export interface EnvironmentAudioProfileChangedPayload {
  profileId: string;
  roomId?: string;
}

export interface EnvironmentTransitionPayload {
  transitionId: UUID;
  fromRoomId?: string;
  toRoomId?: string;
}

export interface EventPayloadMap {
  'system.boot.started': SystemBootStartedPayload;
  'system.boot.completed': SystemBootCompletedPayload;
  'hq.boot.started': Record<string, never>;
  'hq.boot.completed': Record<string, never>;
  'hq.shutdown.requested': { reason?: string };
  'mission.created': MissionCreatedPayload;
  'mission.briefing_started': { missionId: UUID };
  'mission.briefing_completed': MissionBriefingCompletedPayload;
  'mission.observation_started': MissionObservationStartedPayload;
  'mission.authorization_requested': MissionAuthorizationRequestedPayload;
  'mission.authorized': MissionAuthorizedPayload;
  'mission.authorization_denied': MissionAuthorizationDeniedPayload;
  'mission.deployment_declared': MissionDeploymentDeclaredPayload;
  'mission.objective_achieved': MissionObjectiveAchievedPayload;
  'mission.return_to_base_requested': MissionReturnToBaseRequestedPayload;
  'mission.completed': MissionCompletedPayload;
  'mission.debrief_started': MissionDebriefStartedPayload;
  'mission.debrief_completed': MissionDebriefCompletedPayload;
  'mission.archived': MissionArchivedPayload;
  'mission.state.changed': MissionStateChangedPayload;
  'mission.command.succeeded': MissionCommandSucceededPayload;
  'mission.command.failed': MissionCommandFailedPayload;
  'operator.command_assumed': OperatorCommandAssumedPayload;
  'operator.command_released': OperatorCommandReleasedPayload;
  'operator.identity_snapshot_recorded': OperatorIdentitySnapshotRecordedPayload;
  'operator.identity_drift_detected': OperatorIdentityDriftDetectedPayload;
  'operator.judgment_reserve_changed': OperatorJudgmentReserveChangedPayload;
  'operator.readiness_report_submitted': OperatorReadinessReportSubmittedPayload;
  'operator.recovery_window_started': OperatorRecoveryWindowPayload;
  'operator.recovery_window_completed': OperatorRecoveryWindowPayload;
  'guardian.protocol_activated': GuardianProtocolActivatedPayload;
  'guardian.intervention_recommended': GuardianInterventionRecommendedPayload;
  'guardian.vault_secured': GuardianVaultSecuredPayload;
  'guardian.unlock_requested': GuardianUnlockRequestedPayload;
  'guardian.success_protocol_activated': GuardianSuccessProtocolActivatedPayload;
  'guardian.capital_integrity_changed': GuardianCapitalIntegrityChangedPayload;
  'archive.artifact_written': ArchiveArtifactWrittenPayload;
  'archive.campaign_book_updated': ArchiveCampaignBookUpdatedPayload;
  'archive.doctrine_snapshot_saved': ArchiveDoctrineSnapshotSavedPayload;
  'archive.black_box_closed': ArchiveBlackBoxClosedPayload;
  'environment.room_entered': EnvironmentRoomEnteredPayload;
  'environment.lighting_profile_changed': EnvironmentLightingProfileChangedPayload;
  'environment.audio_profile_changed': EnvironmentAudioProfileChangedPayload;
  'environment.transition_started': EnvironmentTransitionPayload;
  'environment.transition_completed': EnvironmentTransitionPayload;
}

export interface EventRegistryEntry<TType extends HeadquartersEventType = HeadquartersEventType> {
  id: TType;
  category: EventCategory;
  defaultPriority: EventPriority;
  version: number;
  description: string;
  owner: string;
  consumers: readonly string[];
}

type EventRegistryShape = {
  readonly [TType in HeadquartersEventType]: EventRegistryEntry<TType>;
};

export const EVENT_REGISTRY = {
  'system.boot.started': { id: 'system.boot.started', category: 'system', defaultPriority: 'white', version: 1, description: 'System boot started.', owner: 'HQOSKernel', consumers: ['ArchiveService', 'Commander'] },
  'system.boot.completed': { id: 'system.boot.completed', category: 'system', defaultPriority: 'white', version: 1, description: 'System boot completed.', owner: 'HQOSKernel', consumers: ['ArchiveService', 'Commander'] },
  'hq.boot.started': { id: 'hq.boot.started', category: 'system', defaultPriority: 'white', version: 1, description: 'HQOS boot sequence started.', owner: 'HQOSKernel', consumers: ['ArchiveService', 'Commander'] },
  'hq.boot.completed': { id: 'hq.boot.completed', category: 'system', defaultPriority: 'green', version: 1, description: 'HQOS boot sequence completed.', owner: 'HQOSKernel', consumers: ['ArchiveService', 'Commander'] },
  'hq.shutdown.requested': { id: 'hq.shutdown.requested', category: 'system', defaultPriority: 'amber', version: 1, description: 'HQOS shutdown was requested.', owner: 'HQOSKernel', consumers: ['ArchiveService', 'Commander'] },
  'mission.created': { id: 'mission.created', category: 'mission', defaultPriority: 'white', version: 1, description: 'A mission record was created.', owner: 'MissionService', consumers: ['ArchiveService', 'Guardian', 'Commander'] },
  'mission.briefing_started': { id: 'mission.briefing_started', category: 'mission', defaultPriority: 'white', version: 1, description: 'Mission briefing started.', owner: 'MissionService', consumers: ['ArchiveService', 'Guardian', 'Commander'] },
  'mission.briefing_completed': { id: 'mission.briefing_completed', category: 'mission', defaultPriority: 'green', version: 1, description: 'Mission briefing completed.', owner: 'MissionService', consumers: ['ArchiveService', 'Guardian', 'Commander'] },
  'mission.observation_started': { id: 'mission.observation_started', category: 'mission', defaultPriority: 'white', version: 1, description: 'Mission observation started.', owner: 'MissionService', consumers: ['ArchiveService', 'Guardian', 'Commander'] },
  'mission.authorization_requested': { id: 'mission.authorization_requested', category: 'mission', defaultPriority: 'amber', version: 1, description: 'Mission authorization was requested.', owner: 'MissionService', consumers: ['ArchiveService', 'Guardian', 'Commander'] },
  'mission.authorized': { id: 'mission.authorized', category: 'mission', defaultPriority: 'green', version: 1, description: 'Mission authorization was granted.', owner: 'MissionService', consumers: ['ArchiveService', 'Guardian', 'Commander'] },
  'mission.authorization_denied': { id: 'mission.authorization_denied', category: 'mission', defaultPriority: 'red', version: 1, description: 'Mission authorization was denied.', owner: 'MissionService', consumers: ['ArchiveService', 'Guardian', 'Commander'] },
  'mission.deployment_declared': { id: 'mission.deployment_declared', category: 'mission', defaultPriority: 'amber', version: 1, description: 'Mission deployment was declared.', owner: 'MissionService', consumers: ['ArchiveService', 'Guardian', 'Commander'] },
  'mission.objective_achieved': { id: 'mission.objective_achieved', category: 'mission', defaultPriority: 'green', version: 1, description: 'Mission objective was achieved.', owner: 'MissionService', consumers: ['ArchiveService', 'Guardian', 'Commander'] },
  'mission.return_to_base_requested': { id: 'mission.return_to_base_requested', category: 'mission', defaultPriority: 'amber', version: 1, description: 'Return to base was requested.', owner: 'MissionService', consumers: ['ArchiveService', 'Guardian', 'Commander'] },
  'mission.completed': { id: 'mission.completed', category: 'mission', defaultPriority: 'green', version: 1, description: 'Mission completed.', owner: 'MissionService', consumers: ['ArchiveService', 'Guardian', 'Commander'] },
  'mission.debrief_started': { id: 'mission.debrief_started', category: 'mission', defaultPriority: 'white', version: 1, description: 'Mission debrief started.', owner: 'MissionService', consumers: ['ArchiveService', 'Guardian', 'Commander'] },
  'mission.debrief_completed': { id: 'mission.debrief_completed', category: 'mission', defaultPriority: 'green', version: 1, description: 'Mission debrief completed.', owner: 'MissionService', consumers: ['ArchiveService', 'Guardian', 'Commander'] },
  'mission.archived': { id: 'mission.archived', category: 'mission', defaultPriority: 'white', version: 1, description: 'Mission was archived.', owner: 'MissionService', consumers: ['ArchiveService', 'Guardian', 'Commander'] },
  'mission.state.changed': { id: 'mission.state.changed', category: 'mission', defaultPriority: 'white', version: 1, description: 'Mission state changed.', owner: 'MissionService', consumers: ['ArchiveService', 'Guardian', 'Commander'] },
  'mission.command.succeeded': { id: 'mission.command.succeeded', category: 'mission', defaultPriority: 'white', version: 1, description: 'Mission command execution succeeded.', owner: 'MissionService', consumers: ['ArchiveService', 'Commander'] },
  'mission.command.failed': { id: 'mission.command.failed', category: 'mission', defaultPriority: 'amber', version: 1, description: 'Mission command execution failed.', owner: 'MissionService', consumers: ['ArchiveService', 'Commander', 'Guardian'] },
  'operator.command_assumed': { id: 'operator.command_assumed', category: 'operator', defaultPriority: 'green', version: 1, description: 'Operator assumed command.', owner: 'OperatorModelService', consumers: ['ArchiveService', 'Guardian', 'Commander'] },
  'operator.command_released': { id: 'operator.command_released', category: 'operator', defaultPriority: 'white', version: 1, description: 'Operator released command.', owner: 'OperatorModelService', consumers: ['ArchiveService', 'Guardian', 'Commander'] },
  'operator.identity_snapshot_recorded': { id: 'operator.identity_snapshot_recorded', category: 'operator', defaultPriority: 'white', version: 1, description: 'Operator identity snapshot was recorded.', owner: 'OperatorModelService', consumers: ['ArchiveService', 'Guardian', 'Commander'] },
  'operator.identity_drift_detected': { id: 'operator.identity_drift_detected', category: 'operator', defaultPriority: 'amber', version: 1, description: 'Operator identity drift was detected.', owner: 'OperatorModelService', consumers: ['ArchiveService', 'Guardian', 'Commander'] },
  'operator.judgment_reserve_changed': { id: 'operator.judgment_reserve_changed', category: 'operator', defaultPriority: 'amber', version: 1, description: 'Operator judgment reserve changed.', owner: 'OperatorModelService', consumers: ['ArchiveService', 'Guardian', 'Commander'] },
  'operator.readiness_report_submitted': { id: 'operator.readiness_report_submitted', category: 'operator', defaultPriority: 'white', version: 1, description: 'Operator readiness report was submitted.', owner: 'OperatorModelService', consumers: ['ArchiveService', 'Guardian', 'Commander'] },
  'operator.recovery_window_started': { id: 'operator.recovery_window_started', category: 'operator', defaultPriority: 'amber', version: 1, description: 'Operator recovery window started.', owner: 'OperatorModelService', consumers: ['ArchiveService', 'Guardian', 'Commander'] },
  'operator.recovery_window_completed': { id: 'operator.recovery_window_completed', category: 'operator', defaultPriority: 'green', version: 1, description: 'Operator recovery window completed.', owner: 'OperatorModelService', consumers: ['ArchiveService', 'Guardian', 'Commander'] },
  'guardian.protocol_activated': { id: 'guardian.protocol_activated', category: 'guardian', defaultPriority: 'red', version: 1, description: 'Guardian protocol was activated.', owner: 'GuardianService', consumers: ['ArchiveService', 'Commander', 'MissionService'] },
  'guardian.intervention_recommended': { id: 'guardian.intervention_recommended', category: 'guardian', defaultPriority: 'red', version: 1, description: 'Guardian intervention was recommended.', owner: 'GuardianService', consumers: ['ArchiveService', 'Commander', 'MissionService'] },
  'guardian.vault_secured': { id: 'guardian.vault_secured', category: 'guardian', defaultPriority: 'black', version: 1, description: 'Guardian vault was secured.', owner: 'GuardianService', consumers: ['ArchiveService', 'Commander', 'MissionService'] },
  'guardian.unlock_requested': { id: 'guardian.unlock_requested', category: 'guardian', defaultPriority: 'amber', version: 1, description: 'Guardian unlock was requested.', owner: 'GuardianService', consumers: ['ArchiveService', 'Commander', 'MissionService'] },
  'guardian.success_protocol_activated': { id: 'guardian.success_protocol_activated', category: 'guardian', defaultPriority: 'green', version: 1, description: 'Guardian success protocol was activated.', owner: 'GuardianService', consumers: ['ArchiveService', 'Commander', 'MissionService'] },
  'guardian.capital_integrity_changed': { id: 'guardian.capital_integrity_changed', category: 'guardian', defaultPriority: 'amber', version: 1, description: 'Guardian capital integrity changed.', owner: 'GuardianService', consumers: ['ArchiveService', 'Commander', 'MissionService'] },
  'archive.artifact_written': { id: 'archive.artifact_written', category: 'archive', defaultPriority: 'white', version: 1, description: 'Archive artifact was written.', owner: 'ArchiveService', consumers: ['Historian', 'Commander'] },
  'archive.campaign_book_updated': { id: 'archive.campaign_book_updated', category: 'archive', defaultPriority: 'white', version: 1, description: 'Campaign book was updated.', owner: 'ArchiveService', consumers: ['Historian', 'Commander'] },
  'archive.doctrine_snapshot_saved': { id: 'archive.doctrine_snapshot_saved', category: 'archive', defaultPriority: 'white', version: 1, description: 'Doctrine snapshot was saved.', owner: 'ArchiveService', consumers: ['Historian', 'Commander'] },
  'archive.black_box_closed': { id: 'archive.black_box_closed', category: 'archive', defaultPriority: 'amber', version: 1, description: 'Black box was closed.', owner: 'ArchiveService', consumers: ['Historian', 'Commander'] },
  'environment.room_entered': { id: 'environment.room_entered', category: 'environment', defaultPriority: 'white', version: 1, description: 'Environment room was entered.', owner: 'EnvironmentService', consumers: ['HQOSKernel', 'Commander'] },
  'environment.lighting_profile_changed': { id: 'environment.lighting_profile_changed', category: 'environment', defaultPriority: 'white', version: 1, description: 'Lighting profile changed.', owner: 'EnvironmentService', consumers: ['HQOSKernel', 'Commander'] },
  'environment.audio_profile_changed': { id: 'environment.audio_profile_changed', category: 'environment', defaultPriority: 'white', version: 1, description: 'Audio profile changed.', owner: 'EnvironmentService', consumers: ['HQOSKernel', 'Commander'] },
  'environment.transition_started': { id: 'environment.transition_started', category: 'environment', defaultPriority: 'white', version: 1, description: 'Environment transition started.', owner: 'EnvironmentService', consumers: ['HQOSKernel', 'Commander'] },
  'environment.transition_completed': { id: 'environment.transition_completed', category: 'environment', defaultPriority: 'white', version: 1, description: 'Environment transition completed.', owner: 'EnvironmentService', consumers: ['HQOSKernel', 'Commander'] },
} as const satisfies EventRegistryShape;

export const EVENT_IDS = Object.keys(EVENT_REGISTRY) as HeadquartersEventType[];
export const EVENT_CATEGORIES = ['system', 'mission', 'operator', 'guardian', 'archive', 'environment'] as const satisfies readonly EventCategory[];

export function isKnownEventType(value: string): value is HeadquartersEventType {
  return Object.hasOwn(EVENT_REGISTRY, value);
}

export function getEventRegistryEntry<TType extends HeadquartersEventType>(type: TType): (typeof EVENT_REGISTRY)[TType] {
  return EVENT_REGISTRY[type];
}

export function getEventCategory(type: HeadquartersEventType): EventCategory {
  return EVENT_REGISTRY[type].category;
}

export function getDefaultEventPriority(type: HeadquartersEventType): EventPriority {
  return EVENT_REGISTRY[type].defaultPriority;
}

export function getEventSchemaVersion(type: HeadquartersEventType): number {
  return EVENT_REGISTRY[type].version;
}

export function getEventIdsByCategory(category: EventCategory): HeadquartersEventType[] {
  return EVENT_IDS.filter((type) => EVENT_REGISTRY[type].category === category);
}
