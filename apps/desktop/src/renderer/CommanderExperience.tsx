import { type FormEvent, type ReactNode, useState } from 'react';
import type { MissionState } from '@headquarters/shared';
import type { CommanderMessage, CommanderMessageAction } from './CommanderMessage';
import { createCommanderMessage, isCommanderMessageUrgent, listCommanderMessagesInDisplayOrder } from './CommanderMessage';
import type { CommanderShellRoomId } from './CommanderShell';
import type { MissionCompassStep } from './MissionCompass';
import { MissionCompassPanel } from './RoomNavigationExperience';
import { recommendRoomForMissionState } from './RoomStateMachine';

export type CommanderReportState = 'not-reported' | 'reported';

export interface CommanderExperienceMission {
  readonly id: string;
  readonly campaign: string;
  readonly objective: string;
  readonly currentState: string;
  readonly createdAt: string;
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

export interface CommanderExperienceState {
  readonly currentRoom: CommanderShellRoomId;
  readonly recommendedRoom: CommanderShellRoomId;
  readonly lifecycleStep: string;
  readonly commanderQuestion: string;
  readonly currentMessage: CommanderMessage;
  readonly messages: readonly CommanderMessage[];
  readonly nextAction: CommanderNextAction;
  readonly secondaryActions: readonly CommanderNextAction[];
  readonly interruption?: CommanderInterruption | undefined;
  readonly memory: readonly CommanderMemorySnippet[];
}

const baseTimestamp = '2026-07-02T00:00:00.000Z';

export function buildCommanderExperienceState(input: CommanderExperienceInput): CommanderExperienceState {
  const missionState = parseCommanderMissionState(input.activeMission?.currentState);
  const recommendedRoom = input.reportState === 'not-reported' ? 'command' : recommendRoomForMissionState(missionState);
  const nextAction = getCommanderNextAction(input.reportState, missionState);
  const interruption = getCommanderInterruption(input, missionState);
  const messages = buildCommanderMessageThread(input, recommendedRoom, nextAction, interruption);
  const orderedMessages = listCommanderMessagesInDisplayOrder(messages);
  const currentMessage = orderedMessages[orderedMessages.length - 1] ?? messages[0];

  if (!currentMessage) {
    throw new Error('Commander message thread must include at least one deterministic message.');
  }

  return {
    currentRoom: input.activeRoom,
    recommendedRoom,
    lifecycleStep: formatCommanderLifecycleStep(input.reportState, missionState),
    commanderQuestion: getCommanderQuestion(input.reportState, missionState),
    currentMessage,
    messages: orderedMessages,
    nextAction,
    secondaryActions: getCommanderSecondaryActions(input.reportState, missionState),
    interruption,
    memory: buildCommanderMemorySurface(input.evidence),
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
}: {
  readonly state: CommanderExperienceState;
  readonly onAcknowledgeInterruption?: ((id: string) => void) | undefined;
  readonly onContinue?: (() => void) | undefined;
  readonly compassSteps?: readonly MissionCompassStep[] | undefined;
  readonly commandChair?: ReactNode;
  readonly situationBoard?: ReactNode;
  readonly workflowSurface?: ReactNode;
}) {
  const [draftTransmission, setDraftTransmission] = useState('');
  const [transmissions, setTransmissions] = useState<string[]>([]);

  function handleTransmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = draftTransmission.trim();
    if (message.length === 0) return;

    setTransmissions((current) => [...current, message]);
    setDraftTransmission('');
  }

