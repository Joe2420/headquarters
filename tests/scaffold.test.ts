import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('repository scaffold', () => {
  it('tracks applied SQLite migrations', () => {
    const migration = readFileSync(resolve('packages/database/migrations/001_initial.sql'), 'utf8');

    expect(migration).toContain('CREATE TABLE IF NOT EXISTS schema_migrations');
    expect(migration).toContain('001_initial');
  });
});