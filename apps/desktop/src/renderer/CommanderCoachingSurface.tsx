import type { CommanderWorkspaceSnapshot } from './CommanderWorkspaceModel';

export interface CommanderCoachingSurfaceProps {
  readonly snapshot: CommanderWorkspaceSnapshot;
}

export function CommanderCoachingSurface({ snapshot }: CommanderCoachingSurfaceProps) {
  const canCoach = snapshot.evidenceCount > 0;

  return (
    <section className="commander-coaching-surface" data-confidence={snapshot.relationship.confidence} aria-label="Commander coaching">
      <p className="section-label">Commander Memory</p>
      <h3>{canCoach ? 'Evidence-based coaching' : 'Evidence still forming'}</h3>
      <p>{canCoach ? snapshot.relationship.summary : 'Commander will not infer behavior until Headquarters has evidence.'}</p>
      <dl>
        <div>
          <dt>Confidence</dt>
          <dd>{snapshot.relationship.confidence}</dd>
        </div>
        <div>
          <dt>Evidence</dt>
          <dd>{snapshot.evidenceCount}</dd>
        </div>
      </dl>
    </section>
  );
}
