import { type FormEvent, type ReactNode, useEffect, useRef, useState } from 'react';
import type { MissionState } from '@headquarters/shared';
import type { CommanderMessage, CommanderMessageAction } from './CommanderMessage';
import { createCommanderMessage, isCommanderMessageUrgent, listCommanderMessagesInDisplayOrder } from './CommanderMessage';
import type { CommanderShellRoomId } from './CommanderShell';
import {
  getNextObservationInterviewQuestion,
  getNextReadyRoomBriefingQuestion,
  isObservationInterviewComplete,
  isReadyRoomBriefingComplete,
  type MissionBriefingContext,
  type MissionObservationContext,
} from './CommanderMissionBriefing';
import type { MissionCompassStep } from './MissionCompass';
import { MissionCompassPanel } from './RoomNavigationExperience';
import { recommendRoomForMissionState } from './RoomStateMachine';
import {
  adaptCommanderQuestion,
  buildAdaptiveCommanderGuidance,
  formatCommanderBehaviorMemory,
  type CommanderBehaviorProfile,
} from './CommanderBehaviorProfile';
import {
  normalizeCommanderText,
  orchestrateCommanderMessages,
  type CommanderMessageCandidate,
  type CommanderMessagePurpose,
} from './CommanderMessageOrchestrator';
import type { MissionIntelligencePackage } from './MissionIntelligencePackage';
import {
  getCommanderDialogueProfile,
  type CommanderDialogueProfile,
  type CommanderTransmissionTiming,
} from './CommanderDialogueProfile';
import {
  buildCommanderCeremonyDialogueForMissionState,
  type CommanderCeremonyDialogue,
} from './CommanderCeremonyDialogue';

export type CommanderReportState = 'not-reported' | 'reported';

export interface CommanderExperienceMission {
  readonly id: string;
  readonly campaign: string;
  readonly objective: string;
  readonly currentState: string;
  readonly createdAt: string;
  readonly briefingContext?: MissionBriefingContext;
  readonly observationContext?: MissionObservationContext;
}

export interface CommanderExperienceEvidence {
  readonly recentDoctrine?: string | undefined;
  readonly recentMission?: string | undefined;
  readonly recentGrowthEvent?: string | undefined;
  readonly guardianStatus?: string | undefined;
}

export interface CommanderExperienceInput {
  readonly reportState: CommanderReportState;
  readonly activeRoom: CommanderShellRoomId;
  readonly activeMission?: CommanderExperienceMission | undefined;
  readonly evidence?: CommanderExperienceEvidence | undefined;
  readonly behaviorProfile?: CommanderBehaviorProfile | undefined;
  readonly missionIntelligence?: MissionIntelligencePackage | undefined;
  readonly passiveCommanderMessage?: string | undefined;
  readonly acknowledgedInterruptionIds?: readonly string[] | undefined;
}

export interface CommanderNextAction {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly disabled: boolean;
}

export interface CommanderMemorySnippet {
  readonly id: string;
  readonly label: string;
  readonly value: string;
}

export interface CommanderInterruption {
  readonly id: string;
  readonly message: string;
  readonly acknowledged: boolean;
}

export type CommanderRoomPromptMode = 'ask' | 'say';

interface CommanderRoomBehavior {
  readonly mode: CommanderRoomPromptMode;
  readonly statement: string;
  readonly prompt: string;
  readonly acknowledgement: string;
}

export interface CommanderExperienceState {
  readonly currentRoom: CommanderShellRoomId;
  readonly recommendedRoom: CommanderShellRoomId;
  readonly lifecycleStep: string;
  readonly dialogueProfile: CommanderDialogueProfile;
  readonly ceremonyDialogue?: CommanderCeremonyDialogue | undefined;
  readonly commanderQuestion: string;
  readonly roomPromptMode: CommanderRoomPromptMode;
  readonly currentMessage: CommanderMessage;
  readonly messages: readonly CommanderMessage[];
  readonly nextAction: CommanderNextAction;
  readonly secondaryActions: readonly CommanderNextAction[];
  readonly interruption?: CommanderInterruption | undefined;
  readonly memory: readonly CommanderMemorySnippet[];
}

type CommanderTransmissionEntry = {
  readonly id: string;
  readonly speaker: 'Operator' | 'Commander';
  readonly text: string;
  readonly kind: 'current' | 'question' | 'operator' | 'response' | 'support' | 'ceremony';
  readonly purpose?: CommanderMessagePurpose | undefined;
  readonly room?: CommanderShellRoomId | undefined;
  readonly lifecycleStep?: string | undefined;
  readonly promptKey?: string | undefined;
  readonly timing?: CommanderTransmissionTiming | undefined;
  readonly status: 'queued' | 'transmitting' | 'delivered';
};

const baseTimestamp = '2026-07-02T00:00:00.000Z';
const observationSupportMessages = [
  'Holding silence is active work. Stay with the evidence.',
  'Commander check-in. No action required; keep observing.',
  'Good discipline. Waiting is part of the mission.',
  'Maintain the line. Let the market prove itself before you move.',
];

