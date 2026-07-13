import { describe, expect, it } from 'vitest';
import {
  commanderWorkspaceSections,
  getCommanderWorkspacePrimaryLocation,
  getCommanderWorkspaceSectionsForMode,
  hasDuplicateFullDetailLocations,
} from './CommanderWorkspaceInformationArchitecture';

const requiredSurfaces = [
  'mission-record',
  'commander-learning',
  'command-chair',
  'situation-board',
  'hq-broadcast',
  'notifications',
  'live-timeline',
  'services',
  'institutional-health',
  'operational-consequences',
  'final-evaluation',
  'guardian-doctrine',
  'intelligence',
  'diagnostics',
] as const;

describe('CommanderWorkspaceInformationArchitecture', () => {
  it('assigns every current major Commander surface to one primary location', () => {
    for (const surface of requiredSurfaces) {
      expect(getCommanderWorkspacePrimaryLocation(surface), surface).toBeDefined();
    }
  });

  it('does not define duplicate full-detail section locations', () => {
    expect(hasDuplicateFullDetailLocations()).toBe(false);
  });

  it('keeps only immediate operation permanently visible', () => {
    const alwaysVisible = commanderWorkspaceSections.filter((section) => section.visibilityPolicy === 'always');

    expect(alwaysVisible.every((section) => section.category === 'immediate_operation')).toBe(true);
  });

  it('collapses inactive mission-scoped detail in standby', () => {
    const standbySections = getCommanderWorkspaceSectionsForMode('standby');

    expect(standbySections.some((section) => section.sectionId === 'intelligence')).toBe(false);
    expect(standbySections.some((section) => section.sectionId === 'final-evaluation')).toBe(false);
  });

  it('keeps blocking content visible when Commander is holding', () => {
    const blockedSections = getCommanderWorkspaceSectionsForMode('blocked');

    expect(blockedSections.map((section) => section.sectionId)).toContain('active-blocker');
    expect(blockedSections.map((section) => section.sectionId)).toContain('operational-consequences');
  });

  it('classifies diagnostics as hidden by default', () => {
    const diagnostics = commanderWorkspaceSections.filter((section) => section.category === 'diagnostics');

    expect(diagnostics.length).toBeGreaterThan(0);
    expect(diagnostics.every((section) => section.visibilityPolicy === 'diagnostics_only')).toBe(true);
    expect(getCommanderWorkspaceSectionsForMode('active').some((section) => section.category === 'diagnostics')).toBe(false);
  });
});
