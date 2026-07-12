import type { CommanderWorkspaceSnapshot } from './CommanderWorkspaceModel';

export interface LiveMissionCommandRailProps {
  readonly snapshot: CommanderWorkspaceSnapshot;
}

export function LiveMissionCommandRail({ snapshot }: LiveMissionCommandRailProps) {
  return (
    <section
      className="live-mission-command-rail"
      data-workspace-mode={snapshot.mode}
      data-priority-severity={snapshot.priority.severity}
      aria-label="Live mission command rail"
    >
      <header className="live-mission-command-rail__header">
        <p className="section-label">Command Rail</p>
        <h2>{formatWorkspaceMode(snapshot.mode)}</h2>
        <p>{snapshot.primaryAction.reason}</p>
      </header>

      <dl className="live-mission-command-rail__metrics">
        <div>
          <dt>Stage</dt>
          <dd>{formatStage(snapshot.activeStage)}</dd>
        </div>
        <div>
          <dt>Room</dt>
          <dd>{formatRoom(snapshot.recommendedRoom)}</dd>
        </div>
        <div>
          <dt>Evidence</dt>
          <dd>{snapshot.evidenceCount}</dd>
        </div>
      </dl>

      <section className="live-mission-command-rail__action" aria-label="Primary action">
        <span>Primary Action</span>
        <strong>{snapshot.primaryAction.label}</strong>
        <small>{formatRoom(snapshot.primaryAction.room)}</small>
      </section>

      {snapshot.blockers.length > 0 ? (
        <section className="live-mission-command-rail__blockers" aria-label="Active blockers">
          <h3>Blockers</h3>
          <ul>
            {snapshot.blockers.map((blocker) => (
              <li key={blocker.id}>
                <strong>{blocker.label}</strong>
                <span>{blocker.source}</span>
                <p>{blocker.reason}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="live-mission-command-rail__status" aria-label="Headquarters status">
        <h3>Priority</h3>
        <strong>{snapshot.priority.title}</strong>
        <p>{snapshot.priority.explanation}</p>
        <h3>Institutional Health</h3>
        <strong>{snapshot.health.state}</strong>
        <p>{snapshot.health.summary}</p>
        {snapshot.health.highestConcern ? <small>{snapshot.health.highestConcern}</small> : null}
      </section>
    </section>
  );
}

function formatWorkspaceMode(mode: CommanderWorkspaceSnapshot['mode']): string {
  if (mode === 'standby') return 'Headquarters Standby';
  if (mode === 'blocked') return 'Commander Holding';
  if (mode === 'interrupted') return 'Interruption Active';
  if (mode === 'recovering') return 'Recovery Active';
  if (mode === 'archived') return 'Mission Archived';
  return 'Mission Active';
}

function formatStage(stage: CommanderWorkspaceSnapshot['activeStage']): string {
  return stage.replace(/([A-Z])/g, ' $1').replace(/^./, (value) => value.toUpperCase());
}

function formatRoom(room: CommanderWorkspaceSnapshot['recommendedRoom']): string {
  return room.split('-').map((part) => part[0]!.toUpperCase() + part.slice(1)).join(' ');
}