export function buildCommanderExperienceState(input: CommanderExperienceInput): CommanderExperienceState {
  const missionState = parseCommanderMissionState(input.activeMission?.currentState);
  const baseRoomBehavior = getCommanderRoomBehavior(input.activeRoom, input.reportState, missionState, input.activeMission);
  const adaptiveGuidance = buildAdaptiveCommanderGuidance(input.behaviorProfile, input.activeRoom, input.missionIntelligence);
  const roomBehavior = {
    ...baseRoomBehavior,
    statement: adaptiveGuidance ? `${baseRoomBehavior.statement}\n\n${adaptiveGuidance}` : baseRoomBehavior.statement,
    prompt: adaptCommanderQuestion(baseRoomBehavior.prompt, input.behaviorProfile, input.activeRoom),
  };
  const recommendedRoom = input.reportState === 'not-reported' ? 'command' : recommendRoomForMissionState(missionState);
  const nextAction = getCommanderNextAction(input.reportState, missionState, input.activeMission);
  const interruption = getCommanderInterruption(input, missionState);
  const messages = buildCommanderMessageThread(input, recommendedRoom, nextAction, roomBehavior, interruption);
  const orderedMessages = listCommanderMessagesInDisplayOrder(messages);
  const currentMessage = orderedMessages[orderedMessages.length - 1] ?? messages[0];

  if (!currentMessage) {
    throw new Error('Commander message thread must include at least one deterministic message.');
  }

  return {
    currentRoom: input.activeRoom,
    recommendedRoom,
    lifecycleStep: formatCommanderLifecycleStep(input.reportState, missionState),
    dialogueProfile: getCommanderDialogueProfile(input.activeRoom),
    ceremonyDialogue: buildCommanderCeremonyDialogueForMissionState(missionState),
    commanderQuestion: roomBehavior.mode === 'ask' ? roomBehavior.prompt : roomBehavior.statement,
    roomPromptMode: roomBehavior.mode,
    currentMessage,
    messages: orderedMessages,
    nextAction,
    secondaryActions: getCommanderSecondaryActions(input.reportState, missionState),
    interruption,
    memory: buildCommanderMemorySurface(input.evidence, input.behaviorProfile),
  };
}

