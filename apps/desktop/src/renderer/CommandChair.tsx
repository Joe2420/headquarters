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
  const [seatConfirmed, setSeatConfirmed] = useState(false);
  const currentStatus = status ?? localStatus;
  const canConfirmSeat = currentStatus !== 'unassigned' && currentStatus !== 'awaiting-report' && currentStatus !== 'locked';

  function handleCommandAction() {
    if (onCommandAction) {
      onCommandAction();
      return;
    }

    setLocalStatus(toggleCommandChairStatus(currentStatus));
  }

  function handleConfirmSeat() {
    setSeatConfirmed(true);
  }

  return (
    <section className="command-chair" aria-label="Command Chair" data-command-chair-status={currentStatus}>
      <div>
        <p className="section-label">Command Chair</p>
        <h3>Operator Command Status</h3>
      </div>
      <p className="command-chair-status">{seatConfirmed ? 'Operator seat confirmed' : formatCommandChairStatus(currentStatus)}</p>
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
        <div>
          <dt>Seat</dt>
          <dd>{seatConfirmed ? 'Confirmed by operator' : canConfirmSeat ? 'Awaiting operator confirmation' : 'Unavailable'}</dd>
        </div>
      </dl>
      <div className="command-chair-actions">
        {canConfirmSeat && !seatConfirmed ? (
          <button className="primary-action" type="button" onClick={handleConfirmSeat}>
            Confirm Seat
          </button>
        ) : null}
        <button className="secondary-action" type="button" onClick={handleCommandAction}>
          {currentStatus === 'unassigned' ? primaryAction : 'Open Command Room'}
        </button>
      </div>
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
