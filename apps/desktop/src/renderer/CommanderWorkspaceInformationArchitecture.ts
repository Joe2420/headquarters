import type { CommanderWorkspaceMode } from './CommanderWorkspaceModel';

export type CommanderWorkspaceSectionCategory =
  | 'immediate_operation'
  | 'operational_context'
  | 'supporting_system'
  | 'history'
  | 'diagnostics';

export type CommanderWorkspaceVisibilityPolicy =
  | 'always'
  | 'when_relevant'
  | 'when_active'
  | 'when_blocking'
  | 'on_request'
  | 'diagnostics_only';

export type CommanderWorkspaceMissionScope =
  | 'global'
  | 'current_session'
  | 'active_mission'
  | 'recoverable_mission'
  | 'archived_mission'
  | 'historical'
  | 'diagnostic';

export interface CommanderWorkspaceSection {
  readonly sectionId: string;
  readonly label: string;
  readonly category: CommanderWorkspaceSectionCategory;
  readonly priority: number;
  readonly visibilityPolicy: CommanderWorkspaceVisibilityPolicy;
  readonly lifecycleRelevance: 'all' | 'active_only' | 'archive_only' | 'blocked_only' | 'standby_only';
  readonly missionScope: CommanderWorkspaceMissionScope;
  readonly defaultExpanded: boolean;
  readonly availableActions: readonly string[];
  readonly sourceProjection: string;
  readonly emptyStatePolicy: string;
  readonly primaryLocation: 'conversation' | 'mission_header' | 'interaction_dock' | 'command_rail' | 'context_drawer' | 'diagnostics';
}

