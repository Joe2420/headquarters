import { type FormEvent, useEffect, useState } from 'react';
import { MissionBoard } from '@headquarters/ui';
import { CommandChair } from './CommandChair';

type StartupState = 'loading' | 'ready' | 'failed';
export type DesktopShellPhase = 'security-checkpoint' | 'command-center';
export interface ActiveMission {
  id: string;
  campaign: string;
  objective: string;
  condition: string;
  commandAuthority: string;
  currentState: string;
  createdAt: string;
}

export interface MissionDraft {
  codename: string;
  objective: string;
}

interface StartupStatus {
  state: StartupState;
  database: {
    connected: boolean;
    path?: string;
  };
  migrations: {
    applied: string[];
    skipped: string[];
  };
  error?: string;
}

declare global {
  interface Window {
    headquarters?: {
      version?: string;
      getStartupStatus?: () => Promise<StartupStatus>;
    };
  }
}

export function App() {
  const version = globalThis.window?.headquarters?.version ?? '0.1.0';
  const [shellPhase, setShellPhase] = useState<DesktopShellPhase>('security-checkpoint');
  const [activeMission, setActiveMission] = useState<ActiveMission | undefined>();
  const [startupStatus, setStartupStatus] = useState<StartupStatus>({
    state: 'loading',
    database: {
      connected: false,
    },
    migrations: {
      applied: [],
      skipped: [],
    },
  });

  useEffect(() => {
    let active = true;

    globalThis.window?.headquarters?.getStartupStatus?.()
      .then((status) => {
        if (active && status) setStartupStatus(status);
      })
      .catch((error: unknown) => {
        if (!active) return;

        setStartupStatus({
          state: 'failed',
          database: {
            connected: false,
          },
          migrations: {
            applied: [],
            skipped: [],
          },
          error: error instanceof Error ? error.message : 'Unable to read startup status',
        });
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="hq-shell">
      <header className="shell-header">
        <div>
          <p className="classification">HEADQUARTERS // DESKTOP SHELL</p>
          <h1>Headquarters</h1>
        </div>
        <dl className="app-meta" aria-label="Application status">
          <div>
            <dt>Version</dt>
            <dd>{version}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{formatStartupState(startupStatus.state)}</dd>
          </div>
        </dl>
      </header>

      <div className="shell-body">
        <nav className="shell-nav" aria-label="Primary">
          <span className="nav-item active">Command</span>
          <span className="nav-item">Missions</span>
          <span className="nav-item">Archive</span>
          <span className="nav-item">Settings</span>
        </nav>

        <main className="shell-main">
          <section className="workspace-panel" aria-label="Main content">
            {shellPhase === 'security-checkpoint' ? (
              <SecurityCheckpoint onReportForDuty={() => setShellPhase(reportForDuty(shellPhase))} />
            ) : (
              <CommandCenter activeMission={activeMission} onCreateMission={setActiveMission} />
            )}
          </section>

          <aside className="status-panel" aria-label="Status area">
            <p className="section-label">Status</p>
            <dl className="status-list">
              <div>
                <dt>HQOS</dt>
                <dd>{startupStatus.state === 'failed' ? 'Limited' : 'Ready'}</dd>
              </div>
              <div>
                <dt>Database</dt>
                <dd>{startupStatus.database.connected ? 'Connected' : 'Offline'}</dd>
              </div>
              <div>
                <dt>Migrations</dt>
                <dd>{formatMigrationStatus(startupStatus)}</dd>
              </div>
            </dl>
            {startupStatus.error ? <p className="status-error">{startupStatus.error}</p> : null}
          </aside>
        </main>
      </div>
    </div>
  );
}

interface SecurityCheckpointProps {
  onReportForDuty: () => void;
}

function SecurityCheckpoint({ onReportForDuty }: SecurityCheckpointProps) {
  return (
    <div className="checkpoint-surface">
      <p className="section-label">Security Checkpoint</p>
      <h2>Report for Duty</h2>
      <p className="muted">Headquarters is standing by for command assumption.</p>
      <button className="primary-action" type="button" onClick={onReportForDuty}>
        REPORT FOR DUTY
      </button>
    </div>
  );
}

export function CommandCenterPlaceholder() {
  return <CommandCenter />;
}

interface CommandCenterProps {
  activeMission?: ActiveMission | undefined;
  onCreateMission?: ((mission: ActiveMission) => void) | undefined;
}

export function CommandCenter({ activeMission, onCreateMission }: CommandCenterProps) {
  return (
    <div className="command-placeholder">
      <p className="section-label">Main Content</p>
      <h2>Command Center</h2>
      <p className="muted">Command shell placeholder online.</p>
      <CreateMissionPanel onCreateMission={onCreateMission} />
      <div className="mission-board-shell" data-object-id="RM-0007">
        <MissionBoard
          campaign={activeMission?.campaign ?? 'No active campaign'}
          objective={activeMission?.objective ?? 'Awaiting mission creation'}
          condition={activeMission?.condition ?? 'Standby'}
          commandAuthority={activeMission?.commandAuthority ?? 'Local placeholder'}
          currentState={activeMission?.currentState ?? 'No mission loaded'}
        />
      </div>
      <CommandChair />
    </div>
  );
}

interface CreateMissionPanelProps {
  onCreateMission?: ((mission: ActiveMission) => void) | undefined;
}

function CreateMissionPanel({ onCreateMission }: CreateMissionPanelProps) {
  const [codename, setCodename] = useState('');
  const [objective, setObjective] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const mission = createLocalMission({ codename, objective });

    if (!mission) return;

    onCreateMission?.(mission);
    setCodename('');
    setObjective('');
  }

  return (
    <form className="create-mission-panel" aria-label="Create mission" onSubmit={handleSubmit}>
      <div>
        <p className="section-label">Mission Creation</p>
        <h3>Create Mission</h3>
      </div>
      <label>
        <span>Mission Codename</span>
        <input value={codename} onChange={(event) => setCodename(event.target.value)} />
      </label>
      <label>
        <span>Mission Objective</span>
        <input value={objective} onChange={(event) => setObjective(event.target.value)} />
      </label>
      <button className="secondary-action" type="submit">
        Create Mission
      </button>
    </form>
  );
}

export function reportForDuty(currentPhase: DesktopShellPhase): DesktopShellPhase {
  if (currentPhase === 'security-checkpoint') return 'command-center';
  return currentPhase;
}

export function createLocalMission(
  draft: MissionDraft,
  options: { id?: string; createdAt?: string } = {},
): ActiveMission | undefined {
  const codename = draft.codename.trim();
  const objective = draft.objective.trim();

  if (!codename || !objective) {
    return undefined;
  }

  return {
    id: options.id ?? crypto.randomUUID(),
    campaign: codename,
    objective,
    condition: 'Briefing',
    commandAuthority: 'Professional command',
    currentState: 'briefing',
    createdAt: options.createdAt ?? new Date().toISOString(),
  };
}

function formatStartupState(state: StartupState): string {
  if (state === 'ready') return 'Ready';
  if (state === 'failed') return 'Startup issue';
  return 'Starting';
}

function formatMigrationStatus(status: StartupStatus): string {
  if (status.state === 'loading') return 'Pending';
  if (status.state === 'failed') return 'Not applied';

  const changed = status.migrations.applied.length;
  const current = status.migrations.skipped.length;

  if (changed === 0 && current > 0) return 'Current';
  return `${changed} applied`;
}
