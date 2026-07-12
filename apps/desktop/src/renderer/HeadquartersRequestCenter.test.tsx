import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { createHeadquartersAttentionRequest } from '@headquarters/hqos';
import {
  HeadquartersAttentionIndicator,
  HeadquartersRequestCenter,
} from './HeadquartersRequestCenter';

describe('HeadquartersRequestCenter', () => {
  it('renders active, queued, resolved, and background requests', () => {
    const html = renderToStaticMarkup(<HeadquartersRequestCenter requests={[
      request('active', 'guardian', 'guardian_attention_required', 'pending', true, 'immediate'),
      request('queued', 'doctrine', 'doctrine_candidate_ready', 'queued', false, 'routine'),
      request('resolved', 'journal', 'journal_follow_up_required', 'resolved', false, 'routine'),
      request('background', 'academy', 'academy_milestone_ready', 'pending', false, 'background'),
    ]} />);

    expect(html).toContain('Requires Attention');
    expect(html).toContain('active request');
    expect(html).toContain('Queued');
    expect(html).toContain('queued request');
    expect(html).toContain('Recently Resolved');
    expect(html).toContain('resolved request');
    expect(html).toContain('Background Activity');
    expect(html).toContain('background request');
  });

  it('does not allow blocking requests to be silently dismissed', () => {
    const html = renderToStaticMarkup(<HeadquartersRequestCenter requests={[
      request('blocking', 'guardian', 'guardian_lockout_active', 'pending', true, 'critical'),
    ]} />);

    expect(html).toContain('Critical requests cannot be silently dismissed.');
    expect(html).not.toContain('>Dismiss<');
  });

  it('renders routine defer controls and evidence access', () => {
    const html = renderToStaticMarkup(<HeadquartersRequestCenter
      requests={[request('doctrine', 'doctrine', 'doctrine_candidate_ready', 'queued', false, 'routine')]}
    />);

    expect(html).toContain('Defer');
    expect(html).toContain('Open Evidence');
  });

  it('renders a calm empty state and sidebar attention indicator', () => {
    const html = renderToStaticMarkup(
      <>
        <HeadquartersRequestCenter requests={[]} />
        <HeadquartersAttentionIndicator requests={[]} />
      </>,
    );

    expect(html).toContain('No Headquarters request requires attention.');
    expect(html).toContain('Clear');
  });

  it('keeps Situation Board and Request Center aligned on the highest actionable request', () => {
    const html = renderToStaticMarkup(<HeadquartersRequestCenter requests={[
      request('routine', 'doctrine', 'doctrine_candidate_ready', 'queued', false, 'routine'),
      request('critical', 'guardian', 'guardian_lockout_active', 'pending', true, 'critical'),
    ]} />);

    expect(html).toContain('critical request: Evidence requires operator action');
  });
});

function request(
  id: string,
  sourceSubsystem: 'guardian' | 'doctrine' | 'journal' | 'academy',
  requestType:
    | 'guardian_attention_required'
    | 'guardian_lockout_active'
    | 'doctrine_candidate_ready'
    | 'journal_follow_up_required'
    | 'academy_milestone_ready',
  status: 'pending' | 'queued' | 'resolved',
  blocking: boolean,
  urgency: 'critical' | 'immediate' | 'routine' | 'background',
) {
  return createHeadquartersAttentionRequest({
    requestId: id,
    sourceSubsystem,
    requestType,
    title: `${id} request`,
    summary: 'Evidence-backed request.',
    reason: 'Evidence requires operator action.',
    urgency,
    severity: urgency === 'critical' ? 'critical' : blocking ? 'blocking' : urgency === 'background' ? 'background' : 'notice',
    status,
    recommendedRoom: sourceSubsystem === 'guardian' ? 'war-room' : 'mission-room',
    recommendedAction: sourceSubsystem === 'guardian' ? 'review_guardian_alert' : `review_${sourceSubsystem}`,
    blocking,
    interruptionPolicy: urgency === 'background' ? 'background_only' : blocking ? 'interrupt_at_safe_point' : 'queue_until_mission_complete',
    evidenceReferences: [{ id: `${id}-evidence`, source: sourceSubsystem }],
    sourceEntityId: id,
    createdAt: '2026-07-12T10:00:00.000Z',
  });
}
