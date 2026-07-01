import { describe, expect, it } from 'vitest';
import {
  HEADQUARTERS_EXPORT_SCHEMA_VERSION,
  createHeadquartersExportDocument,
  validateHeadquartersImport,
  type HeadquartersPortableRecord,
} from './ImportExport';

describe('Headquarters import/export contract', () => {
  it('creates deterministic export documents with copied sorted records', () => {
    const records: HeadquartersPortableRecord[] = [
      {
        id: 'journal-002',
        type: 'journal.entry',
        payload: {
          title: 'Second',
        },
      },
      {
        id: 'mission-001',
        type: 'mission.record',
        payload: {
          title: 'First',
        },
      },
      {
        id: 'journal-001',
        type: 'journal.entry',
        payload: {
          title: 'First',
        },
      },
    ];

    const document = createHeadquartersExportDocument(records, {
      exportedAt: '2026-07-01T00:00:00.000Z',
    });

    expect(document).toEqual({
      schemaVersion: HEADQUARTERS_EXPORT_SCHEMA_VERSION,
      exportedAt: '2026-07-01T00:00:00.000Z',
      records: [
        {
          id: 'journal-001',
          type: 'journal.entry',
          payload: {
            title: 'First',
          },
        },
        {
          id: 'journal-002',
          type: 'journal.entry',
          payload: {
            title: 'Second',
          },
        },
        {
          id: 'mission-001',
          type: 'mission.record',
          payload: {
            title: 'First',
          },
        },
      ],
    });
    expect(document.records).not.toBe(records);
    expect(document.records[0]?.payload).not.toBe(records[2]?.payload);
  });

  it('validates import documents safely and returns deterministic copies', () => {
    const result = validateHeadquartersImport({
      schemaVersion: HEADQUARTERS_EXPORT_SCHEMA_VERSION,
      exportedAt: '2026-07-01T00:00:00.000Z',
      records: [{
        id: 'record-001',
        type: 'mission.record',
        payload: {
          title: 'Foundation',
        },
      }],
    });

    expect(result).toEqual({
      ok: true,
      document: {
        schemaVersion: HEADQUARTERS_EXPORT_SCHEMA_VERSION,
        exportedAt: '2026-07-01T00:00:00.000Z',
        records: [{
          id: 'record-001',
          type: 'mission.record',
          payload: {
            title: 'Foundation',
          },
        }],
      },
    });
  });

  it('returns clear import errors without throwing', () => {
    expect(validateHeadquartersImport(null)).toEqual({
      ok: false,
      errors: ['Import document must be an object.'],
    });

    expect(validateHeadquartersImport({
      schemaVersion: 'wrong',
      exportedAt: '',
      records: [{
        id: '',
        type: '',
        payload: [],
      }],
    })).toEqual({
      ok: false,
      errors: [
        'schemaVersion must be headquarters.export.v1.',
        'exportedAt must be a non-empty string.',
        'records[0].id must be a non-empty string.',
        'records[0].type must be a non-empty string.',
        'records[0].payload must be an object.',
      ],
    });
  });
});
