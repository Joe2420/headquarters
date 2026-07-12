import { describe, expect, it } from 'vitest';
import type { CommanderRelationship } from '@headquarters/hqos';
import {
  createHeadquartersAttentionRequest,
  projectMissionLifecycle,
  type LivingHeadquartersDecision,
} from '@headquarters/hqos';
import type { Mission } from '@headquarters/shared';
import {
  buildCommanderSessionOpeningBrief,
  renderCommanderSessionOpeningBrief,
} from './CommanderSessionOpening';

const mission: Mission = {
  id: 'mission-1',
  codename: 'London open',
  state: 'debrief',
  createdAt: '2026-07-12T09:00:00.000Z',
  updatedAt: '2026-07-12T09:00:00.000Z',
};

const lifecycle = projectMissionLifecycle(mission);
const noOpDecision: LivingHeadquartersDecision = {
  requestsQueued: [],
  interruptionAllowed: false,
  interruptionReason: 'No actionable request.',
  CommanderIntent: 'standby',
  recommendedRoom: 'debrief-theater',
  recommendedAction: 'Enter Debrief Theater',
  preservedContext: {
    previousRoom: 'debrief-theater',
    previousSelectedView: 'commander-chat',
    activeMissionId: 'mission-1',
    lifecycleStage: 'debrief',
  },
};

describe('CommanderSessionOpening', () => {
  it('lets Guardian lockout outrank mission creation or optional work', () => {
    const brief = buildCommanderSessionOpeningBrief({
      lifecycle,
      decision: noOpDecision,
      requests: [
        request('doctrine', 'doctrine_candidate_ready', 'routine', false),
        request('guardian', 'guardian_lockout_active', 'critical', true),
      ],
    });

    expect(brief.highestPriority).toContain('guardian request');
    expect(brief.recommendedAction).toBe('guardian_action');
  });

  it('lets incomplete debrief outrank Doctrine review', () => {
    const brief = buildCommanderSessionOpeningBrief({
      lifecycle,
      decision: noOpDecision,
      requests: [
        request('doctrine', 'doctrine_candidate_ready', 'routine', false),
        request('journal', 'journal_follow_up_required', 'immediate', true),
      ],
    });

    expect(brief.highestPriority).toContain('journal request');
    expect(brief.secondaryAttention).toHaveLength(1);
  });

  it('renders one primary action and at most two secondary items', () => {
    const brief = buildCommanderSessionOpeningBrief({
      lifecycle,
      decision: noOpDecision,
      requests: [
        request('guardian', 'guardian_attention_required', 'immediate', true),
        request('doctrine', 'doctrine_candidate_ready', 'routine', false),
        request('academy', 'academy_milestone_ready', 'background', false),
        request('archive', 'archive_review_available', 'routine', false),
      ],
    });
    const text = renderCommanderSessionOpeningBrief(brief);

    expect(brief.secondaryAttention).toHaveLength(2);
    expect(text).toContain('Highest priority:');
    expect(text).toContain('Recommended action:');
  });

  it('does not replay already briefed requests', () => {
    const brief = buildCommanderSessionOpeningBrief({
      lifecycle,
      decision: noOpDecision,
      alreadyBriefedRequestIds: ['guardian'],
      requests: [
        request('guardian', 'guardian_attention_required', 'immediate', true),
        request('doctrine', 'doctrine_candidate_ready', 'routine', false),
      ],
    });

    expect(brief.highestPriority).toContain('doctrine request');
  });

  it('adds one evidence-backed relationship statement when available', () => {
    const relationship = {
      profile: {
        strengths: ['observation discipline'],
        needsAttention: [],
      },
    } as unknown as CommanderRelationship;

    const brief = buildCommanderSessionOpeningBrief({
      lifecycle,
      decision: noOpDecision,
      relationship,
      requests: [],
    });

    expect(brief.relationshipStatement).toContain('observation discipline');
  });
});

function request(
  id: string,
  requestType:
    | 'guardian_attention_required'
    | 'guardian_lockout_active'
    | 'doctrine_candidate_ready'
    | 'journal_follow_up_required'
    | 'academy_milestone_ready'
    | 'archive_review_available',
  urgency: 'critical' | 'immediate' | 'routine' | 'background',
  blocking: boolean,
) {
  const sourceSubsystem = id === 'journal' ? 'journal'
    : id === 'guardian' ? 'guardian'
      : id === 'academy' ? 'academy'
        : id === 'archive' ? 'archive'
          : 'doctrine';

  return createHeadquartersAttentionRequest({
    requestId: id,
    sourceSubsystem,
    requestType,
    title: `${id} request`,
    summary: `${id} summary.`,
    reason: `${id} reason.`,
    urgency,
    severity: urgency === 'critical' ? 'critical' : blocking ? 'blocking' : urgency === 'background' ? 'background' : 'notice',
    recommendedRoom: sourceSubsystem === 'guardian' ? 'war-room' : 'mission-room',
    recommendedAction: `${id}_action`,
    blocking,
    interruptionPolicy: urgency === 'background' ? 'background_only' : blocking ? 'interrupt_at_safe_point' : 'mention_in_next_brief',
    evidenceReferences: [{ id: `${id}-evidence`, source: sourceSubsystem }],
    sourceEntityId: id,
    createdAt: `2026-07-12T10:0${id.length % 5}:00.000Z`,
  });
}