  return (
    <section
      className={state.interruption && !state.interruption.acknowledged ? 'commander-shell commander-shell-interrupted' : 'commander-shell'}
      aria-label="Persistent Commander shell"
      data-current-room={state.currentRoom}
      data-recommended-room={state.recommendedRoom}
    >
      <div className="commander-shell-primary">
        <section className="commander-transmission-console" aria-label="Commander transmission channel">
          <div className="commander-transmission-header">
            <p className="section-label">Commander</p>
            <span>{state.lifecycleStep}</span>
          </div>
          <ol className="commander-transmission-feed" aria-label="Commander briefing feed">
            <li className="commander-transmission commander-transmission-incoming">
              <span>Commander</span>
              <p>{state.currentMessage.text}</p>
            </li>
            <li className="commander-transmission commander-transmission-incoming commander-transmission-question">
              <span>Commander</span>
              <p>{state.commanderQuestion}</p>
            </li>
            {transmissions.map((transmission, index) => (
              <li key={`${transmission}-${index}`} className="commander-transmission commander-transmission-outgoing">
                <span>Operator</span>
                <p>{transmission}</p>
              </li>
            ))}
          </ol>
          <div className="commander-next-action" aria-label="Commander next action">
            <p className="section-label">Primary Action</p>
            <strong>{state.nextAction.label}</strong>
            <span>{state.nextAction.description}</span>
            {onContinue ? (
              <button
                type="button"
                className="primary-action commander-continue"
                aria-label={`Continue to ${formatCommanderRoomLabel(state.recommendedRoom)}`}
                disabled={state.nextAction.disabled}
                onClick={onContinue}
              >
                Continue
              </button>
            ) : null}
          </div>
          {workflowSurface ? (
            <div className="commander-workflow-surface" aria-label="Commander workflow controls">
              {workflowSurface}
            </div>
          ) : null}
          <form className="commander-transmission-input" aria-label="Transmit to Commander" onSubmit={handleTransmit}>
            <input
              value={draftTransmission}
              onChange={(event) => setDraftTransmission(event.target.value)}
              placeholder="Transmit a short operational note..."
            />
            <button className="secondary-action" type="submit">Transmit</button>
          </form>
        </section>
      </div>

      {commandChair || situationBoard ? (
        <details className="commander-context-drawer">
          <summary>Commander overview</summary>
          <div className="commander-atmosphere-deck" aria-label="Commander atmosphere deck">
            {commandChair}
            {situationBoard}
          </div>
        </details>
      ) : null}

      {compassSteps ? (
        <details className="commander-context-drawer">
          <summary>Mission compass</summary>
          <MissionCompassPanel steps={compassSteps} />
        </details>
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

  if (missionState === 'idle' || missionState === 'briefing') {
    return {
      id: 'commander-action:enter-ready-room',
      label: 'Enter Ready Room',
      description: 'Prepare the mission before observation begins.',
      disabled: false,
    };
  }

  if (missionState === 'ready' || missionState === 'observation') {
    return {
      id: 'commander-action:begin-observation',
      label: 'Begin Observation',
      description: 'Remain silent and collect evidence before authorization.',
      disabled: false,
    };
  }

  if (missionState === 'authorization' || missionState === 'deployed') {
    return {
      id: 'commander-action:proceed-war-room',
      label: 'Proceed to War Room',
      description: 'Handle authorization and deployment state deliberately.',
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

export function getCommanderRoomTransitionText(missionState?: MissionState | undefined): string {
  if (missionState === undefined) return 'Create Mission.';
  if (missionState === 'idle' || missionState === 'briefing') return 'Proceed to Ready Room.';
  if (missionState === 'ready' || missionState === 'observation') return 'Observation begins. Remain silent.';
  if (missionState === 'authorization' || missionState === 'deployed') return 'War Room unlocked. Authorization required.';
  if (missionState === 'return_to_base') return 'Debrief Theater ready.';
  return 'Archive the mission record.';
}

export function buildCommanderMemorySurface(evidence?: CommanderExperienceEvidence | undefined): CommanderMemorySnippet[] {
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
  ];
}

function buildCommanderMessageThread(
  input: CommanderExperienceInput,
  recommendedRoom: CommanderShellRoomId,
  nextAction: CommanderNextAction,
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
      text: getCommanderStateText(input.reportState, missionState),
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
      text: getCommanderRoomTransitionText(missionState),
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

function getCommanderStateText(reportState: CommanderReportState, missionState?: MissionState | undefined): string {
  if (reportState === 'not-reported') return 'Report for duty. Headquarters is waiting.';
  if (missionState === undefined) return 'No active mission. Create one mission.';
  if (missionState === 'idle' || missionState === 'briefing') return 'Briefing begins with preparation, not motion.';
  if (missionState === 'ready' || missionState === 'observation') return 'Observation is active work. Remain silent.';
  if (missionState === 'authorization' || missionState === 'deployed') return 'War Room authority is active. Stay inside the plan.';
  if (missionState === 'return_to_base') return 'Return complete. Begin behavior-first debrief.';
  return 'Mission complete. Archive the record.';
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
  if (missionState === 'briefing') return 'Has the objective been briefed clearly enough to prepare observation?';
  if (missionState === 'ready') return 'Are you ready to begin observation and remain silent?';
  if (missionState === 'observation') return 'Is the observation complete enough to request authorization?';
  if (missionState === 'authorization') return 'What is the justification, and what would invalidate the mission?';
  if (missionState === 'deployed') return 'Has the authorized plan concluded so we can return to base?';
  if (missionState === 'return_to_base') return 'What behavior occurred, what discipline was kept, and what lesson remains?';
  if (missionState === 'debrief') return 'Is the debrief complete enough to archive as institutional memory?';
  return 'Mission is archived. Do you want to review records or open a new mission?';
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