export function CommanderExperiencePanel({
  state,
  onAcknowledgeInterruption,
  onContinue,
  compassSteps,
  commandChair,
  situationBoard,
  workflowSurface,
  onTransmit,
}: {
  readonly state: CommanderExperienceState;
  readonly onAcknowledgeInterruption?: ((id: string) => void) | undefined;
  readonly onContinue?: (() => void) | undefined;
  readonly compassSteps?: readonly MissionCompassStep[] | undefined;
  readonly commandChair?: ReactNode;
  readonly situationBoard?: ReactNode;
  readonly workflowSurface?: ReactNode;
  readonly onTransmit?: ((message: string) => string | void | Promise<string | void>) | undefined;
}) {
  const [draftTransmission, setDraftTransmission] = useState('');
  const currentPromptKey = buildCommanderTransmissionPromptKey(state);
  const [transmissions, setTransmissions] = useState<CommanderTransmissionEntry[]>(() => (
    typeof window === 'undefined' ? buildInitialCommanderTransmissions(state) : []
  ));
  const feedRef = useRef<HTMLOListElement | null>(null);
  const activePromptKeyRef = useRef(typeof window === 'undefined' ? currentPromptKey : '');
  const observationSupportIndexRef = useRef(0);
  const passiveRoomPhaseRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const feed = feedRef.current;
    if (!feed) return;

    feed.scrollTop = feed.scrollHeight;
  }, [transmissions]);

  useEffect(() => {
    if (activePromptKeyRef.current === currentPromptKey) return;

    activePromptKeyRef.current = currentPromptKey;
    setTransmissions((current) => {
      const ceremonyTransmission = buildCommanderCeremonyTransmission(state);
      const withCeremony = ceremonyTransmission && !current.some((entry) => entry.id === ceremonyTransmission.id)
        ? appendCommanderTransmission(current, ceremonyTransmission)
        : current;

      return appendCommanderTransmission(withCeremony, buildCommanderPromptTransmission(state, currentPromptKey));
    });
  }, [
    currentPromptKey,
    state.ceremonyDialogue?.moment,
    state.commanderQuestion,
    state.currentMessage.text,
    state.roomPromptMode,
  ]);

  useEffect(() => {
    setTransmissions((current) => {
      if (current.some((entry) => entry.speaker === 'Commander' && entry.status === 'transmitting')) {
        return current;
      }

      const nextQueuedIndex = current.findIndex((entry) => (
        entry.speaker === 'Commander' && entry.status === 'queued'
      ));
      if (nextQueuedIndex < 0) return current;

      return current.map((entry, index) => (
        index === nextQueuedIndex ? { ...entry, status: 'transmitting' } : entry
      ));
    });
  }, [transmissions]);

  useEffect(() => {
    if (
      typeof window === 'undefined'
      || state.lifecycleStep !== 'Lifecycle: Observation'
      || isCommanderQuestionPending(state)
      || passiveRoomPhaseRef.current.has(state.lifecycleStep)
    ) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      if (passiveRoomPhaseRef.current.has(state.lifecycleStep)) return;
      const message = observationSupportMessages[observationSupportIndexRef.current % observationSupportMessages.length]
        ?? 'Commander check-in. Hold the observation.';
      observationSupportIndexRef.current += 1;
      passiveRoomPhaseRef.current.add(state.lifecycleStep);

      setTransmissions((current) => appendCommanderTransmission(current, {
        id: `commander:observation-support:${Date.now()}:${current.length}`,
        speaker: 'Commander',
        text: message,
        kind: 'support',
        purpose: 'passive',
        room: state.currentRoom,
        lifecycleStep: state.lifecycleStep,
        status: 'queued',
      }));
    }, 180000);

    return () => window.clearInterval(interval);
  }, [state.currentRoom, state.lifecycleStep]);

  async function handleTransmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = draftTransmission.trim();
    if (message.length === 0) return;

    setTransmissions((current) => [...current, {
      id: `operator:${Date.now()}:${current.length}`,
      speaker: 'Operator',
      text: message,
      kind: 'operator',
      status: 'delivered',
    }]);
    setDraftTransmission('');

    const response = await onTransmit?.(message);
    const commanderResponse = response ?? getTransmissionAcknowledgement(message, state.currentRoom);
    setTransmissions((current) => appendCommanderTransmission(current, {
      id: `commander:response:${Date.now()}:${current.length}`,
      speaker: 'Commander',
      text: commanderResponse,
      kind: 'response',
      purpose: inferCommanderResponsePurpose(commanderResponse, state),
      room: state.currentRoom,
      lifecycleStep: state.lifecycleStep,
      status: 'queued',
    }));
  }

  function handleCommanderTransmissionComplete(transmission: CommanderTransmissionEntry) {
    setTransmissions((current) => {
      const target = current.find((entry) => entry.id === transmission.id);
      if (!target || target.status === 'delivered') return current;

      return current.map((entry) => (
        entry.id === transmission.id ? { ...entry, status: 'delivered' } : entry
      ));
    });
  }

  return (
    <section
      className={state.interruption && !state.interruption.acknowledged ? 'commander-shell commander-shell-interrupted' : 'commander-shell'}
      aria-label="Persistent Commander shell"
      data-current-room={state.currentRoom}
      data-recommended-room={state.recommendedRoom}
      data-room-prompt-mode={state.roomPromptMode}
      data-commander-cadence={state.dialogueProfile.cadence}
      data-commander-posture={state.dialogueProfile.posture}
    >
      <div className="commander-shell-primary">
        <section className="commander-transmission-console" aria-label="Commander transmission channel">
          <div className="commander-transmission-header">
            <p className="section-label">Commander</p>
            <span>{state.lifecycleStep}</span>
          </div>
          <ol ref={feedRef} className="commander-transmission-feed" aria-label="Commander briefing feed" aria-live="polite">
            {transmissions.filter((transmission) => transmission.status !== 'queued').map((transmission) => (
              <li
                key={transmission.id}
                className={transmission.speaker === 'Operator'
                  ? 'commander-transmission commander-transmission-outgoing'
                  : transmission.kind === 'question'
                    ? 'commander-transmission commander-transmission-incoming commander-transmission-question'
                    : transmission.kind === 'ceremony'
                      ? 'commander-transmission commander-transmission-incoming commander-transmission-ceremony'
                      : 'commander-transmission commander-transmission-incoming'}
              >
                <span>{transmission.speaker}</span>
                <p>{transmission.speaker === 'Commander'
                  ? transmission.status === 'delivered'
                    ? transmission.text
                    : <TransmittedText
                        text={transmission.text}
                        timing={transmission.timing ?? state.dialogueProfile.timing}
                        onComplete={() => handleCommanderTransmissionComplete(transmission)}
                      />
                  : transmission.text}</p>
              </li>
            ))}
          </ol>
          <div className="commander-next-action" aria-label="Commander next action">
            <div className="commander-lifecycle-status">
              <p className="section-label">Lifecycle</p>
              <strong>{state.lifecycleStep}</strong>
              <span>{state.nextAction.description}</span>
            </div>
            {onContinue && !isCommanderQuestionPending(state) ? (
              <button
                type="button"
                className={[
                  'primary-action',
                  'commander-continue',
                  state.nextAction.id === 'commander-action:return-to-base' ? 'commander-eject-action' : '',
                ].filter(Boolean).join(' ')}
                data-action-id={state.nextAction.id}
                aria-label={`Continue to ${formatCommanderRoomLabel(state.recommendedRoom)}`}
                disabled={state.nextAction.disabled}
                onClick={onContinue}
              >
                {formatCommanderContinueLabel(state.nextAction)}
              </button>
            ) : null}
          </div>
          <form className="commander-transmission-input" aria-label="Transmit to Commander" onSubmit={handleTransmit}>
            <input
              value={draftTransmission}
              onChange={(event) => setDraftTransmission(event.target.value)}
              placeholder="Transmit a short operational note..."
            />
            <button className="secondary-action" type="submit">Transmit</button>
          </form>
          {workflowSurface ? (
            <div className="commander-workflow-surface" aria-label="Commander workflow controls">
              {workflowSurface}
            </div>
          ) : null}
        </section>
      </div>

      {commandChair || situationBoard || compassSteps ? (
        <div
          className={compassSteps ? 'commander-instrument-strip' : 'commander-instrument-strip commander-instrument-strip-compact'}
          aria-label="Commander instruments"
        >
          {commandChair}
          {compassSteps ? <MissionCompassPanel steps={compassSteps} /> : null}
          {situationBoard}
        </div>
      ) : null}

      {state.interruption && !state.interruption.acknowledged ? (
        <div className="commander-interruption" role="status" aria-label="Commander interruption">
          <strong>{state.interruption.message}</strong>
          <button type="button" className="secondary-action" onClick={() => onAcknowledgeInterruption?.(state.interruption?.id ?? '')}>
            Acknowledge
          </button>
        </div>
      ) : null}

      <details className="commander-context-drawer">
        <summary>Message history and memory</summary>
        <ol className="commander-message-thread" aria-label="Commander message thread">
          {state.messages.map((message, index) => (
            <li
              key={message.id}
              className={index === state.messages.length - 1 ? 'commander-message current' : 'commander-message'}
              data-message-type={message.type}
              data-message-priority={message.priority}
            >
              <span>{formatCommanderMessageType(message.type)}</span>
              <p>{message.text}</p>
              {isCommanderMessageUrgent(message) ? <strong>Priority</strong> : null}
            </li>
          ))}
        </ol>

        <div className="commander-memory-surface" aria-label="Commander memory surface">
          {state.memory.map((snippet) => (
            <div key={snippet.id}>
              <p className="section-label">{snippet.label}</p>
              <strong>{snippet.value}</strong>
            </div>
          ))}
        </div>
      </details>
    </section>
  );
}

function formatCommanderContinueLabel(action: CommanderNextAction): string {
  if (action.id === 'commander-action:war-room-authorization') return 'Request Authorization';
  return action.label;
}

