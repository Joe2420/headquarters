export interface JournalWorkflowSharedState {
  readonly recordId?: string | undefined;
  readonly activeQuestionId?: string | undefined;
  readonly draftText: string;
  readonly savedText: string;
  readonly saveState: 'clean' | 'dirty' | 'saving' | 'saved' | 'conflict';
  readonly reviewState: string;
  readonly updatedBy: 'chat' | 'room' | 'system';
  readonly updatedAt: string;
}

export function updateJournalWorkflowFromChat(
  state: JournalWorkflowSharedState,
  input: { readonly answer: string; readonly activeQuestionId: string; readonly now: string },
): JournalWorkflowSharedState {
  return {
    ...state,
    activeQuestionId: input.activeQuestionId,
    draftText: appendAnswer(state.draftText, input.answer),
    saveState: 'dirty',
    updatedBy: 'chat',
    updatedAt: input.now,
  };
}

export function updateJournalWorkflowFromRoom(
  state: JournalWorkflowSharedState,
  input: { readonly draftText: string; readonly now: string },
): JournalWorkflowSharedState {
  if (state.updatedBy === 'chat' && state.saveState === 'dirty' && input.draftText !== state.draftText) {
    return {
      ...state,
      saveState: 'conflict',
      updatedBy: 'room',
      updatedAt: input.now,
    };
  }
  return {
    ...state,
    draftText: input.draftText,
    saveState: input.draftText === state.savedText ? 'clean' : 'dirty',
    updatedBy: 'room',
    updatedAt: input.now,
  };
}

export function saveJournalWorkflowSharedState(
  state: JournalWorkflowSharedState,
  now: string,
): JournalWorkflowSharedState {
  return {
    ...state,
    savedText: state.draftText,
    saveState: 'saved',
    updatedBy: 'system',
    updatedAt: now,
  };
}

export function completeJournalWorkflowSharedState(
  state: JournalWorkflowSharedState,
  now: string,
): JournalWorkflowSharedState {
  return {
    ...saveJournalWorkflowSharedState(state, now),
    reviewState: 'reviewed',
  };
}

function appendAnswer(existing: string, answer: string): string {
  const normalized = answer.trim();
  if (!normalized) return existing;
  if (!existing.trim()) return normalized;
  if (existing.includes(normalized)) return existing;
  return `${existing.trim()}\n\n${normalized}`;
}
