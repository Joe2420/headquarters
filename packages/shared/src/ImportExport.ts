export const HEADQUARTERS_EXPORT_SCHEMA_VERSION = 'headquarters.export.v1';

export interface HeadquartersPortableRecord {
  readonly id: string;
  readonly type: string;
  readonly payload: Readonly<Record<string, unknown>>;
}

export interface HeadquartersExportDocument {
  readonly schemaVersion: typeof HEADQUARTERS_EXPORT_SCHEMA_VERSION;
  readonly exportedAt: string;
  readonly records: readonly HeadquartersPortableRecord[];
}

export interface HeadquartersImportValidationSuccess {
  readonly ok: true;
  readonly document: HeadquartersExportDocument;
}

export interface HeadquartersImportValidationFailure {
  readonly ok: false;
  readonly errors: readonly string[];
}

export type HeadquartersImportValidationResult =
  | HeadquartersImportValidationSuccess
  | HeadquartersImportValidationFailure;

export function createHeadquartersExportDocument(
  records: readonly HeadquartersPortableRecord[],
  options: { exportedAt?: string } = {},
): HeadquartersExportDocument {
  return {
    schemaVersion: HEADQUARTERS_EXPORT_SCHEMA_VERSION,
    exportedAt: options.exportedAt ?? new Date().toISOString(),
    records: records.map(copyPortableRecord).sort(comparePortableRecords),
  };
}

export function validateHeadquartersImport(input: unknown): HeadquartersImportValidationResult {
  const errors: string[] = [];

  if (!isRecord(input)) {
    return {
      ok: false,
      errors: ['Import document must be an object.'],
    };
  }

  if (input.schemaVersion !== HEADQUARTERS_EXPORT_SCHEMA_VERSION) {
    errors.push(`schemaVersion must be ${HEADQUARTERS_EXPORT_SCHEMA_VERSION}.`);
  }

  const exportedAt = readNonEmptyString(input.exportedAt);
  if (exportedAt === undefined) {
    errors.push('exportedAt must be a non-empty string.');
  }

  if (!Array.isArray(input.records)) {
    errors.push('records must be an array.');
  }

  const rawRecords = Array.isArray(input.records) ? input.records : [];
  const records = rawRecords.flatMap((record, index) => validatePortableRecord(record, index, errors));

  if (errors.length > 0) {
    return {
      ok: false,
      errors,
    };
  }

  return {
    ok: true,
    document: createHeadquartersExportDocument(records, {
      exportedAt: exportedAt ?? '',
    }),
  };
}

function validatePortableRecord(
  input: unknown,
  index: number,
  errors: string[],
): HeadquartersPortableRecord[] {
  const startingErrorCount = errors.length;

  if (!isRecord(input)) {
    errors.push(`records[${index}] must be an object.`);
    return [];
  }

  const id = readNonEmptyString(input.id);
  const type = readNonEmptyString(input.type);
  const payload = input.payload;
  const normalizedPayload = isRecord(payload) ? payload : undefined;

  if (id === undefined) {
    errors.push(`records[${index}].id must be a non-empty string.`);
  }

  if (type === undefined) {
    errors.push(`records[${index}].type must be a non-empty string.`);
  }

  if (normalizedPayload === undefined) {
    errors.push(`records[${index}].payload must be an object.`);
  }

  if (errors.length > startingErrorCount) return [];

  return [{
    id: id ?? '',
    type: type ?? '',
    payload: { ...(normalizedPayload ?? {}) },
  }];
}

function copyPortableRecord(record: HeadquartersPortableRecord): HeadquartersPortableRecord {
  return {
    id: record.id,
    type: record.type,
    payload: { ...record.payload },
  };
}

function comparePortableRecords(first: HeadquartersPortableRecord, second: HeadquartersPortableRecord): number {
  const typeComparison = first.type.localeCompare(second.type);
  if (typeComparison !== 0) return typeComparison;
  return first.id.localeCompare(second.id);
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === 'object' && input !== null && !Array.isArray(input);
}

function readNonEmptyString(input: unknown): string | undefined {
  if (typeof input !== 'string') return undefined;

  const trimmed = input.trim();
  if (trimmed.length === 0) return undefined;
  return input;
}
