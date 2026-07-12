import type { InstitutionalHealthSnapshot } from '@headquarters/hqos';

export interface CommanderInstitutionalHealthBriefing {
  readonly title: string;
  readonly summary: string;
  readonly priority: string;
  readonly recommendation: string;
  readonly evidence: readonly string[];
  readonly changed: boolean;
}

export function buildCommanderInstitutionalHealthBriefing(input: {
  readonly current: InstitutionalHealthSnapshot;
  readonly previous?: InstitutionalHealthSnapshot | undefined;
}): CommanderInstitutionalHealthBriefing {
  const concern = input.current.highestConcern;
  const changed = input.previous === undefined
    || input.previous.overallState !== input.current.overallState
    || input.previous.highestConcern?.id !== concern?.id
    || input.previous.highestConcern?.state !== concern?.state;

  return Object.freeze({
    title: 'Headquarters Condition',
    summary: changed
      ? input.current.summary
      : 'Headquarters condition is unchanged. Continue the current operational path.',
    priority: concern === undefined
      ? 'No dimension requires priority attention.'
      : `${concern.title}: ${concern.state}.`,
    recommendation: concern === undefined
      ? 'Maintain the current process.'
      : concern.explanation.blockingFactors[0] ?? concern.explanation.improvingFactors[0] ?? concern.explanation.why,
    evidence: Object.freeze((concern?.supportingEvidence ?? input.current.sourceEvidence)
      .slice(0, 3)
      .map((evidence) => evidence.description)),
    changed,
  });
}
