import type { MissionReplay, ReplayEvidence, ReplayNarration } from '@headquarters/hqos';

export interface CommanderReplayNarrationLine {
  readonly id: string;
  readonly text: string;
  readonly evidence: readonly ReplayEvidence[];
  readonly tone: 'opening' | 'instruction' | 'warning' | 'reflection' | 'recognition';
}

export function buildCommanderReplayNarration(replay: MissionReplay): readonly CommanderReplayNarrationLine[] {
  const lines: CommanderReplayNarrationLine[] = [
    {
      id: `commander-replay:${replay.replayId}:opening`,
      text: `After-action review opened for ${replay.missionName}.`,
      evidence: collectEvidence(replay, [replay.missionId]),
      tone: 'opening',
    },
  ];

  for (const narration of replay.commanderNarrative) {
    lines.push(mapNarration(replay, narration));
  }

  if (replay.evaluation) {
    lines.push({
      id: `commander-replay:${replay.replayId}:evaluation`,
      text: replay.evaluation.commanderReview,
      evidence: collectEvidence(replay, [replay.evaluation.id]),
      tone: replay.evaluation.failures.length > 0 ? 'warning' : 'instruction',
    });

    if (replay.evaluation.recognition.length > 0) {
      lines.push({
        id: `commander-replay:${replay.replayId}:recognition`,
        text: replay.evaluation.recognition[0]!,
        evidence: collectEvidence(replay, [replay.evaluation.id]),
        tone: 'recognition',
      });
    }
  }

  lines.push({
    id: `commander-replay:${replay.replayId}:recommendation`,
    text: replay.summary.recommendations[0]?.text ?? 'Preserve this record and apply the lesson before the next mission.',
    evidence: collectEvidence(replay, replay.summary.recommendations[0]?.evidenceIds ?? []),
    tone: 'reflection',
  });

  return Object.freeze(dedupeLines(lines));
}

function mapNarration(replay: MissionReplay, narration: ReplayNarration): CommanderReplayNarrationLine {
  return {
    id: `commander-replay:${replay.replayId}:${narration.id}`,
    text: narration.text,
    evidence: collectEvidence(replay, narration.evidenceIds),
    tone: narration.text.toLowerCase().includes('guardian') ? 'warning' : 'instruction',
  };
}

function collectEvidence(replay: MissionReplay, evidenceIds: readonly string[]): readonly ReplayEvidence[] {
  const evidence = replay.timeline.events.flatMap((event) => event.evidence);
  const wanted = new Set(evidenceIds);
  return Object.freeze(evidence.filter((item) => wanted.has(item.id)));
}

function dedupeLines(lines: readonly CommanderReplayNarrationLine[]): readonly CommanderReplayNarrationLine[] {
  const seen = new Set<string>();
  return lines.filter((line) => {
    const key = `${line.id}:${line.text}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
