import type { ReactNode } from 'react';
import type { CommanderWorkspaceSnapshot } from './CommanderWorkspaceModel';

export interface CommanderWorkspaceLayoutProps {
  readonly snapshot: CommanderWorkspaceSnapshot;
  readonly commander: ReactNode;
  readonly commandRail: ReactNode;
  readonly secondaryContext?: ReactNode;
  readonly interactionController?: ReactNode;
}

export function CommanderWorkspaceLayout({
  snapshot,
  commander,
  commandRail,
  secondaryContext,
  interactionController,
}: CommanderWorkspaceLayoutProps) {
  return (
    <section
      className="commander-workspace"
      data-workspace-mode={snapshot.mode}
      data-current-room={snapshot.currentRoom}
      data-recommended-room={snapshot.recommendedRoom}
      aria-label="Commander workspace"
    >
      <div className="commander-workspace__primary" aria-label="Commander briefing workspace">
        <CommanderMissionHeader snapshot={snapshot} />
        <div className="commander-workspace__conversation" aria-label="Commander conversation viewport">
          {commander}
        </div>
        {interactionController ? (
          <div className="commander-workspace__interaction" aria-label="Primary Commander interaction">
            {interactionController}
          </div>
        ) : null}
      </div>
      <div className="commander-workspace__rail" aria-label="Live mission command rail">
        {commandRail}
      </div>
      {secondaryContext ? (
        <aside className="commander-workspace__secondary" aria-label="Secondary Headquarters context">
          {secondaryContext}
        </aside>
      ) : null}
    </section>
  );
}

function CommanderMissionHeader({ snapshot }: { readonly snapshot: CommanderWorkspaceSnapshot }) {
  const blocker = snapshot.blockers[0];
  const guardianState = blocker?.source === 'guardian' ? blocker.label : 'Guardian secure';

  return (
    <header className="commander-mission-header" aria-label="Commander mission header">
      <div>
        <p className="section-label">{snapshot.mode === 'standby' ? 'Headquarters Standby' : 'Current Operation'}</p>
        <h2>{formatHeaderTitle(snapshot)}</h2>
      </div>
      <dl>
        <div>
          <dt>Room</dt>
          <dd>{formatHeaderToken(snapshot.currentRoom)}</dd>
        </div>
        <div>
          <dt>Lifecycle</dt>
          <dd>{formatHeaderToken(snapshot.activeStage)}</dd>
        </div>
        <div>
          <dt>Saved</dt>
          <dd>{snapshot.mode === 'standby' ? 'Ready' : 'Tracked'}</dd>
        </div>
        <div data-header-state={blocker ? 'blocked' : 'secure'}>
          <dt>Guardian</dt>
          <dd>{guardianState}</dd>
        </div>
      </dl>
    </header>
  );
}

function formatHeaderTitle(snapshot: CommanderWorkspaceSnapshot): string {
  if (snapshot.mode === 'standby') return 'No active mission';
  if (snapshot.mode === 'archived') return 'Mission archived';
  if (snapshot.mode === 'blocked') return 'Progress held';
  if (snapshot.mode === 'interrupted') return 'Interruption active';
  if (snapshot.mode === 'recovering') return 'Recovery active';
  return 'Mission active';
}

function formatHeaderToken(value: string): string {
  return value
    .replace(/[-_]/gu, ' ')
    .replace(/\b\w/gu, (character) => character.toUpperCase());
}
