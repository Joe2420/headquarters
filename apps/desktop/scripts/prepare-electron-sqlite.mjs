import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { rebuild } from '@electron/rebuild';

const require = createRequire(import.meta.url);
const desktopRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(desktopRoot, '..', '..');
const nativeRoot = path.join(desktopRoot, '.electron-native');
const markerPath = path.join(nativeRoot, '.better-sqlite3-electron.json');
const nativePackageJsonPath = path.join(nativeRoot, 'package.json');
const nativeBindingPath = path.join(nativeRoot, 'node_modules', 'better-sqlite3', 'build', 'Release', 'better_sqlite3.node');

const electronVersion = require('electron/package.json').version;
const betterSqlite3Version = require('better-sqlite3/package.json').version;
const marker = {
  arch: process.arch,
  betterSqlite3Version,
  electronVersion,
  platform: process.platform,
};

function readMarker() {
  if (!existsSync(markerPath)) {
    return null;
  }

  return JSON.parse(readFileSync(markerPath, 'utf8'));
}

function markerMatches(existingMarker) {
  return (
    existingMarker?.arch === marker.arch &&
    existingMarker?.betterSqlite3Version === marker.betterSqlite3Version &&
    existingMarker?.electronVersion === marker.electronVersion &&
    existingMarker?.platform === marker.platform
  );
}

function writeNativePackageJson() {
  mkdirSync(nativeRoot, { recursive: true });
  writeFileSync(
    nativePackageJsonPath,
    `${JSON.stringify(
      {
        private: true,
        dependencies: {
          'better-sqlite3': betterSqlite3Version,
        },
      },
      null,
      2,
    )}\n`,
  );
}

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const corepackCommand = process.platform === 'win32' ? 'corepack.cmd' : 'corepack';

function verifyWorkspaceNodeBinding() {
  execFileSync(
    process.execPath,
    [
      '-e',
      "const Database=require(require.resolve('better-sqlite3',{paths:['packages/database']})); const db=new Database(':memory:'); db.close();",
    ],
    {
      cwd: repoRoot,
      stdio: 'ignore',
    },
  );
}

function repairWorkspaceNodeBindingIfNeeded() {
  try {
    verifyWorkspaceNodeBinding();
  } catch {
    execFileSync(corepackCommand, ['pnpm', '--filter', '@headquarters/database', 'rebuild', 'better-sqlite3'], {
      cwd: repoRoot,
      stdio: 'inherit',
    });
    verifyWorkspaceNodeBinding();
  }
}

if (existsSync(nativeBindingPath) && markerMatches(readMarker())) {
  repairWorkspaceNodeBindingIfNeeded();
  console.log(`better-sqlite3 Electron native binding already prepared for Electron ${electronVersion}.`);
  process.exit(0);
}

writeNativePackageJson();

execFileSync(npmCommand, ['install', '--prefix', nativeRoot, '--no-package-lock', '--omit=dev'], {
  stdio: 'inherit',
});

await rebuild({
  buildPath: nativeRoot,
  electronVersion,
  force: true,
  onlyModules: ['better-sqlite3'],
  projectRootPath: nativeRoot,
});

if (!existsSync(nativeBindingPath)) {
  throw new Error(`Expected Electron native binding was not created: ${nativeBindingPath}`);
}

repairWorkspaceNodeBindingIfNeeded();
writeFileSync(markerPath, `${JSON.stringify(marker, null, 2)}\n`);
console.log(`Prepared better-sqlite3 Electron native binding for Electron ${electronVersion}.`);
