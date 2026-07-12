import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { createMissionReplay, createReplayEvent } from '@headquarters/hqos';
import { getReplayProgress, groupEventsBySection, MissionReplayTimeline } from './MissionReplayTimeline';

const replay = createMissionReplay({
  replayId: 'replay-1',
  missionId: 'mission-1',
  missionName: 'London Open',
  createdAt: '2026-07-13T08:00:00.000Z',
  events: [
    createReplayEvent({
      id: 'event-2',
      type: 'operator_answer',
      section: 'ready-room',
      occurredAt: '2026-07-13T08:02:00.000Z',
      title: 'Briefing answer',
      summary: 'Operator transmitted the objective.',
      actor: 'operator',
      evidence: [{ id: 'briefing-1', source: 'mission', description: 'Briefing answer' }],
    }),
    createReplayEvent({
      id: 'event-1',
      type: 'room_entered',
      section: 'mission-opening',
      occurredAt: '2026-07-13T08:01:00.000Z',
      title: 'Mission opened',
      summary: 'Commander opened replay.',
      actor: 'commander',
      evidence: [{ id: 'mission-1', source: 'mission', description: 'Mission opened' }],
    }),
  ],
  bookmarks: [{ id: 'bookmark-1', eventId: 'event-2', label: 'Briefing answer', reason: 'Decision point' }],
});

describe('MissionReplayTimeline', () => {
  it('renders ordered timeline sections and bookmarks', () => {
    const html = renderToStaticMarkup(<MissionReplayTimeline replay={replay} currentEventId="event-2" />);

    expect(html.indexOf('Mission opened')).toBeLessThan(html.indexOf('Briefing answer'));
    expect(html).toContain('Replay bookmarks');
    expect(html).toContain('data-current="true"');
  });

  it('groups events by section in chronological order', () => {
    const grouped = groupEventsBySection(replay.timeline.events);

    expect(grouped.get('mission-opening')?.[0]?.id).toBe('event-1');
    expect(grouped.get('ready-room')?.[0]?.id).toBe('event-2');
  });

  it('calculates replay progress from the current event', () => {
    expect(getReplayProgress(replay.timeline.events, 'event-2')).toBe(100);
    expect(getReplayProgress(replay.timeline.events, 'missing')).toBe(0);
  });
});
