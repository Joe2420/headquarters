import { useState } from 'react';

export type CommandChairStatus = 'unassigned' | 'awaiting-report' | 'occupied' | 'mission-active' | 'locked';

export interface CommandChairProps {
  readonly status?: CommandChairStatus;
  readonly operatorStatus?: string;
  readonly currentAuthority?: string;
  readonly currentRoom?: string;
  readonly primaryAction?: string;
  readonly onCommandAction?: (() => void) | undefined;
}

export function CommandChair({
  status,
  operatorStatus = 'Operator not seated',
  currentAuthority = 'Unassigned',
  currentRoom = 'Command',
  primaryAction = 'Assume Command',
  onCommandAction,
}: CommandChairProps = {}) {
  const [localStatus, setLocalStatus] = useState<CommandChairStatus>(status ?? 'unassigned');
  const currentStatus = status ?? localStatus;

  function handleCommandAction() {
    if (onCommandAction) {
      onCommandAction();
      return;
    }

    setLocalStatus(toggleCommandChairStatus(currentStatus));
  }

  return (
    <section className="command-chair" aria-label="Command Chair" data-command-chair-status={currentStatus}>
      <div>
        <p className="section-label">Command Chair</p>
        <h3>Operator Command Status</h3>
      </div>
      <p className="command-chair-status">{formatCommandChairStatus(currentStatus)}</p>
      <dl className="status-list">
        <div>
          <dt>Operator</dt>
          <dd>{operatorStatus}</dd>
        </div>
        <div>
          <dt>Authority</dt>
          <dd>{currentAuthority}</dd>
        </div>
        <div>
          <dt>Room</dt>
          <dd>{currentRoom}</dd>
        </div>
        <div>
          <dt>Primary Action</dt>
          <dd>{primaryAction}</dd>
        </div>
      </dl>
      <button className="secondary-action" type="button" onClick={handleCommandAction}>
        {currentStatus === 'unassigned' ? primaryAction : 'Release Command'}
      </button>
    </section>
  );
}

export function toggleCommandChairStatus(status: CommandChairStatus): CommandChairStatus {
  if (status === 'unassigned') return 'occupied';
  return 'unassigned';
}

export function formatCommandChairStatus(status: CommandChairStatus): string {
  if (status === 'awaiting-report') return 'Awaiting operator report';
  if (status === 'occupied') return 'Command chair occupied';
  if (status === 'mission-active') return 'Mission command active';
  if (status === 'locked') return 'Command chair locked';
  return 'Command unassigned';
}
