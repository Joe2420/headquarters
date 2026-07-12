import type { CommanderWorkspaceAction } from './CommanderWorkspaceModel';

export interface CommanderInteractionChoice {
  readonly id: string;
  readonly label: string;
  readonly disabled?: boolean | undefined;
}

export interface CommanderInteractionControllerProps {
  readonly action: CommanderWorkspaceAction;
  readonly busy?: boolean | undefined;
  readonly choices?: readonly CommanderInteractionChoice[] | undefined;
  readonly onPrimaryAction?: (() => void) | undefined;
  readonly onChoice?: ((choiceId: string) => void) | undefined;
}

export function CommanderInteractionController({
  action,
  busy = false,
  choices = [],
  onPrimaryAction,
  onChoice,
}: CommanderInteractionControllerProps) {
  const primaryLabel = getOperationalActionLabel(action.label);

  return (
    <section className="commander-interaction-controller" aria-label="Commander interaction controller">
      <div>
        <p className="section-label">Primary Order</p>
        <strong>{primaryLabel}</strong>
        <span>{action.reason}</span>
      </div>
      {choices.length > 0 ? (
        <div className="commander-interaction-controller__choices" role="group" aria-label="Structured Commander choices">
          {choices.map((choice) => (
            <button
              key={choice.id}
              type="button"
              disabled={busy || choice.disabled}
              onClick={() => onChoice?.(choice.id)}
            >
              {choice.label}
            </button>
          ))}
        </div>
      ) : null}
      <button
        className="primary-action commander-interaction-controller__primary"
        type="button"
        disabled={busy || action.disabled}
        data-busy={busy}
        onClick={onPrimaryAction}
      >
        {busy ? 'Transmitting...' : primaryLabel}
      </button>
    </section>
  );
}

export function getOperationalActionLabel(label: string): string {
  const normalized = label.trim();
  if (!normalized || normalized.toLowerCase() === 'continue') return 'Await Commander Order';
  return normalized;
}
