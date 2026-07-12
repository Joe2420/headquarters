import { describe, expect, it } from 'vitest';
import type {
  HeadquartersAttentionRequest,
  HeadquartersPriorityItem,
  MissionLifecycleProjection,
  MissionLifecycleRoom,
} from '@headquarters/hqos';
import { buildCommanderWorkspaceSnapshot } from './CommanderWorkspaceModel';

const lifecycle = (input: Partial<MissionLifecycleProjection> = {}): MissionLifecycleProjection => ({
  missionId: 'mission-1',
  activeStage: 'observation',
  completedStages: ['missionCreation', 'briefing'],
  availableRooms: ['command-center', 'mission-room', 'ready-room', 'observation-room'],
  recommendedRoom: 'observation-room',
  currentPrimaryAction: {
    id: 'complete-observation',
    label: 'Complete Observation',
    room: 'observation-room',
    explanation: 'Visible evidence must be collected before War Room authorization.',
    disabled: false,
  },
  blockedActions: [],
  transitionReason: 'Visible evidence must be collected before War Room authorization.',
  missionCompletionState: 'active',
  currentMissionState: 'observation',
  missionActive: true,
  missionComplete: false,
  ...input,
});

const standbyLifecycle = (): MissionLifecycleProjection => ({
  activeStage: 'missionCreation',
  completedStages: [],
  availableRooms: ['command-center', 'mission-room'],
  recommendedRoom: 'mission-room',
  currentPrimaryAction: {
    id: 'create-mission',
    label: 'Create Mission',
    room: 'mission-room',
    explanation: 'No active mission exists.',
    disabled: false,
  },
  blockedActions: [],
  transitionReason: 'No active mission exists.',
  missionCompletionState: 'standby',
  missionActive: false,
  missionComplete: false,
});

const priority = (input: Partial<HeadquartersPriorityItem> = {}): HeadquartersPriorityItem => ({
  id: 'priority:mission:complete-observation',
  source: 'mission',
  type: 'mission_lifecycle',
  title: 'Complete Observation',
  explanation: 'Observation owns current evidence collection.',
  severity: 'immediate',
  urgency: 'next',
  lifecycleRelevance: 'current',
  blocking: false,
  recommendedRoom: 'observation-room',
  recommendedAction: 'Complete Observation',
  evidenceReferences: [{ id: 'mission-1', source: 'mission' }],
  detectedAt: '2026-07-13T00:00:00.000Z',
  resolved: false,
  ...input,
});

const request = (input: Partial<HeadquartersAttentionRequest> = {}): HeadquartersAttentionRequest => ({
  requestId: 'attention-1',
  sourceSubsystem: 'guardian',
  requestType: 'guardian_attention_required',
  title: 'Guardian restriction',
  summary: 'Guardian requires operator review.',
  reason: 'Risk threshold exceeded.',
  urgency: 'critical',
  severity: 'blocking',
  status: 'pending',
  missionId: 'mission-1',
  lifecycleStage: 'authorization',
  recommendedRoom: 'war-room',
  recommendedAction: 'Resolve Guardian restriction',
  blocking: true,
  interruptionPolicy: 'interrupt_immediately',
  evidenceReferences: [{ id: 'guardian-1', source: 'guardian' }],
  sourceEntityId: 'guardian-1',
  createdAt: '2026-07-13T00:00:00.000Z',
  firstEligibleAt: '2026-07-13T00:00:00.000Z',
  deduplicationKey: 'guardian:attention',
  metadata: {},
  ...input,
});

describe('CommanderWorkspaceModel', () => {
  it('uses lifecycle action as the active workspace primary action', () => {
    const snapshot = buildCommanderWorkspaceSnapshot({
      lifecycle: lifecycle(),
      highestPriority: priority(),
    });

    expect(snapshot.mode).toBe('active');
    expect(snapshot.primaryAction.label).toBe('Complete Observation');
    expect(snapshot.recommendedRoom).toBe('observation-room');
    expect(snapshot.currentRoom).toBe('observation-room');
  });

  it('enters standby when no mission is active', () => {
    const snapshot = buildCommanderWorkspaceSnapshot({
      lifecycle: standbyLifecycle(),
      highestPriority: priority({
        id: 'priority:mission:create-mission',
        recommendedRoom: 'mission-room',
        recommendedAction: 'Create Mission',
      }),
    });

    expect(snapshot.mode).toBe('standby');
    expect(snapshot.primaryAction.room).toBe('mission-room');
  });

  it('uses interrupting attention requests before normal lifecycle guidance', () => {
    const snapshot = buildCommanderWorkspaceSnapshot({
      lifecycle: lifecycle(),
      highestPriority: priority(),
      attentionRequests: [request()],
    });

    expect(snapshot.mode).toBe('interrupted');
    expect(snapshot.recommendedRoom).toBe('war-room');
    expect(snapshot.primaryAction.label).toBe('Resolve Guardian restriction');
    expect(snapshot.blockers).toHaveLength(1);
  });

  it('keeps archived missions in archived mode', () => {
    const snapshot = buildCommanderWorkspaceSnapshot({
      lifecycle: lifecycle({
        activeStage: 'archived',
        recommendedRoom: 'archive',
        missionCompletionState: 'complete',
        missionComplete: true,
        currentMissionState: 'archived',
        currentPrimaryAction: {
          id: 'create-next-mission',
          label: 'Create Next Mission',
          room: 'mission-room',
          explanation: 'Archived mission remains historical.',
          disabled: false,
        },
      }),
      highestPriority: priority({ recommendedRoom: 'archive' as MissionLifecycleRoom }),
    });

    expect(snapshot.mode).toBe('archived');
    expect(snapshot.currentRoom).toBe('archive');
  });
});
