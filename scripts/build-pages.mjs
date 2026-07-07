import { spawn } from 'node:child_process';
import { unlink, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const envFile = fileURLToPath(new URL('../.env.pages', import.meta.url));
const viteCli = fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url));
let createdEnvFile = false;

try {
  await writeFile(envFile, 'VITE_DEMO_BANNER=1\n', { flag: 'wx' });
  createdEnvFile = true;

  const exitCode = await new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [viteCli, 'build', '--mode', 'pages', '--base=/cloakscan/'],
      { stdio: 'inherit' },
    );
    child.once('error', reject);
    child.once('close', resolve);
  });

  if (exitCode !== 0) process.exitCode = Number(exitCode ?? 1);
} finally {
  if (createdEnvFile) await unlink(envFile);
}
