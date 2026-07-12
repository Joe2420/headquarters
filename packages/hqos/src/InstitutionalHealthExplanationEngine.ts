import type { HealthEvidence, HealthExplanation, InstitutionalHealthState } from './InstitutionalHealth';

export function buildHealthExplanation(input: {
  readonly state: InstitutionalHealthState;
  readonly why: string;
  readonly evidence: readonly HealthEvidence[];
  readonly blockingFactors?: readonly string[] | undefined;
  readonly improvingFactors?: readonly string[] | undefined;
}): HealthExplanation {
  const supportingEvidence = input.evidence.map((item) => item.description);

  return Object.freeze({
    why: input.why,
    supportingEvidence: Object.freeze(supportingEvidence.length > 0 ? supportingEvidence : ['No evidence recorded.']),
    blockingFactors: Object.freeze(input.blockingFactors ?? defaultBlockingFactors(input.state)),
    improvingFactors: Object.freeze(input.improvingFactors ?? defaultImprovingFactors(input.state)),
  });
}

function defaultBlockingFactors(state: InstitutionalHealthState): readonly string[] {
  if (state === 'critical') return ['Critical operational condition is active.'];
  if (state === 'degraded') return ['Process integrity requires attention.'];
  if (state === 'forming') return ['More approved evidence is required.'];
  return [];
}

function defaultImprovingFactors(state: InstitutionalHealthState): readonly string[] {
  if (state === 'excellent') return ['Current evidence supports institutional strength.'];
  if (state === 'healthy') return ['Current evidence supports normal operation.'];
  return [];
}
