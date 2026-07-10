import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  CommandChairOperatingConsole,
  HeadquartersBroadcastFeed,
  HeadquartersServiceActivityPanel,
  LiveOperationalTimeline,
  OperationalNotifications,
  buildHeadquartersOperatingEnvironment,
  type HeadquartersOperatingEnvironmentInput,
} from './HeadquartersOperatingEnvironment';

const input: HeadquartersOperatingEnvironmentInput = {
  currentRoom: 'observation',
  missionPhase: 'Observation active',
  currentObjective: 'Report visible evidence.',
  commanderStatus: 'Monitoring operation',
  guardianStatus: '1 Guardian alert',
  archiveRecordCount: 2,
  doctrineCandidateCount: 1,
  growthEventCount: 3,
  events: [
    {
      id: 'event:guardian',
      type: 'guardian_observation',
      priority: 'high',
      room: 'guardian',
      title: 'Guardian completed analysis',
      message: 'Risk boundary requires attention.',
      createdAt: '2026-07-05T10:00:00.000Z',
      source: 'guardian',
    },
    {
      id: 'event:archive',
      type: 'archive_synchronization',
      priority: 'low',
      room: 'archive',
      title: 'Archive synchronized',
      message: 'Two records indexed.',
      createdAt: '2026-07-05T10:00:01.000Z',
      source: 'archive',
    },
  ],
};

describe('HeadquartersOperatingEnvironment', () => {
  it('builds deterministic operating environment surfaces from Headquarters events', () => {
    const environment = buildHeadquartersOperatingEnvironment(input);

    expect(environment.broadcast.map((item) => item.message)).toEqual([
      'Guardian completed analysis. Risk boundary requires attention.',
      'Archive synchronized. Two records indexed.',
    ]);
    expect(environment.commandChair).toMatchObject({
      currentMission: 'Observation active',
      currentRoom: 'observation',
      commanderStatus: 'Monitoring operation',
      guardianStatus: '1 Guardian alert',
      currentObjective: 'Report visible evidence.',
    });
    expect(environment.timeline.map((entry) => entry.label)).toEqual([
      'Guardian completed analysis',
      'Archive synchronized',
    ]);
    expect(environment.notifications).toEqual([
      {
        id: 'notification:event:guardian',
        message: 'Risk boundary requires attention.',
        priority: 'high',
      },
    ]);
  });

  it('renders compact OS surfaces without needing backend side effects', () => {
    const environment = buildHeadquartersOperatingEnvironment(input);
    const html = renderToStaticMarkup(
      <>
        <CommandChairOperatingConsole state={environment.commandChair} />
        <HeadquartersBroadcastFeed items={environment.broadcast} />
        <OperationalNotifications notifications={environment.notifications} />
        <HeadquartersServiceActivityPanel services={environment.services} />
        <LiveOperationalTimeline entries={environment.timeline} />
      </>,
    );

    expect(html).toContain('aria-label="Command Chair operating console"');
    expect(html).toContain('aria-label="HQ broadcast feed"');
    expect(html).toContain('aria-label="Operational notifications"');
    expect(html).toContain('aria-label="Headquarters services"');
    expect(html).toContain('aria-label="Live operational timeline"');
    expect(html).toContain('Guardian completed analysis');
    expect(html).toContain('Doctrine');
  });
});
