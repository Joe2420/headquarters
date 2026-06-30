import type { ObservationSessionRecord } from '@headquarters/database';

export type ArchiveSessionStatus = 'active' | 'completed';

export interface ArchiveSessionInspection {
  readonly id: string;
  readonly missionId: string;
  readonly startedAt: string;
  readonly status: ArchiveSessionStatus;
  readonly completedAt?: string;
  readonly durationMs?: number;
}

export function inspectArchiveSessions(
  sessions: readonly ObservationSessionRecord[],
): readonly ArchiveSessionInspection[] {
  return sessions.map((session) => ({
    id: session.id,
    missionId: session.missionId,
    startedAt: session.startedAt,
    status: session.completedAt === undefined ? 'active' : 'completed',
    ...(session.completedAt !== undefined ? { completedAt: session.completedAt } : {}),
    ...(session.durationMs !== undefined ? { durationMs: session.durationMs } : {}),
  }));
}