function TransmittedText({
  text,
  timing,
  onComplete,
}: {
  readonly text: string;
  readonly timing?: CommanderTransmissionTiming | undefined;
  readonly onComplete?: (() => void) | undefined;
}) {
  const [visibleText, setVisibleText] = useState(() => (typeof window === 'undefined' ? text : ''));
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  const transmissionTiming = timing ?? {
    startDelayMs: 240,
    characterDelayMs: 36,
    commaDelayMs: 140,
    sentenceDelayMs: 260,
    breathEveryCharacters: 17,
    breathDelayMs: 180,
  };

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    setVisibleText('');
    completedRef.current = false;
    let index = 0;
    let timeout: number | undefined;

    const complete = () => {
      if (completedRef.current) return;
      completedRef.current = true;
      onCompleteRef.current?.();
    };

    if (text.length === 0) {
      complete();
      return undefined;
    }

    const transmitNextCharacter = () => {
      index += 1;
      setVisibleText(text.slice(0, index));

      if (index >= text.length) {
        complete();
        return;
      }

      const previousCharacter = text[index - 1] ?? '';
      const delay = previousCharacter === '.' || previousCharacter === '?' || previousCharacter === '!'
        ? transmissionTiming.sentenceDelayMs
        : previousCharacter === ',' || previousCharacter === ';'
          ? transmissionTiming.commaDelayMs
          : index % transmissionTiming.breathEveryCharacters === 0
            ? transmissionTiming.breathDelayMs
            : transmissionTiming.characterDelayMs;

      timeout = window.setTimeout(transmitNextCharacter, delay);
    };

    timeout = window.setTimeout(transmitNextCharacter, transmissionTiming.startDelayMs);

    return () => {
      if (timeout !== undefined) window.clearTimeout(timeout);
    };
  }, [
    text,
    transmissionTiming.breathDelayMs,
    transmissionTiming.breathEveryCharacters,
    transmissionTiming.characterDelayMs,
    transmissionTiming.commaDelayMs,
    transmissionTiming.sentenceDelayMs,
    transmissionTiming.startDelayMs,
  ]);

  return <>{visibleText}</>;
}

function buildInitialCommanderTransmissions(state: CommanderExperienceState): CommanderTransmissionEntry[] {
  const promptKey = buildCommanderTransmissionPromptKey(state);
  const promptTransmission = buildCommanderPromptTransmission(state, promptKey);
  const ceremonyTransmission = buildCommanderCeremonyTransmission(state);

  return [
    ...(ceremonyTransmission ? [{ ...ceremonyTransmission, status: 'delivered' as const }] : []),
    { ...promptTransmission, status: 'delivered' },
  ];
}

function appendCommanderTransmission(
  transmissions: readonly CommanderTransmissionEntry[],
  nextTransmission: CommanderTransmissionEntry,
): CommanderTransmissionEntry[] {
  if (nextTransmission.speaker !== 'Commander') return [...transmissions, nextTransmission];
  if (shouldSuppressAutomaticPromptAfterResponse(transmissions, nextTransmission)) {
    return [...transmissions];
  }

  const lastCommanderTransmission = getLastCommanderTransmission(transmissions);
  const orchestrated = orchestrateCommanderMessages([toCommanderMessageCandidate(nextTransmission)], {
    activeQuestionPending: transmissions.some((entry) => entry.speaker === 'Commander' && entry.status !== 'delivered'),
    previousCommanderPurpose: lastCommanderTransmission?.purpose,
    previousCommanderText: lastCommanderTransmission?.text,
    renderedMessages: transmissions
      .filter((entry) => entry.speaker === 'Commander')
      .map(toCommanderMessageCandidate),
  });

  if (orchestrated.length === 0) {
    return [...transmissions];
  }

  const [message] = orchestrated;
  if (message === undefined) return [...transmissions];

  return [...transmissions, {
    ...nextTransmission,
    id: message.id,
    text: message.text,
    purpose: message.purpose,
    room: message.room,
    lifecycleStep: message.lifecycleStep,
  }];
}

function shouldSuppressAutomaticPromptAfterResponse(
  transmissions: readonly CommanderTransmissionEntry[],
  nextTransmission: CommanderTransmissionEntry,
): boolean {
  if (nextTransmission.kind !== 'question' || !nextTransmission.promptKey) return false;

  const lastTransmission = transmissions[transmissions.length - 1];
  const lastCommanderTransmission = getLastCommanderTransmission(transmissions);
  if (lastTransmission?.speaker === 'Operator') return true;
  if (lastTransmission?.speaker !== 'Commander') return false;
  if (lastCommanderTransmission?.kind !== 'response') return false;
  if (lastCommanderTransmission.lifecycleStep !== nextTransmission.lifecycleStep) return false;
  if (lastCommanderTransmission.room !== nextTransmission.room) return false;

  return true;
}

function buildCommanderTransmissionPromptKey(state: CommanderExperienceState): string {
  return [
    state.currentMessage.id,
    state.lifecycleStep,
    state.currentMessage.text,
    state.commanderQuestion,
    state.roomPromptMode,
  ].join('|');
}

function buildCommanderCeremonyTransmission(
  state: CommanderExperienceState,
): CommanderTransmissionEntry | undefined {
  const ceremony = state.ceremonyDialogue;
  if (!ceremony) return undefined;

  return {
    id: `commander:ceremony:${ceremony.moment}`,
    speaker: 'Commander',
    text: `${ceremony.commanderLine}\n\n${ceremony.supportingLine}`,
    kind: 'ceremony',
    purpose: inferCommanderCeremonyPurpose(ceremony),
    room: ceremony.room,
    lifecycleStep: state.lifecycleStep,
    timing: getCommanderCeremonyTransmissionTiming(ceremony),
    status: 'queued',
  };
}

function getCommanderCeremonyTransmissionTiming(
  ceremony: CommanderCeremonyDialogue,
): CommanderTransmissionTiming {
  const baseTiming: CommanderTransmissionTiming = {
    startDelayMs: 420,
    characterDelayMs: 42,
    commaDelayMs: 190,
    sentenceDelayMs: 520,
    breathEveryCharacters: 18,
    breathDelayMs: 260,
  };

  if (ceremony.tone === 'direct') {
    return {
      ...baseTiming,
      startDelayMs: 260,
      characterDelayMs: 34,
      commaDelayMs: 140,
      sentenceDelayMs: 360,
      breathDelayMs: 180,
    };
  }

  if (ceremony.tone === 'reflective') {
    return {
      ...baseTiming,
      startDelayMs: 520,
      characterDelayMs: 48,
      sentenceDelayMs: 680,
      breathEveryCharacters: 16,
      breathDelayMs: 340,
    };
  }

  return baseTiming;
}

