import type { DepartmentSignal } from './departments';

export interface CouncilDecision {
  approved: boolean;
  confidence: number;
  synthesis: string;
  signals: DepartmentSignal[];
}

export class CouncilRuntime {
  decide(signals: DepartmentSignal[]): CouncilDecision {
    const confidence = signals.length
      ? signals.reduce((sum, signal) => sum + signal.confidence, 0) / signals.length
      : 0;
    const blocked = signals.some((signal) => signal.priority === 'black');
    return {
      approved: !blocked,
      confidence,
      synthesis: blocked
        ? 'Guardian intervention required.'
        : 'Institutional consensus reached.',
      signals,
    };
  }
}
