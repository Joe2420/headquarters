import {
  type JournalRecord,
  type JournalRecordType,
  copyJournalRecord,
  createJournalRecord,
} from './JournalRecord';
import type { JournalReflectionAnswer, JournalReflectionMode } from './JournalReflectionProtocol';
import type { JournalKnowledgeExtractionResult } from './JournalKnowledgeExtractionEngine';

export interface JournalWorkflowPersistedState {
  readonly record: JournalRecord;
  readonly reflectionMode?: JournalReflectionMode | undefined;
  readonly activeQuestionId?: string | undefined;
  readonly answers: readonly JournalReflectionAnswer[];
  readonly extraction?: JournalKnowledgeExtractionResult | undefined;
  readonly returnContext?: string | undefined;
}

export interface JournalWorkflowRepository {
  save(state: JournalWorkflowPersistedState): Promise<JournalWorkflowPersistedState>;
  get(journalId: string): Promise<JournalWorkflowPersistedState | undefined>;
  list(): Promise<readonly JournalWorkflowPersistedState[]>;
}

export class InMemoryJournalWorkflowRepository implements JournalWorkflowRepository {
  readonly #records = new Map<string, JournalWorkflowPersistedState>();

  async save(state: JournalWorkflowPersistedState): Promise<JournalWorkflowPersistedState> {
    this.#records.set(state.record.journalId, copyState(state));
    return copyState(state);
  }

  async get(journalId: string): Promise<JournalWorkflowPersistedState | undefined> {
    const state = this.#records.get(journalId);
    return state ? copyState(state) : undefined;
  }

  async list(): Promise<readonly JournalWorkflowPersistedState[]> {
    return [...this.#records.values()]
      .map(copyState)
      .sort((left, right) => left.record.createdAt.localeCompare(right.record.createdAt));
  }
}

export interface LegacyJournalRecordInput {
  readonly id: string;
  readonly entryDate: string;
  readonly rawContent: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly source?: string | undefined;
  readonly missionId?: string | undefined;
}

export function migrateLegacyJournalRecord(input: LegacyJournalRecordInput): JournalRecord {
  return createJournalRecord({
    journalId: input.id,
    recordType: inferLegacyRecordType(input),
    title: input.entryDate,
    rawContent: input.rawContent,
    createdAt: input.createdAt,
    author: 'legacy-import',
    source: 'imported_legacy_record',
    ...(input.missionId ? { missionId: input.missionId } : {}),
    reviewState: 'recorded',
    immutableSourceMetadata: {
      legacySource: input.source ?? 'unknown',
      legacyUpdatedAt: input.updatedAt,
      unresolvedLegacyFields: input.missionId ? 'none' : 'mission link unknown',
    },
  });
}

function inferLegacyRecordType(input: LegacyJournalRecordInput): JournalRecordType {
  const normalized = input.rawContent.toLowerCase();
  if (normalized.includes('trade')) return 'trade_review';
  if (normalized.includes('reflection')) return 'daily_reflection';
  return 'raw_entry';
}

function copyState(state: JournalWorkflowPersistedState): JournalWorkflowPersistedState {
  return {
    record: copyJournalRecord(state.record),
    ...(state.reflectionMode ? { reflectionMode: state.reflectionMode } : {}),
    ...(state.activeQuestionId ? { activeQuestionId: state.activeQuestionId } : {}),
    answers: state.answers.map((answer) => ({ ...answer })),
    ...(state.extraction ? {
      extraction: {
        ...state.extraction,
        items: state.extraction.items.map((item) => ({ ...item })),
      },
    } : {}),
    ...(state.returnContext ? { returnContext: state.returnContext } : {}),
  };
}
