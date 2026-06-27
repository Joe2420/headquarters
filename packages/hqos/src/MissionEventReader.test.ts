import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type { HQEvent } from '@headquarters/shared';
import {
  ArchiveRepository,
  loadMigrationsFromDirectory,
  openHeadquartersDatabase,
  runMigrations,
} from '@headquarters/database';
import { MissionKernel } from './MissionKernel';
import { MissionLifecyclePersistence } from './MissionLifecyclePersistence';
import { MissionEventReader } from './MissionEventReader';

const tempDirs: string[] = [];
const migrationsDirectory = join(process.cwd(), 'packages/database/migrations');
const occurredAt = '2026-06-27T11:00:00.000Z';

function createTempDatabasePath(): string {
  const directory = mkdtempSync(join(tmpdir(), 'headquarters-mission-reader-'));
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

function createNonMissionStateChangedEvent(): HQEvent<{ bootMode: 'normal' }> {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    type: 'system.boot.completed',
    version: 1,
    occurredAt,
    source: 'HQOSKernel',
    priority: 'white',
    payload: {
      bootMode: 'normal',
    },
  };
}

describe('MissionEventReader', () => {
  afterEach(() => {
    for (const directory of tempDirs.splice(0)) {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('reads all persisted mission state-change events in append order', () => {
    const kernel = new MissionKernel();
    const { repository, close } = createArchiveRepository();
    const lifecycle = new MissionLifecyclePersistence(kernel, repository);
    const reader = new MissionEventReader(repository);
    let mission = kernel.createMission('Reader Mission');

    repository.append(createNonMissionStateChangedEvent());
    const briefing = lifecycle.transitionAndPersist(mission, 'briefing', { occurredAt });
    mission = briefing.mission;
    const ready = lifecycle.transitionAndPersist(mission, 'ready', { occurredAt });

    expect(reader.listStateChanges()).toEqual([briefing.event, ready.event]);

    close();
  });

  it('filters persisted mission state-change events by mission id', () => {
    const kernel = new MissionKernel();
    const { repository, close } = createArchiveRepository();
    const lifecycle = new MissionLifecyclePersistence(kernel, repository);
    const reader = new MissionEventReader(repository);
    const firstMission = kernel.createMission('First Mission');
    const secondMission = kernel.createMission('Second Mission');

    const firstEvent = lifecycle.transitionAndPersist(firstMission, 'briefing', { occurredAt });
    const secondEvent = lifecycle.transitionAndPersist(secondMission, 'briefing', { occurredAt });

    expect(reader.listStateChangesForMission(firstMission.id)).toEqual([firstEvent.event]);
    expect(reader.listStateChangesForMission(secondMission.id)).toEqual([secondEvent.event]);

    close();
  });

  it('ignores non-mission and non-state-change events', () => {
    const { repository, close } = createArchiveRepository();
    const reader = new MissionEventReader(repository);

    repository.append(createNonMissionStateChangedEvent());

    expect(reader.listStateChanges()).toEqual([]);

    close();
  });

  it('ignores malformed mission state-change payloads', () => {
    const { repository, close } = createArchiveRepository();
    const reader = new MissionEventReader(repository);

    repository.append({
      id: '22222222-2222-4222-8222-222222222222',
      type: 'mission.state.changed',
      version: 1,
      occurredAt,
      source: 'MissionKernel',
      priority: 'white',
      payload: {
        missionId: '33333333-3333-4333-8333-333333333333',
        from: 'idle',
      },
    });

    expect(reader.listStateChanges()).toEqual([]);

    close();
  });
});
