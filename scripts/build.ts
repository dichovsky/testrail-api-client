/** Cross-platform production build shared by development and package smoke. */
import { rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
rmSync(join(root, 'dist'), { recursive: true, force: true });
const result = spawnSync(process.execPath, ['node_modules/@typescript/native/bin/tsc', '-p', 'tsconfig.prod.json'], {
    cwd: root,
    stdio: 'inherit',
});
if (result.error !== undefined) throw result.error;
process.exitCode = result.status ?? 1;
