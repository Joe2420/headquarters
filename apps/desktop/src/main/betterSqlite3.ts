import { createRequire } from 'node:module';
import type DatabaseDriver from 'better-sqlite3';
import type Database from 'better-sqlite3';

const require = createRequire(import.meta.url);
const databaseDriver = require('better-sqlite3') as typeof DatabaseDriver;

type DatabaseOptions = Database.Options;

function withElectronNativeBinding(options?: DatabaseOptions): DatabaseOptions | undefined {
  const nativeBinding = process.env['HEADQUARTERS_ELECTRON_SQLITE_BINDING'];

  if (!nativeBinding) {
    return options;
  }

  return {
    ...options,
    nativeBinding,
  };
}

const desktopDatabaseDriver = function createDesktopDatabase(
  this: Database.Database | undefined,
  filename?: string | Buffer,
  options?: DatabaseOptions,
) {
  const driverOptions = withElectronNativeBinding(options);

  if (new.target) {
    return new databaseDriver(filename, driverOptions);
  }

  return databaseDriver(filename as string | undefined, driverOptions);
} as typeof DatabaseDriver;

Object.setPrototypeOf(desktopDatabaseDriver, databaseDriver);
desktopDatabaseDriver.prototype = databaseDriver.prototype;

export default desktopDatabaseDriver;