function inferCommanderCeremonyPurpose(ceremony: CommanderCeremonyDialogue): CommanderMessagePurpose {
  if (ceremony.moment === 'authorization_granted') return 'authorization';
  if (ceremony.moment === 'debrief_complete' || ceremony.moment === 'return_to_base') return 'debrief';
  if (
    ceremony.moment === 'briefing_complete'
    || ceremony.moment === 'observation_complete'
    || ceremony.moment === 'mission_archived'
  ) {
    return 'completion';
  }

  return 'transition';
}

function isCommanderQuestionPending(state: CommanderExperienceState): boolean {
  return state.roomPromptMode === 'ask'
    && (
      (state.lifecycleStep === 'Lifecycle: Briefing' && state.nextAction.disabled)
      || (state.lifecycleStep === 'Lifecycle: Observation' && state.nextAction.disabled)
      || state.lifecycleStep === 'Lifecycle: Authorization'
    );
}

function buildCommanderPromptTransmission(
  state: CommanderExperienceState,
  promptKey: string,
): CommanderTransmissionEntry {
  const questionPending = state.roomPromptMode === 'ask';
  const promptText = questionPending
    ? mergeCommanderPromptText(state.currentMessage.text, state.commanderQuestion)
    : state.currentMessage.text;

  return {
    id: `${promptKey}:${questionPending ? 'question' : 'current'}`,
    speaker: 'Commander',
    text: promptText,
    kind: questionPending ? 'question' : 'current',
    purpose: questionPending ? 'question' : inferCommanderMessagePurpose(state.currentMessage.type),
    room: state.currentRoom,
    lifecycleStep: state.lifecycleStep,
    promptKey,
    status: 'queued',
  };
}

function mergeCommanderPromptText(currentText: string, questionText: string): string {
  const normalizedCurrent = normalizeCommanderText(currentText);
  const normalizedQuestion = normalizeCommanderText(questionText);
  if (!normalizedCurrent) return questionText;
  if (!normalizedQuestion) return currentText;
  if (normalizedCurrent.includes(normalizedQuestion)) return currentText;
  if (normalizedQuestion.includes(normalizedCurrent)) return questionText;
  return `${currentText.trim()}\n\n${questionText.trim()}`;
}

function toCommanderMessageCandidate(transmission: CommanderTransmissionEntry): CommanderMessageCandidate {
  return {
    id: transmission.id,
    room: transmission.room ?? 'command',
    lifecycleStep: transmission.lifecycleStep ?? 'Lifecycle: Unknown',
    purpose: transmission.purpose ?? inferCommanderTransmissionPurpose(transmission),
    text: transmission.text,
    source: transmission.purpose === 'passive' ? 'passive' : 'commander',
  };
}

function getLastCommanderTransmission(
  transmissions: readonly CommanderTransmissionEntry[],
): CommanderTransmissionEntry | undefined {
  return [...transmissions].reverse().find((entry) => entry.speaker === 'Commander');
}

function inferCommanderTransmissionPurpose(transmission: CommanderTransmissionEntry): CommanderMessagePurpose {
  if (transmission.kind === 'question') return 'question';
  if (transmission.kind === 'support') return 'passive';
  if (transmission.kind === 'response') return 'acknowledgement';
  if (transmission.kind === 'ceremony') return 'transition';
  return 'summary';
}

function inferCommanderResponsePurpose(
  text: string,
  state: CommanderExperienceState,
): CommanderMessagePurpose {
  const normalized = normalizeCommanderText(text);
  if (normalized.includes('authorization')) return 'authorization';
  if (normalized.includes('complete') || normalized.includes('proceed')) return 'completion';
  if (state.lifecycleStep === 'Lifecycle: Debrief') return 'debrief';
  if (normalized.endsWith('?')) return 'question';
  return 'acknowledgement';
}

function inferCommanderMessagePurpose(type: CommanderMessage['type']): CommanderMessagePurpose {
  if (type === 'warning') return 'warning';
  if (type === 'transition') return 'transition';
  if (type === 'debrief') return 'debrief';
  if (type === 'interruption') return 'warning';
  return 'summary';
}

function getTransmissionAcknowledgement(message: string, room: CommanderShellRoomId): string {
  if (isContinueTransmission(message)) return 'Continue order received.';
  return getCommanderRoomBehavior(room, 'reported').acknowledgement;
}

export function isContinueTransmission(message: string): boolean {
  const normalized = message.trim().toLowerCase();
  return normalized === 'continue'
    || normalized === 'proceed'
    || normalized === 'advance'
    || normalized === 'confirm'
    || normalized.includes('continue mission')
    || normalized.includes('proceed');
}

export function mapNavigationRoomToCommanderRoom(room: string): CommanderShellRoomId {
  if (room === 'ready') return 'ready-room';
  if (room === 'war') return 'war-room';
  if (room === 'missions') return 'command';
  if (room === 'observation') return 'observation';
  if (room === 'debrief') return 'debrief';
  if (room === 'archive') return 'archive';
  if (room === 'journal') return 'journal';
  if (room === 'doctrine') return 'doctrine';
  if (room === 'academy') return 'academy';
  if (room === 'guardian') return 'guardian';
  if (room === 'intelligence') return 'intelligence';
  if (room === 'settings') return 'settings';
  return 'command';
}

