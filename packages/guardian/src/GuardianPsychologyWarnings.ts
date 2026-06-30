export type GuardianPsychologySignal = 'revenge_language' | 'fomo_language' | 'fatigue_language' | 'rule_negotiation';

export interface GuardianPsychologyEvidence {
  readonly id: string;
  readonly signal: GuardianPsychologySignal;
  readonly source: 'journal' | 'mission_debrief';
  readonly excerpt: string;
}

export interface GuardianPsychologyWarning {
  readonly id: string;
  readonly signal: GuardianPsychologySignal;
  readonly message: string;
  readonly evidenceId: string;
}

const WARNING_MESSAGES: Readonly<Record<GuardianPsychologySignal, string>> = {
  revenge_language: 'Pause and return to the plan before continuing.',
  fomo_language: 'Opportunity pressure is present; wait for confirmed process evidence.',
  fatigue_language: 'Operational fatigue is present; reduce tempo before continuing.',
  rule_negotiation: 'Rule negotiation is present; follow the accepted doctrine before acting.',
};

export function buildGuardianPsychologyWarnings(
  evidence: readonly GuardianPsychologyEvidence[],
): readonly GuardianPsychologyWarning[] {
  return evidence.map((item) => ({
    id: `guardian-warning-${item.id}`,
    signal: item.signal,
    message: WARNING_MESSAGES[item.signal],
    evidenceId: item.id,
  }));
}
