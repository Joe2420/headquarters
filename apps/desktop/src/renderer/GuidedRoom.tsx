import type { ReactNode } from 'react';

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
  return (
    <div
      className="guided-room room-layout"
      data-room-id={id}
      data-room-identity={identity}
      data-room-atmosphere={atmosphere}
    >
      <section className="guided-room-header" aria-label={`${title} objective`}>
        <p className="section-label">{title}</p>
        <h2>{useCase}</h2>
        <p className="muted">{objective}</p>
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
