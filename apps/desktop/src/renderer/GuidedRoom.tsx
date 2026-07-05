import type { ReactNode } from 'react';
import { RoomAtmosphere } from './RoomAtmosphere';
import { buildOperationalPsychologyProfile } from './OperationalPsychology';
import type { CommanderShellRoomId } from './CommanderShell';

export interface GuidedRoomProps {
  readonly id: string;
  readonly identity: string;
  readonly atmosphere: string;
  readonly title: string;
  readonly useCase: string;
  readonly objective: string;
  readonly primaryAction: ReactNode;
  readonly workspace: ReactNode;
  readonly timeline?: ReactNode;
  readonly secondaryTools?: ReactNode;
}

export function GuidedRoom({
  id,
  identity,
  atmosphere,
  title,
  useCase,
  objective,
  primaryAction,
  workspace,
  timeline,
  secondaryTools,
}: GuidedRoomProps) {
  const psychology = buildOperationalPsychologyProfile({ room: mapGuidedRoomIdToCommanderRoom(id) });

  return (
    <div
      className="guided-room room-layout"
      data-room-id={id}
      data-room-identity={identity}
      data-room-atmosphere={atmosphere}
    >
      <RoomAtmosphere variant={atmosphere} />
      <section className="guided-room-header" aria-label={`${title} objective`}>
        <p className="section-label">{title}</p>
        <h2>{useCase}</h2>
        <p className="muted">{objective}</p>
        <div className="guided-room-mindset" aria-label={`${title} operational mindset`}>
          <span>{psychology.mindset}</span>
          <p>{psychology.focusInstruction}</p>
        </div>
      </section>

      <section className="guided-room-primary-action" aria-label={`${title} primary action`}>
        <p className="section-label">Primary Action</p>
        {primaryAction}
      </section>

      <section className="guided-room-workspace" aria-label={`${title} workspace`}>
        {workspace}
      </section>

      {timeline ? (
        <details className="guided-room-timeline">
          <summary>Timeline / History</summary>
          {timeline}
        </details>
      ) : null}

      {secondaryTools ? (
        <details className="guided-room-secondary-tools">
          <summary>Secondary Tools</summary>
          {secondaryTools}
        </details>
      ) : null}
    </div>
  );
}

function mapGuidedRoomIdToCommanderRoom(id: string): CommanderShellRoomId {
  if (id === 'ready' || id === 'ready-room') return 'ready-room';
  if (id === 'war' || id === 'war-room') return 'war-room';
  if (id === 'observation' || id === 'observation-room') return 'observation';
  if (id === 'debrief' || id === 'debrief-theater') return 'debrief';
  if (id === 'archive' || id === 'archive-room') return 'archive';
  if (id === 'journal') return 'journal';
  if (id === 'doctrine') return 'doctrine';
  if (id === 'academy') return 'academy';
  if (id === 'guardian' || id === 'guardian-wing') return 'guardian';
  if (id === 'intelligence') return 'intelligence';
  if (id === 'settings') return 'settings';
  return 'command';
}
