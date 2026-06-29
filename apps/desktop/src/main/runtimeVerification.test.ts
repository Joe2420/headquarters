import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

interface DesktopPackageManifest {
  main: string;
  scripts: Record<string, string>;
}

function readDesktopPackage(): DesktopPackageManifest {
  return JSON.parse(readFileSync(join(process.cwd(), 'apps/desktop/package.json'), 'utf8')) as DesktopPackageManifest;
}

describe('Desktop runtime launch contract', () => {
  it('keeps Electron pointed at the compiled main-process entry', () => {
    const manifest = readDesktopPackage();

    expect(manifest.main).toBe('dist/main/main.cjs');
    expect(manifest.scripts['build:main']).toBe('vite build --config vite.main.config.ts');
  });

  it('prepares the main process and native SQLite module before launching dev Electron', () => {
    const manifest = readDesktopPackage();
    const devScript = manifest.scripts.dev;

    expect(devScript).toContain('corepack pnpm run build:main');
    expect(devScript).toContain('corepack pnpm run prepare:native');
    expect(devScript).toContain('scripts/launch-electron-dev.mjs');
    expect(devScript).toContain('wait-on http://127.0.0.1:5173');
  });
});