export function getCommanderNextAction(
  reportState: CommanderReportState,
  missionState?: MissionState | undefined,
  mission?: CommanderExperienceMission | undefined,
): CommanderNextAction {
  if (reportState === 'not-reported') {
    return {
      id: 'commander-action:report-for-duty',
      label: 'Report for Duty',
      description: 'Enter Headquarters before mission work begins.',
      disabled: false,
    };
  }

  if (missionState === undefined) {
    return {
      id: 'commander-action:create-mission',
      label: 'Create Mission',
      description: 'Create one mission before opening lifecycle rooms.',
      disabled: false,
    };
  }

  if (missionState === 'idle') {
    return {
      id: 'commander-action:start-briefing',
      label: 'Start Briefing',
      description: 'Open the briefing phase and confirm the mission intent.',
      disabled: false,
    };
  }

  if (missionState === 'briefing') {
    const briefingComplete = isReadyRoomBriefingComplete(mission?.briefingContext);

    return {
      id: 'commander-action:complete-briefing',
      label: 'Complete Briefing',
      description: briefingComplete
        ? 'Operational briefing accepted. Proceed to Observation.'
        : 'Answer the Commander briefing questions in chat before Observation unlocks.',
      disabled: !briefingComplete,
    };
  }

  if (missionState === 'ready') {
    return {
      id: 'commander-action:begin-observation',
      label: 'Begin Observation',
      description: 'Begin the Commander observation interview.',
      disabled: false,
    };
  }

  if (missionState === 'observation') {
    const observationComplete = isObservationInterviewComplete(mission?.observationContext);

    return {
      id: 'commander-action:complete-observation',
      label: 'Complete Observation',
      description: observationComplete
        ? 'Evidence package accepted. Proceed to War Room authorization.'
        : 'Complete the Commander observation interview before War Room unlocks.',
      disabled: !observationComplete,
    };
  }

  if (missionState === 'authorization') {
    return {
      id: 'commander-action:war-room-authorization',
      label: 'War Room Authorization',
      description: 'Answer the Commander authorization questions before deployment unlocks.',
      disabled: true,
    };
  }

  if (missionState === 'deployed') {
    return {
      id: 'commander-action:return-to-base',
      label: 'Return To Base',
      description: 'Authorization is accepted. Return to base only when the declared plan has concluded.',
      disabled: false,
    };
  }

  if (missionState === 'return_to_base') {
    return {
      id: 'commander-action:begin-debrief',
      label: 'Begin Debrief',
      description: 'Record behavior summary, discipline notes, and lesson.',
      disabled: false,
    };
  }

  return {
    id: 'commander-action:archive-mission',
    label: 'Archive Mission',
    description: 'Preserve the completed mission record as institutional memory.',
    disabled: missionState === 'archived',
  };
}

export function getCommanderRoomTransitionText(
  missionState?: MissionState | undefined,
  activeRoom: CommanderShellRoomId = 'command',
): string {
  if (!isMissionLifecycleRoom(activeRoom)) {
    return getCommanderRoomBehavior(activeRoom, 'reported', missionState).statement;
  }

  if (missionState === undefined) return 'Create Mission.';
  if (missionState === 'idle') return 'Briefing is ready to begin.';
  if (missionState === 'briefing') return 'Operational briefing required before Observation.';
  if (missionState === 'ready' || missionState === 'observation') return 'Observation requires evidence before War Room.';
  if (missionState === 'authorization' || missionState === 'deployed') return 'War Room unlocked. Authorization required.';
  if (missionState === 'return_to_base') return 'Debrief Theater ready.';
  return 'Archive the mission record.';
}

export function buildCommanderMemorySurface(
  evidence?: CommanderExperienceEvidence | undefined,
  behaviorProfile?: CommanderBehaviorProfile | undefined,
): CommanderMemorySnippet[] {
  return [
    {
      id: 'memory:doctrine',
      label: 'Recent Doctrine',
      value: formatMemoryValue(evidence?.recentDoctrine, 'No recent doctrine evidence'),
    },
    {
      id: 'memory:mission',
      label: 'Recent Mission',
      value: formatMemoryValue(evidence?.recentMission, 'No recent mission evidence'),
    },
    {
      id: 'memory:growth',
      label: 'Recent Growth',
      value: formatMemoryValue(evidence?.recentGrowthEvent, 'No recent growth evidence'),
    },
    {
      id: 'memory:guardian',
      label: 'Guardian',
      value: formatMemoryValue(evidence?.guardianStatus, 'Guardian standing by'),
    },
    {
      id: 'memory:behavior',
      label: 'Behavior',
      value: formatCommanderBehaviorMemory(behaviorProfile),
    },
  ];
}

function buildCommanderMessageThread(
  input: CommanderExperienceInput,
  recommendedRoom: CommanderShellRoomId,
  nextAction: CommanderNextAction,
  roomBehavior: CommanderRoomBehavior,
  interruption?: CommanderInterruption | undefined,
): CommanderMessage[] {
  const missionState = parseCommanderMissionState(input.activeMission?.currentState);
  const primaryAction = toCommanderMessageAction(nextAction);
  const thread = [
    createCommanderMessage({
      id: 'commander:guidance:current-state',
      timestamp: baseTimestamp,
      room: input.activeRoom,
      type: 'guidance',
      tone: 'calm',
      priority: 'normal',
      text: getCommanderStateText(input.reportState, missionState, input.activeRoom, roomBehavior),
      primaryAction,
      secondaryActions: [],
      source: 'system',
    }),
    createCommanderMessage({
      id: `commander:transition:${recommendedRoom}`,
      timestamp: '2026-07-02T00:00:01.000Z',
      room: recommendedRoom,
      type: 'transition',
      tone: 'firm',
      priority: 'normal',
      text: getCommanderRoomTransitionText(missionState, input.activeRoom),
      primaryAction,
      secondaryActions: [],
      source: 'room-transition',
    }),
  ];

  if (missionState === 'return_to_base') {
    thread.push(createCommanderMessage({
      id: 'commander:debrief:prompt',
      timestamp: '2026-07-02T00:00:02.000Z',
      room: 'debrief',
      type: 'debrief',
      tone: 'firm',
      priority: 'normal',
      text: 'Debrief starts now: behavior summary, discipline notes, lesson.',
      primaryAction,
      secondaryActions: [],
      source: 'mission-state',
    }));
  }

  if (interruption && !interruption.acknowledged) {
    thread.push(createCommanderMessage({
      id: interruption.id,
      timestamp: '2026-07-02T00:00:03.000Z',
      room: recommendedRoom,
      type: 'interruption',
      tone: 'protective',
      priority: 'high',
      text: interruption.message,
      primaryAction,
      secondaryActions: [],
      source: 'mission-state',
    }));
  }

  if (input.passiveCommanderMessage && !thread.some((message) => message.text === input.passiveCommanderMessage)) {
    thread.push(createCommanderMessage({
      id: `commander:passive:${normalizeCommanderText(input.passiveCommanderMessage).slice(0, 48)}`,
      timestamp: '2026-07-02T00:00:04.000Z',
      room: recommendedRoom,
      type: 'guidance',
      tone: 'calm',
      priority: 'normal',
      text: input.passiveCommanderMessage,
      primaryAction,
      secondaryActions: [],
      source: 'system',
    }));
  }

  return thread;
}

