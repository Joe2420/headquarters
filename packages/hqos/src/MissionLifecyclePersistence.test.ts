import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  ArchiveRepository,
  loadMigrationsFromDirectory,
  openHeadquartersDatabase,
  runMigrations,
} from '@headquarters/database';
import { InvalidMissionTransitionError, MissionKernel } from './MissionKernel';
import { MissionLifecyclePersistence } from './MissionLifecyclePersistence';

const tempDirs: string[] = [];
const migrationsDirectory = join(process.cwd(), 'packages/database/migrations');
const occurredAt = '2026-06-27T10:00:00.000Z';

function createTempDatabasePath(): string {
  const directory = mkdtempSync(join(tmpdir(), 'headquarters-mission-persistence-'));
  tempDirs.push(directory);
  return join(directory, 'headquarters.local.sqlite');
}

function createArchiveRepository(): { repository: ArchiveRepository; close: () => void } {
  const database = openHeadquartersDatabase(createTempDatabasePath());
  runMigrations(database, loadMigrationsFromDirectory(migrationsDirectory));

  return {
    repository: new ArchiveRepository(database),
    close: () => database.close(),
  };
}

describe('MissionLifecyclePersistence', () => {
  afterEach(() => {
    for (const directory of tempDirs.splice(0)) {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('persists valid mission state change events', () => {
    const kernel = new MissionKernel();
    const { repository, close } = createArchiveRepository();
    const lifecycle = new MissionLifecyclePersistence(kernel, repository);
    const mission = kernel.createMission('Persisted Transition');

    const result = lifecycle.transitionAndPersist(mission, 'briefing', {
      occurredAt,
      reason: 'briefing started',
    });

    expect(result.mission.state).toBe('briefing');
    expect(repository.findById(result.event.id)).toEqual(result.event);
    expect(repository.list()).toEqual([result.event]);

    close();
  });

  it('does not persist invalid mission transitions', () => {
    const kernel = new MissionKernel();
    const { repository, close } = createArchiveRepository();
    const lifecycle = new MissionLifecyclePersistence(kernel, repository);
    const mission = kernel.createMission('Invalid Transition');

    expect(() => lifecycle.transitionAndPersist(mission, 'deployed')).toThrow(InvalidMissionTransitionError);
    expect(repository.list()).toEqual([]);

    close();
  });
});
