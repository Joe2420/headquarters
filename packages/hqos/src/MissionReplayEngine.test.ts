import { describe, expect, it } from 'vitest';
import { buildMissionEvaluation } from './MissionEvaluationEngine';
import { buildMissionReplay } from './MissionReplayEngine';
import type { MissionLifecycleProjection } from './MissionLifecycleProjection';

const lifecycle: MissionLifecycleProjection = {
  missionId: 'mission-1',
  activeStage: 'archived',
  completedStages: ['missionCreation', 'briefing', 'observation', 'authorization', 'deployed', 'returnToBase', 'debrief'],
  availableRooms: ['command-center', 'mission-room', 'ready-room', 'observation-room', 'war-room', 'debrief-theater', 'archive'],
  recommendedRoom: 'archive',
  currentPrimaryAction: {
    id: 'create-next-mission',
    label: 'Create Next Mission',
    room: 'mission-room',
    explanation: 'Archived mission remains historical.',
    disabled: false,
  },
  blockedActions: [],
  transitionReason: 'Archived mission remains historical.',
  missionCompletionState: 'complete',
  currentMissionState: 'archived',
  missionActive: true,
  missionComplete: true,
};

const evaluation = buildMissionEvaluation({
  missionId: 'mission-1',
  missionState: 'archived',
  evaluatedAt: '2026-07-13T09:00:00.000Z',
  guardian: { state: 'secure', highestAlert: 'Guardian secure.' },
  doctrine: {
    activeProtectiveRule: 'Wait for valid invalidation.',
    pendingCandidateCount: 0,
    relevance: 'Doctrine was referenced.',
  },
  missionIntelligence: {
    missionId: 'mission-1',
    missionObjective: 'Trade only clean continuation.',
    riskLimit: '1R',
    trend: 'Higher highs',
    structure: 'Expansion',
    invalidation: 'Break of structure',
    observationSummary: 'Observation was specific.',
    authorizationSummary: 'Authorization followed doctrine.',
    debriefSummary: 'Operator reviewed behavior honestly.',
    missingEvidence: [],
    contradictions: [],
    guardianNotes: [],
  },
});

describe('MissionReplayEngine', () => {
  it('produces deterministic replay output from identical evidence', () => {
    const input = {
      missionId: 'mission-1',
      missionName: 'London Open',
      createdAt: '2026-07-13T08:00:00.000Z',
      lifecycle,
      evaluation,
      evidenceRecords: [{
        id: 'journal-1',
        source: 'journal',
        occurredAt: '2026-07-13T08:30:00.000Z',
        title: 'Journal saved',
        summary: 'Operator captured the lesson.',
        section: 'debrief' as const,
        type: 'journal_update' as const,
        actor: 'journal' as const,
        room: 'debrief-theater',
      }],
    };

    expect(buildMissionReplay(input)).toEqual(buildMissionReplay(input));
  });

  it('orders events and groups them into replay sections', () => {
    const replay = buildMissionReplay({
      missionId: 'mission-1',
      missionName: 'London Open',
      createdAt: '2026-07-13T08:00:00.000Z',
      lifecycle,
      evaluation,
    });

    expect(replay.timeline.events[0]?.section).toBe('mission-opening');
    expect(replay.lifecycle).toContain('ready-room');
    expect(replay.lifecycle).toContain('evaluation');
    expect(replay.summary.finalOutcome).toBe(evaluation.verdict);
  });

  it('reuses the authoritative MissionEvaluation object', () => {
    const replay = buildMissionReplay({
      missionId: 'mission-1',
      missionName: 'London Open',
      createdAt: '2026-07-13T08:00:00.000Z',
      lifecycle,
      evaluation,
    });

    expect(replay.evaluation).toBe(evaluation);
    expect(replay.summary.recommendations.map((item) => item.evidenceIds)).toContainEqual([evaluation.id]);
  });
});