function getCommanderInterruption(
  input: CommanderExperienceInput,
  missionState?: MissionState | undefined,
): CommanderInterruption | undefined {
  const id = getCommanderInterruptionId(missionState);
  if (!id) return undefined;

  return {
    id,
    message: getCommanderInterruptionText(missionState),
    acknowledged: input.acknowledgedInterruptionIds?.includes(id) ?? false,
  };
}

function getCommanderInterruptionId(missionState?: MissionState | undefined): string | undefined {
  if (missionState === 'briefing') return 'commander:interruption:mission-created';
  if (missionState === 'authorization') return 'commander:interruption:observation-complete';
  if (missionState === 'deployed') return 'commander:interruption:authorization-requested';
  if (missionState === 'return_to_base') return 'commander:interruption:mission-returned';
  return undefined;
}

function getCommanderInterruptionText(missionState?: MissionState | undefined): string {
  if (missionState === 'briefing') return 'Mission created. Prepare before moving further.';
  if (missionState === 'authorization') return 'Observation completed. Authorization now requires discipline.';
  if (missionState === 'deployed') return 'Authorization requested. Follow the declared plan.';
  return 'Mission returned. Debrief before archive.';
}

function getCommanderSecondaryActions(
  reportState: CommanderReportState,
  missionState?: MissionState | undefined,
): CommanderNextAction[] {
  if (reportState === 'not-reported') return [];
  if (missionState === undefined) return [{ id: 'secondary:review-archive', label: 'Review Archive', description: 'Open archive context only if needed.', disabled: false }];
  return [{ id: 'secondary:review-timeline', label: 'Review Timeline', description: 'Read history after the primary action is clear.', disabled: false }];
}

function getCommanderStateText(
  reportState: CommanderReportState,
  missionState: MissionState | undefined,
  activeRoom: CommanderShellRoomId,
  roomBehavior: CommanderRoomBehavior,
): string {
  if (reportState === 'not-reported') return 'Report for duty. Headquarters is waiting.';
  if (!isMissionLifecycleRoom(activeRoom)) return roomBehavior.statement;
  if (missionState === undefined) return appendAdaptiveStateText('No active mission. Create one mission.', roomBehavior.statement);
  if (missionState === 'idle') return appendAdaptiveStateText('Mission file exists. Briefing is the next phase.', roomBehavior.statement);
  if (missionState === 'briefing') return appendAdaptiveStateText('Briefing is active. Confirm objective, authority, and observation rules.', roomBehavior.statement);
  if (missionState === 'ready' || missionState === 'observation') return appendAdaptiveStateText('Observation is active work. Remain silent.', roomBehavior.statement);
  if (missionState === 'authorization' || missionState === 'deployed') return appendAdaptiveStateText('War Room authority is active. Stay inside the plan.', roomBehavior.statement);
  if (missionState === 'return_to_base') return appendAdaptiveStateText('Return complete. Begin behavior-first debrief.', roomBehavior.statement);
  return appendAdaptiveStateText('Mission complete. Archive the record.', roomBehavior.statement);
}

function appendAdaptiveStateText(baseText: string, roomStatement: string): string {
  const adaptiveText = roomStatement.split('\n\n').slice(1).join('\n\n').trim();
  return adaptiveText ? `${baseText}\n\n${adaptiveText}` : baseText;
}

function isMissionLifecycleRoom(room: CommanderShellRoomId): boolean {
  return room === 'command'
    || room === 'ready-room'
    || room === 'observation'
    || room === 'war-room'
    || room === 'debrief'
    || room === 'archive';
}

