/*
 * Run E2E tests by starting the Next.js dev server.
 */

const { spawn } = require('child_process');
const path = require('path');

const port = process.env.TEST_PORT || '5288';
const baseUrl = process.env.TEST_BASE_URL || `http://localhost:${port}`;
const root = process.cwd();

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForReady(serverProcess, timeoutMs = 60000) {
  const start = Date.now();

  return new Promise((resolve, reject) => {
    const onData = (data) => {
      const text = data.toString();
      process.stdout.write(text);
      if (text.includes('ready - started server') || text.includes('Ready in')) {
        cleanup();
        resolve();
      }
    };

    const onError = (data) => {
      process.stderr.write(data.toString());
    };

    const interval = setInterval(() => {
      if (Date.now() - start > timeoutMs) {
        cleanup();
        reject(new Error('Server start timeout'));
      }
    }, 1000);

    const cleanup = () => {
      clearInterval(interval);
      serverProcess.stdout.off('data', onData);
      serverProcess.stderr.off('data', onError);
    };

    serverProcess.stdout.on('data', onData);
    serverProcess.stderr.on('data', onError);
  });
}

async function main() {
  console.log(`Starting dev server on ${baseUrl}...`);

  const server = spawn(`${npmCmd} run dev -- -p ${port}`, {
    cwd: root,
    env: {
      ...process.env,
      PORT: port,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
  });

  let exitCode = 1;

  try {
    await waitForReady(server);

    const testProcess = spawn(process.execPath, [path.join(root, 'scripts', 'e2e-tests.js')], {
      cwd: root,
      env: {
        ...process.env,
        TEST_BASE_URL: baseUrl,
      },
      stdio: 'inherit',
    });

    exitCode = await new Promise((resolve) => {
      testProcess.on('exit', (code) => resolve(code ?? 1));
    });
  } catch (error) {
    console.error(error?.message || error);
    exitCode = 1;
  } finally {
    console.log('Stopping dev server...');
    server.kill();
    await wait(1500);
  }

  process.exit(exitCode);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