export const commanderWorkspaceSections: readonly CommanderWorkspaceSection[] = Object.freeze([
  {
    sectionId: 'commander-conversation',
    label: 'Commander Conversation',
    category: 'immediate_operation',
    priority: 1,
    visibilityPolicy: 'always',
    lifecycleRelevance: 'all',
    missionScope: 'current_session',
    defaultExpanded: true,
    availableActions: ['answer_current_question', 'review_latest_transmission'],
    sourceProjection: 'CommanderExperienceState',
    emptyStatePolicy: 'show_current_commander_instruction',
    primaryLocation: 'conversation',
  },
  {
    sectionId: 'active-question',
    label: 'Active Commander Question',
    category: 'immediate_operation',
    priority: 2,
    visibilityPolicy: 'when_active',
    lifecycleRelevance: 'active_only',
    missionScope: 'active_mission',
    defaultExpanded: true,
    availableActions: ['transmit_answer'],
    sourceProjection: 'CommanderExperienceState.nextAction',
    emptyStatePolicy: 'hide_when_no_question',
    primaryLocation: 'interaction_dock',
  },
  {
    sectionId: 'primary-action',
    label: 'Primary Action',
    category: 'immediate_operation',
    priority: 3,
    visibilityPolicy: 'always',
    lifecycleRelevance: 'all',
    missionScope: 'current_session',
    defaultExpanded: true,
    availableActions: ['execute_primary_action'],
    sourceProjection: 'MissionLifecycleProjection.currentPrimaryAction',
    emptyStatePolicy: 'show_standby_action',
    primaryLocation: 'interaction_dock',
  },
  {
    sectionId: 'active-blocker',
    label: 'Active Blocker',
    category: 'immediate_operation',
    priority: 4,
    visibilityPolicy: 'when_blocking',
    lifecycleRelevance: 'blocked_only',
    missionScope: 'active_mission',
    defaultExpanded: true,
    availableActions: ['open_recovery_detail'],
    sourceProjection: 'Guardian/OperationalConsequence/AttentionRequest projections',
    emptyStatePolicy: 'hide_when_secure',
    primaryLocation: 'command_rail',
  },
  {
    sectionId: 'mission-header',
    label: 'Mission Header',
    category: 'immediate_operation',
    priority: 5,
    visibilityPolicy: 'always',
    lifecycleRelevance: 'all',
    missionScope: 'current_session',
    defaultExpanded: true,
    availableActions: [],
    sourceProjection: 'CommanderWorkspaceSnapshot',
    emptyStatePolicy: 'show_headquarters_standby',
    primaryLocation: 'mission_header',
  },
  {
    sectionId: 'mission-record',
    label: 'Mission Record',
    category: 'supporting_system',
    priority: 20,
    visibilityPolicy: 'on_request',
    lifecycleRelevance: 'all',
    missionScope: 'historical',
    defaultExpanded: false,
    availableActions: ['resume_mission', 'review_mission'],
    sourceProjection: 'MissionRepository/MissionHistory',
    emptyStatePolicy: 'summarize_no_completed_mission',
    primaryLocation: 'context_drawer',
  },
  {
    sectionId: 'commander-learning',
    label: 'Commander Learning',
    category: 'supporting_system',
    priority: 21,
    visibilityPolicy: 'on_request',
    lifecycleRelevance: 'all',
    missionScope: 'historical',
    defaultExpanded: false,
    availableActions: ['review_learning_detail'],
    sourceProjection: 'CommanderRelationship/BehaviorProfile projections',
    emptyStatePolicy: 'show_learning_begins_after_evidence',
    primaryLocation: 'context_drawer',
  },
  {
    sectionId: 'command-chair',
    label: 'Command Chair',
    category: 'operational_context',
    priority: 10,
    visibilityPolicy: 'when_relevant',
    lifecycleRelevance: 'all',
    missionScope: 'current_session',
    defaultExpanded: false,
    availableActions: ['return_to_command_chair'],
    sourceProjection: 'CommanderWorkspaceSnapshot',
    emptyStatePolicy: 'show_current_station_only',
    primaryLocation: 'command_rail',
  },
  {
    sectionId: 'situation-board',
    label: 'Situation Board',
    category: 'operational_context',
    priority: 11,
    visibilityPolicy: 'when_relevant',
    lifecycleRelevance: 'all',
    missionScope: 'current_session',
    defaultExpanded: false,
    availableActions: ['open_recommended_room'],
    sourceProjection: 'HeadquartersPriorityEngine',
    emptyStatePolicy: 'show_next_logical_action',
    primaryLocation: 'command_rail',
  },
  {
    sectionId: 'hq-broadcast',
    label: 'HQ Broadcast',
    category: 'history',
    priority: 40,
    visibilityPolicy: 'on_request',
    lifecycleRelevance: 'all',
    missionScope: 'historical',
    defaultExpanded: false,
    availableActions: ['review_broadcast_history'],
    sourceProjection: 'HeadquartersEventEngine',
    emptyStatePolicy: 'hide_empty_history',
    primaryLocation: 'context_drawer',
  },
  {
    sectionId: 'notifications',
    label: 'Notifications',
    category: 'history',
    priority: 41,
    visibilityPolicy: 'on_request',
    lifecycleRelevance: 'all',
    missionScope: 'historical',
    defaultExpanded: false,
    availableActions: ['review_notifications'],
    sourceProjection: 'LivingHeadquartersOrchestrator',
    emptyStatePolicy: 'hide_empty_history',
    primaryLocation: 'context_drawer',
  },
  {
    sectionId: 'live-timeline',
    label: 'Live Timeline',
    category: 'history',
    priority: 42,
    visibilityPolicy: 'on_request',
    lifecycleRelevance: 'all',
    missionScope: 'historical',
    defaultExpanded: false,
    availableActions: ['review_timeline'],
    sourceProjection: 'LivingHeadquartersHistory',
    emptyStatePolicy: 'show_concise_empty_history',
    primaryLocation: 'context_drawer',
  },
  {
    sectionId: 'services',
    label: 'Services',
    category: 'diagnostics',
    priority: 50,
    visibilityPolicy: 'diagnostics_only',
    lifecycleRelevance: 'all',
    missionScope: 'diagnostic',
    defaultExpanded: false,
    availableActions: ['review_service_health'],
    sourceProjection: 'StartupStatus/ServiceRegistry',
    emptyStatePolicy: 'hide_from_primary_view',
    primaryLocation: 'diagnostics',
  },
  {
    sectionId: 'institutional-health',
    label: 'Institutional Health',
    category: 'supporting_system',
    priority: 22,
    visibilityPolicy: 'on_request',
    lifecycleRelevance: 'all',
    missionScope: 'historical',
    defaultExpanded: false,
    availableActions: ['review_health_detail'],
    sourceProjection: 'InstitutionalHealthSnapshot',
    emptyStatePolicy: 'show_concise_unknown_state',
    primaryLocation: 'context_drawer',
  },
  {
    sectionId: 'operational-consequences',
    label: 'Operational Consequences',
    category: 'operational_context',
    priority: 12,
    visibilityPolicy: 'when_blocking',
    lifecycleRelevance: 'blocked_only',
    missionScope: 'active_mission',
    defaultExpanded: true,
    availableActions: ['review_recovery_action'],
    sourceProjection: 'OperationalConsequence selectors',
    emptyStatePolicy: 'hide_when_none_active',
    primaryLocation: 'command_rail',
  },
  {
    sectionId: 'final-evaluation',
    label: 'Final Evaluation',
    category: 'supporting_system',
    priority: 23,
    visibilityPolicy: 'when_relevant',
    lifecycleRelevance: 'archive_only',
    missionScope: 'archived_mission',
    defaultExpanded: false,
    availableActions: ['review_evaluation_detail'],
    sourceProjection: 'MissionEvaluationEngine',
    emptyStatePolicy: 'hide_until_debrief_or_archive',
    primaryLocation: 'context_drawer',
  },
  {
    sectionId: 'guardian-doctrine',
    label: 'Guardian and Doctrine',
    category: 'operational_context',
    priority: 13,
    visibilityPolicy: 'when_relevant',
    lifecycleRelevance: 'all',
    missionScope: 'current_session',
    defaultExpanded: false,
    availableActions: ['open_guardian_detail', 'open_doctrine_review'],
    sourceProjection: 'Guardian/Doctrine projections',
    emptyStatePolicy: 'show_secure_or_none_pending',
    primaryLocation: 'command_rail',
  },
  {
    sectionId: 'intelligence',
    label: 'Intelligence',
    category: 'operational_context',
    priority: 14,
    visibilityPolicy: 'when_relevant',
    lifecycleRelevance: 'active_only',
    missionScope: 'active_mission',
    defaultExpanded: false,
    availableActions: ['review_intelligence_detail'],
    sourceProjection: 'MissionIntelligencePackage',
    emptyStatePolicy: 'hide_mission_scope_when_no_active_mission',
    primaryLocation: 'command_rail',
  },
  {
    sectionId: 'diagnostics',
    label: 'Diagnostics',
    category: 'diagnostics',
    priority: 99,
    visibilityPolicy: 'diagnostics_only',
    lifecycleRelevance: 'all',
    missionScope: 'diagnostic',
    defaultExpanded: false,
    availableActions: ['review_diagnostics'],
    sourceProjection: 'StartupStatus/Database/Migrations',
    emptyStatePolicy: 'hidden_by_default',
    primaryLocation: 'diagnostics',
  },
]);