function getCommanderRoomBehavior(
  room: CommanderShellRoomId,
  reportState: CommanderReportState,
  missionState?: MissionState | undefined,
  mission?: CommanderExperienceMission | undefined,
): CommanderRoomBehavior {
  if (reportState === 'not-reported') {
    return {
      mode: 'ask',
      statement: 'Security checkpoint active. Headquarters waits for the operator.',
      prompt: 'Are you ready to report for duty?',
      acknowledgement: 'Report note received. Checkpoint remains active.',
    };
  }

  if (room === 'command') {
    return {
      mode: 'ask',
      statement: 'Command Center online. One objective stays in front of us.',
      prompt: getCommanderQuestion(reportState, missionState),
      acknowledgement: 'Transmission received. Command focus remains on the next disciplined action.',
    };
  }

  if (room === 'ready-room') {
    return {
      mode: 'ask',
      statement: 'Ready Room is preparation, not action.',
      prompt: missionState === 'briefing'
        ? getNextReadyRoomBriefingQuestion(mission?.briefingContext)
        : 'Are you briefed, seated, and ready to observe without touching execution?',
      acknowledgement: 'Readiness note received. Preparation remains the standard.',
    };
  }

  if (room === 'observation') {
    return {
      mode: 'ask',
      statement: 'Observation is an intelligence interview. Report evidence one answer at a time.',
      prompt: getNextObservationInterviewQuestion(mission?.observationContext),
      acknowledgement: 'Observation note received. Evidence remains separate from impulse.',
    };
  }

  if (room === 'war-room') {
    return {
      mode: 'ask',
      statement: 'War Room authority is active. Authorization is not automatic.',
      prompt: getWarRoomAuthorizationQuestion(reportState, missionState, mission),
      acknowledgement: 'Authorization note received. Evidence and rules remain the standard.',
    };
  }

  if (room === 'debrief') {
    return {
      mode: 'ask',
      statement: 'Debrief starts now. Behavior comes before outcome.',
      prompt: 'What behavior occurred, what discipline was kept, and what lesson remains?',
      acknowledgement: 'Debrief note received. Keep it behavior-first.',
    };
  }

  if (room === 'archive') {
    return {
      mode: 'say',
      statement: 'Archive is historical intelligence. Read the record without rewriting it.',
      prompt: 'Archive is historical intelligence. Read the record without rewriting it.',
      acknowledgement: 'Archive note received. The record remains unchanged.',
    };
  }

  if (room === 'journal') {
    return {
      mode: 'ask',
      statement: 'Journal is the command log. Record first; interpret second.',
      prompt: 'What happened, before judgment?',
      acknowledgement: 'Log note received. Record first; interpretation later.',
    };
  }

  if (room === 'doctrine') {
    return {
      mode: 'ask',
      statement: 'Doctrine is institutional memory. Evidence must repeat before it becomes law.',
      prompt: 'Is this lesson ready to become law, or only a candidate?',
      acknowledgement: 'Doctrine note received. Repeated evidence remains the threshold.',
    };
  }

  if (room === 'academy') {
    return {
      mode: 'say',
      statement: 'Academy recognizes behavior, not numbers.',
      prompt: 'Academy recognizes behavior, not numbers.',
      acknowledgement: 'Growth note received. Behavior is the measure.',
    };
  }

  if (room === 'guardian') {
    return {
      mode: 'say',
      statement: 'Guardian is watching limits. No action is required unless a boundary moves.',
      prompt: 'Guardian is watching limits. No action is required unless a boundary moves.',
      acknowledgement: 'Boundary note received. Guardian remains active.',
    };
  }

  if (room === 'intelligence') {
    return {
      mode: 'say',
      statement: 'Intelligence classifies patterns. Suggestions are evidence, not orders.',
      prompt: 'Intelligence classifies patterns. Suggestions are evidence, not orders.',
      acknowledgement: 'Intelligence note received. Patterns remain evidence.',
    };
  }

  return {
    mode: 'say',
    statement: 'Settings are quiet. No operational action is required.',
    prompt: 'Settings are quiet. No operational action is required.',
    acknowledgement: 'Settings note received.',
  };
}

function formatCommanderLifecycleStep(
  reportState: CommanderReportState,
  missionState?: MissionState | undefined,
): string {
  if (reportState === 'not-reported') return 'Lifecycle: Security Checkpoint';
  if (missionState === undefined) return 'Lifecycle: Mission Creation';
  return `Lifecycle: ${formatCommanderMissionState(missionState)}`;
}

function getCommanderQuestion(
  reportState: CommanderReportState,
  missionState?: MissionState | undefined,
): string {
  if (reportState === 'not-reported') return 'Are you ready to report for duty?';
  if (missionState === undefined) return 'What mission are we opening, and what objective must it serve?';
  if (missionState === 'idle') return 'Is the mission file ready to enter briefing?';
  if (missionState === 'briefing') return 'Confirm the objective, authority, and observation rule. Then we can move.';
  if (missionState === 'ready') return 'Are you seated, briefed, and ready to begin observation without touching execution?';
  if (missionState === 'observation') return 'Observation check: what evidence has appeared, and what is still missing?';
  if (missionState === 'authorization') return 'State the reason: market condition, session, volume, divergence, and invalidation.';
  if (missionState === 'deployed') return 'Has the authorized plan concluded so we can return to base?';
  if (missionState === 'return_to_base') return 'What behavior occurred, what discipline was kept, and what lesson remains?';
  if (missionState === 'debrief') return 'Is the debrief complete enough to archive as institutional memory?';
  return 'Mission is archived. Do you want to review records or open a new mission?';
}

function getWarRoomAuthorizationQuestion(
  reportState: CommanderReportState,
  missionState?: MissionState | undefined,
  mission?: CommanderExperienceMission | undefined,
): string {
  if (missionState !== 'authorization') return getCommanderQuestion(reportState, missionState);

  const invalidationEvidence = mission?.observationContext?.invalidationEvidence?.trim();
  if (invalidationEvidence) {
    return `Observation invalidation recorded: ${trimTrailingSentencePunctuation(invalidationEvidence)}. Which rule protects this authorization decision?`;
  }

  return 'State the authorization reasoning and the invalidation condition that protects this decision.';
}

function trimTrailingSentencePunctuation(value: string): string {
  return value.replace(/[.!?]+$/u, '').trim();
}

function toCommanderMessageAction(action: CommanderNextAction): CommanderMessageAction {
  return {
    id: action.id,
    label: action.label,
    disabled: action.disabled,
  };
}

function parseCommanderMissionState(state?: string): MissionState | undefined {
  if (
    state === 'idle'
    || state === 'briefing'
    || state === 'ready'
    || state === 'observation'
    || state === 'authorization'
    || state === 'deployed'
    || state === 'return_to_base'
    || state === 'debrief'
    || state === 'archived'
  ) {
    return state;
  }

  return undefined;
}

function formatCommanderMissionState(state: MissionState): string {
  return state
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatCommanderMessageType(type: CommanderMessage['type']): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function formatCommanderRoomLabel(room: CommanderShellRoomId): string {
  if (room === 'ready-room') return 'Ready Room';
  if (room === 'war-room') return 'War Room';
  if (room === 'debrief') return 'Debrief Theater';
  return room
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatMemoryValue(value: string | undefined, fallback: string): string {
  if (value === undefined || value.trim().length === 0) return fallback;
  return value;
}
