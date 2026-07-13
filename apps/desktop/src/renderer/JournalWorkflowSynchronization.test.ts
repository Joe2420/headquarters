import { describe, expect, it } from 'vitest';
import {
  completeJournalWorkflowSharedState,
  saveJournalWorkflowSharedState,
  updateJournalWorkflowFromChat,
  updateJournalWorkflowFromRoom,
  type JournalWorkflowSharedState,
} from './JournalWorkflowSynchronization';

const base: JournalWorkflowSharedState = {
  recordId: 'journal-1',
  activeQuestionId: 'question-1',
  draftText: '',
  savedText: '',
  saveState: 'clean',
  reviewState: 'draft',
  updatedBy: 'system',
  updatedAt: '2026-07-13T00:00:00.000Z',
};

describe('JournalWorkflowSynchronization', () => {
  it('syncs chat answers into the shared room draft', () => {
    const updated = updateJournalWorkflowFromChat(base, {
      answer: 'I waited for evidence.',
      activeQuestionId: 'question-1',
      now: '2026-07-13T00:01:00.000Z',
    });

    expect(updated.draftText).toBe('I waited for evidence.');
    expect(updated.saveState).toBe('dirty');
    expect(updated.activeQuestionId).toBe('question-1');
  });

  it('syncs room edits back to the shared state', () => {
    const updated = updateJournalWorkflowFromRoom(base, {
      draftText: 'Room-written reflection.',
      now: '2026-07-13T00:01:00.000Z',
    });

    expect(updated.updatedBy).toBe('room');
    expect(updated.saveState).toBe('dirty');
  });

  it('does not duplicate the same chat answer', () => {
    const first = updateJournalWorkflowFromChat(base, {
      answer: 'I waited for evidence.',
      activeQuestionId: 'question-1',
      now: '2026-07-13T00:01:00.000Z',
    });
    const second = updateJournalWorkflowFromChat(first, {
      answer: 'I waited for evidence.',
      activeQuestionId: 'question-1',
      now: '2026-07-13T00:02:00.000Z',
    });

    expect(second.draftText).toBe('I waited for evidence.');
  });

  it('marks conflicts when room overwrites newer unsaved chat content', () => {
    const chat = updateJournalWorkflowFromChat(base, {
      answer: 'Chat answer.',
      activeQuestionId: 'question-1',
      now: '2026-07-13T00:01:00.000Z',
    });
    const room = updateJournalWorkflowFromRoom(chat, {
      draftText: 'Room answer.',
      now: '2026-07-13T00:02:00.000Z',
    });

    expect(room.saveState).toBe('conflict');
  });

  it('shares save and review completion state', () => {
    const dirty = updateJournalWorkflowFromRoom(base, {
      draftText: 'Complete reflection.',
      now: '2026-07-13T00:01:00.000Z',
    });

    expect(saveJournalWorkflowSharedState(dirty, '2026-07-13T00:02:00.000Z').saveState).toBe('saved');
    expect(completeJournalWorkflowSharedState(dirty, '2026-07-13T00:02:00.000Z').reviewState).toBe('reviewed');
  });
});