export function getCommanderWorkspaceSectionsForMode(
  mode: CommanderWorkspaceMode,
): readonly CommanderWorkspaceSection[] {
  return commanderWorkspaceSections
    .filter((section) => isSectionRelevantForMode(section, mode))
    .sort((left, right) => left.priority - right.priority || left.sectionId.localeCompare(right.sectionId));
}

export function getCommanderWorkspacePrimaryLocation(sectionId: string): CommanderWorkspaceSection['primaryLocation'] | undefined {
  return commanderWorkspaceSections.find((section) => section.sectionId === sectionId)?.primaryLocation;
}

export function hasDuplicateFullDetailLocations(): boolean {
  const fullDetail = commanderWorkspaceSections.filter((section) => section.primaryLocation === 'context_drawer' || section.primaryLocation === 'diagnostics');
  return new Set(fullDetail.map((section) => section.sectionId)).size !== fullDetail.length;
}

function isSectionRelevantForMode(section: CommanderWorkspaceSection, mode: CommanderWorkspaceMode): boolean {
  if (section.visibilityPolicy === 'diagnostics_only') return false;
  if (section.lifecycleRelevance === 'standby_only') return mode === 'standby';
  if (section.lifecycleRelevance === 'active_only') return mode === 'active' || mode === 'blocked' || mode === 'interrupted' || mode === 'recovering';
  if (section.lifecycleRelevance === 'archive_only') return mode === 'archived';
  if (section.lifecycleRelevance === 'blocked_only') return mode === 'blocked' || mode === 'interrupted' || mode === 'recovering';
  return true;
}
