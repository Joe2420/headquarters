import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  AmbientStatusStrip,
  MissionCeremonyMoment,
  OperationalCommandChair,
  SituationBoard,
  buildCommandChairStatus,
  buildMissionCeremony,
  formatRoomLabel,
  getRoomAtmosphereToken,
} from './HeadquartersAtmosphere';

describe('HeadquartersAtmosphere', () => {
  it('derives operational Command Chair states from existing report and mission state', () => {
    expect(buildCommandChairStatus('not-reported')).toBe('awaiting-report');
    expect(buildCommandChairStatus('reported')).toBe('occupied');
    expect(buildCommandChairStatus('reported', {
      campaign: 'Foundation',
      objective: 'Hold discipline',
      currentState: 'observation',
      commandAuthority: 'Professional command',
    })).toBe('mission-active');
  });

  it('renders Command Chair as an operational presence with current room and action', () => {
    const html = renderToStaticMarkup(<OperationalCommandChair
      reportState="reported"
      currentRoom="war-room"
      mission={{
        campaign: 'Foundation',
        objective: 'Hold discipline',
        currentState: 'authorization',
        commandAuthority: 'Professional command',
      }}
      primaryAction="Proceed to War Room"
    />);

    expect(html).toContain('data-command-chair-status="mission-active"');
    expect(html).toContain('War Room');
    expect(html).toContain('Proceed to War Room');
  });

  it('maps rooms to restrained atmosphere tokens and labels', () => {
    expect(getRoomAtmosphereToken('command')).toBe('command');
    expect(getRoomAtmosphereToken('ready')).toBe('ready');
    expect(getRoomAtmosphereToken('observation')).toBe('observation');
    expect(getRoomAtmosphereToken('war')).toBe('war');
    expect(getRoomAtmosphereToken('debrief')).toBe('debrief');
    expect(getRoomAtmosphereToken('archive')).toBe('archive');
    expect(getRoomAtmosphereToken('journal')).toBe('journal');
    expect(getRoomAtmosphereToken('doctrine')).toBe('doctrine');
    expect(getRoomAtmosphereToken('academy')).toBe('academy');
    expect(getRoomAtmosphereToken('guardian')).toBe('guardian');
    expect(getRoomAtmosphereToken('intelligence')).toBe('intelligence');
    expect(formatRoomLabel('ready-room')).toBe('Ready Room');
  });

  it('renders a calm Situation Board from deterministic local state', () => {
    const html = renderToStaticMarkup(<SituationBoard input={{
      hqosStatus: 'Operational',
      currentMissionPhase: 'Current lifecycle state: Observation',
      recommendedRoom: 'war-room',
      guardianStatus: 'Guardian standing by',
      recentDoctrine: 'Wait for confirmation',
      recentGrowth: 'Held discipline',
      intelligenceIndicator: '2 intelligence records',
    }} />);

    expect(html).toContain('Situation Board');
    expect(html).toContain('War Room');
    expect(html).toContain('Wait for confirmation');
    expect(html).toContain('Held discipline');
  });

  it('renders an ambient Headquarters status strip', () => {
    const html = renderToStaticMarkup(<AmbientStatusStrip input={{
      hqos: 'Operational',
      archive: '1 archived mission',
      mission: 'Observation',
      guardian: 'Guardian standing by',
      currentRoom: 'Observation Room',
    }} />);

    expect(html).toContain('aria-label="Ambient Headquarters status"');
    expect(html).toContain('HQOS: Operational');
    expect(html).toContain('Room: Observation Room');
  });

  it('builds lightweight ceremony moments for mission phases', () => {
    expect(buildMissionCeremony(undefined)?.label).toBe('Report Accepted');
    expect(buildMissionCeremony('briefing')?.label).toBe('Mission Created');
    expect(buildMissionCeremony('ready')?.label).toBe('Briefing Complete');
    expect(buildMissionCeremony('observation')?.label).toBe('Observation Begins');
    expect(buildMissionCeremony('authorization')?.label).toBe('Authorization Requested');
    expect(buildMissionCeremony('deployed')?.label).toBe('Authorization Granted');
    expect(buildMissionCeremony('return_to_base')?.label).toBe('Return To Base');
    expect(buildMissionCeremony('debrief')?.label).toBe('Debrief Complete');
    expect(buildMissionCeremony('archived')?.label).toBe('Mission Archived');
    expect(buildMissionCeremony('ready')?.message).toBe('Operational briefing complete.');

    const html = renderToStaticMarkup(<MissionCeremonyMoment ceremony={buildMissionCeremony('authorization')} />);
    expect(html).toContain('data-ceremony-id="ceremony:authorization-requested"');
    expect(html).toContain('data-ceremony-room="war-room"');
    expect(html).toContain('Doctrine, invalidation, and Guardian restrictions decide from here.');
  });
});
