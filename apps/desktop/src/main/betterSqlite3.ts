import { createRequire } from 'node:module';
import type DatabaseDriver from 'better-sqlite3';

const require = createRequire(import.meta.url);
const databaseDriver = require('better-sqlite3') as typeof DatabaseDriver;

export default databaseDriver;
