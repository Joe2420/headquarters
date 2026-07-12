import type { ReactNode } from 'react';

export type CommanderMessagePurpose =
  | 'briefing'
  | 'guidance'
  | 'warning'
  | 'acknowledgement'
  | 'transition'
  | 'debrief'
  | 'recognition'
  | 'interruption';

export interface CommanderPurposeMessageProps {
  readonly purpose: CommanderMessagePurpose;
  readonly title?: string | undefined;
  readonly children: ReactNode;
}

export function CommanderPurposeMessage({ purpose, title, children }: CommanderPurposeMessageProps) {
  return (
    <article className="commander-purpose-message" data-message-purpose={purpose} aria-label={getPurposeLabel(purpose)}>
      {title ? <h3>{title}</h3> : null}
      <div>{children}</div>
    </article>
  );
}

export function getCommanderMessagePurposeClass(purpose: CommanderMessagePurpose): string {
  return `commander-purpose-message--${purpose}`;
}

function getPurposeLabel(purpose: CommanderMessagePurpose): string {
  if (purpose === 'briefing') return 'Commander briefing';
  if (purpose === 'guidance') return 'Commander guidance';
  if (purpose === 'warning') return 'Commander warning';
  if (purpose === 'acknowledgement') return 'Commander acknowledgement';
  if (purpose === 'transition') return 'Commander transition';
  if (purpose === 'debrief') return 'Commander debrief';
  if (purpose === 'recognition') return 'Commander recognition';
  return 'Commander interruption';
}
