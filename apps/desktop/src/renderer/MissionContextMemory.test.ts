import { describe, expect, it } from 'vitest';
import {
  addCommanderContextNote,
  createEmptyMissionContext,
  getMissionLifecycleStageEnteredAt,
  recordMissionLifecycleStageEntry,
  snapshotMissionContext,
  updateMissionContextBriefing,
  updateMissionContextObservation,
  updateMissionContextReadiness,
  updateMissionOperationalTiming,
} from './MissionContextMemory';

describe('MissionContextMemory', () => {
  it('creates an empty deterministic mission context', () => {
    const context = createEmptyMissionContext('mission-001', { createdAt: '2026-07-04T00:00:00.000Z' });

    expect(context).toEqual({
      missionId: 'mission-001',
      briefing: {},
      observation: {},
      commanderNotes: [],
      contradictionFlags: [],
      readiness: {
        briefingComplete: false,
        observationComplete: false,
        warRoomReady: false,
        debriefReady: false,
      },
      createdAt: '2026-07-04T00:00:00.000Z',
      updatedAt: '2026-07-04T00:00:00.000Z',
    });
  });

  it('updates briefing answers while preserving previous answers', () => {
    const context = createEmptyMissionContext('mission-001');
    const withObjective = updateMissionContextBriefing(context, {
      missionObjective: 'Trade the morning breakout.',
      market: 'ES futures.',
    });
    const withEnvironment = updateMissionContextBriefing(withObjective, {
      marketEnvironment: 'Trending.',
      riskParameters: '1%',
    });

    expect(withEnvironment.briefing).toEqual({
      missionObjective: 'Trade the morning breakout.',
      market: 'ES futures.',
      marketEnvironment: 'Trending.',
      riskParameters: '1%',
    });
  });

  it('updates observation answers while preserving previous answers', () => {
    const context = createEmptyMissionContext('mission-001');
    const withDirection = updateMissionContextObservation(context, {
      observedDirection: 'Up.',
      marketStructure: 'Higher highs.',
    });
    const withEvidence = updateMissionContextObservation(withDirection, {
      liquidityNotes: 'Resting above prior high.',
      directionalHypothesis: 'Continuation long.',
    });

    expect(withEvidence.observation).toEqual({
      observedDirection: 'Up.',
      marketStructure: 'Higher highs.',
      liquidityNotes: 'Resting above prior high.',
      directionalHypothesis: 'Continuation long.',
    });
  });

  it('returns a deterministic context snapshot copy', () => {
    const context = updateMissionContextReadiness(
      addCommanderContextNote(
        updateMissionContextObservation(
          updateMissionContextBriefing(createEmptyMissionContext('mission-001'), {
            missionObjective: 'Wait for A setup.',
            successCriteria: 'No impulse trade.',
          }),
          {
            observedDirection: 'Range.',
            additionalObservations: ['No breakout yet.'],
          },
        ),
        {
          id: 'note-001',
          message: 'Discipline active.',
        },
      ),
      {
        briefingComplete: true,
        observationComplete: false,
      },
    );
    const snapshot = snapshotMissionContext(context);

    expect(snapshot).toEqual({
      missionId: 'mission-001',
      briefing: {
        missionObjective: 'Wait for A setup.',
        successCriteria: 'No impulse trade.',
      },
      observation: {
        observedDirection: 'Range.',
        additionalObservations: ['No breakout yet.'],
      },
      commanderNotes: [
        {
          id: 'note-001',
          message: 'Discipline active.',
        },
      ],
      contradictionFlags: [],
      readiness: {
        briefingComplete: true,
        observationComplete: false,
        warRoomReady: false,
        debriefReady: false,
      },
    });

    expect(snapshot.observation.additionalObservations).not.toBe(context.observation.additionalObservations);
  });

  it('records lifecycle-stage entry timestamps without duplicating the current stage', () => {
    const context = createEmptyMissionContext('mission-001', { createdAt: '2026-07-10T10:00:00.000Z' });
    const observation = recordMissionLifecycleStageEntry(context, 'observation', {
      enteredAt: '2026-07-10T10:05:00.000Z',
    });
    const duplicateObservation = recordMissionLifecycleStageEntry(observation, 'observation', {
      enteredAt: '2026-07-10T10:06:00.000Z',
    });
    const deployed = recordMissionLifecycleStageEntry(duplicateObservation, 'deployed', {
      enteredAt: '2026-07-10T10:10:00.000Z',
    });

    expect(deployed.timing?.lifecycleStageEntries).toEqual([
      { stage: 'idle', enteredAt: '2026-07-10T10:00:00.000Z' },
      { stage: 'observation', enteredAt: '2026-07-10T10:05:00.000Z' },
      { stage: 'deployed', enteredAt: '2026-07-10T10:10:00.000Z' },
    ]);
    expect(getMissionLifecycleStageEnteredAt(deployed, 'deployed')).toBe('2026-07-10T10:10:00.000Z');
    expect(deployed.timing?.deployedAt).toBe('2026-07-10T10:10:00.000Z');
    expect(deployed.timing?.operationalState).toBe('active');
  });

  it('snapshots explicit operational timing states for reload-safe recovery', () => {
    const context = updateMissionOperationalTiming(
      recordMissionLifecycleStageEntry(
        createEmptyMissionContext('mission-001', { createdAt: '2026-07-10T10:00:00.000Z' }),
        'authorization',
        { enteredAt: '2026-07-10T10:12:00.000Z' },
      ),
      {
        operationalState: 'blocked',
        blockedSince: '2026-07-10T10:12:00.000Z',
      },
      { updatedAt: '2026-07-10T10:12:00.000Z' },
    );

    expect(snapshotMissionContext(context).timing).toMatchObject({
      operationalState: 'blocked',
      blockedSince: '2026-07-10T10:12:00.000Z',
    });
  });
});
