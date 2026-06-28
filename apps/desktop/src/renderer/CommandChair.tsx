import { useState } from 'react';

export type CommandChairStatus = 'unassigned' | 'professional-command';

export function CommandChair() {
  const [status, setStatus] = useState<CommandChairStatus>('unassigned');

  return (
    <section className="command-chair" aria-label="Command Chair">
      <div>
        <p className="section-label">Command Chair</p>
        <h3>Operator Command Status</h3>
      </div>
      <p className="command-chair-status">{formatCommandChairStatus(status)}</p>
      <button className="secondary-action" type="button" onClick={() => setStatus(toggleCommandChairStatus(status))}>
        {status === 'unassigned' ? 'Assume Command' : 'Release Command'}
      </button>
    </section>
  );
}

export function toggleCommandChairStatus(status: CommandChairStatus): CommandChairStatus {
  if (status === 'unassigned') return 'professional-command';
  return 'unassigned';
}

export function formatCommandChairStatus(status: CommandChairStatus): string {
  if (status === 'professional-command') return 'Professional Joe in command';
  return 'Command unassigned';
}
