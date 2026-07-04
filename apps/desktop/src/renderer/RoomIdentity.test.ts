import { describe, expect, it } from 'vitest';
import { getRoomEnvironmentalSummary, getRoomIdentityProfile, listRoomIdentityProfiles } from './RoomIdentity';

describe('RoomIdentity', () => {
  it('defines a distinct purpose and mindset for every Headquarters room', () => {
    const profiles = listRoomIdentityProfiles();

    expect(profiles).toHaveLength(12);
    expect(profiles.map((profile) => profile.room)).toEqual([
      'command',
      'ready-room',
      'observation',
      'war-room',
      'debrief',
      'archive',
      'journal',
      'doctrine',
      'academy',
      'guardian',
      'intelligence',
      'settings',
    ]);
    expect(new Set(profiles.map((profile) => profile.identity)).size).toBeGreaterThan(8);
    expect(profiles.every((profile) => profile.purpose.length > 0)).toBe(true);
    expect(profiles.every((profile) => profile.arrivalCue.length > 0)).toBe(true);
    expect(profiles.every((profile) => profile.exitCue.length > 0)).toBe(true);
    expect(profiles.every((profile) => profile.environmentalCues.length > 0)).toBe(true);
  });

  it('keeps mission rooms psychologically distinct', () => {
    expect(getRoomIdentityProfile('ready-room')).toMatchObject({
      mindset: 'preparation',
      commanderPacing: 'patient',
      primaryFocus: 'mission profile and readiness',
    });
    expect(getRoomIdentityProfile('observation')).toMatchObject({
      mindset: 'evidence',
      commanderPacing: 'slow',
      primaryFocus: 'visible evidence only',
    });
    expect(getRoomIdentityProfile('war-room')).toMatchObject({
      mindset: 'decision',
      commanderPacing: 'direct',
      primaryFocus: 'authorization and invalidation',
    });
    expect(getRoomIdentityProfile('archive')).toMatchObject({
      mindset: 'permanence',
      commanderPacing: 'formal',
      primaryFocus: 'mission dossier and lessons',
    });
  });

  it('summarizes environmental storytelling without replacing room content', () => {
    expect(getRoomEnvironmentalSummary('debrief')).toContain('After-action review');
    expect(getRoomEnvironmentalSummary('debrief')).toContain('behavior, discipline, lesson');
  });
});
