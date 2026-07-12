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
        {commander}
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
