const crypto = require('crypto');
const net = require('net');
const { spawnSync } = require('child_process');

const isWindows = process.platform === 'win32';
const npxBin = isWindows ? 'npx.cmd' : 'npx';

const run = (command, args, options = {}) => {
  const commandOptions =
    command === npxBin && isWindows
      ? {
          shell: true,
        }
      : {};

  const result = spawnSync(command, args, {
    stdio: 'inherit',
    ...commandOptions,
    ...options,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed with exit code ${result.status}`);
  }
};

const runQuiet = (command, args, options = {}) =>
  spawnSync(command, args, {
    stdio: 'ignore',
    ...(command === npxBin && isWindows ? { shell: true } : {}),
    ...options,
  });

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getAvailablePort = () =>
  new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        reject(new Error('Unable to determine free port'));
        return;
      }

      const { port } = address;
      server.close((err) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(port);
      });
    });
  });

const waitForPostgres = async (containerName, user, database) => {
  for (let attempt = 1; attempt <= 40; attempt += 1) {
    const result = runQuiet('docker', ['exec', containerName, 'pg_isready', '-U', user, '-d', database]);
    if (result.status === 0) {
      return;
    }

    await wait(1000);
  }

  throw new Error('Timed out waiting for PostgreSQL test container');
};

const createTestEnv = (databaseUrl) => ({
  ...process.env,
  NODE_ENV: 'test',
  DATABASE_URL: databaseUrl,
  JWT_SECRET: 'campaign-hub-test-secret-1234567890',
  JWT_REFRESH_SECRET: 'campaign-hub-test-refresh-secret-1234567890',
  JWT_EXPIRES_IN: '15m',
  JWT_REFRESH_EXPIRES_IN: '7d',
  CORS_ORIGIN: 'http://localhost:4200',
  FRONTEND_URL: 'http://localhost:4200',
  REDIS_URL: 'redis://127.0.0.1:6399',
});

async function main() {
  const jestArgs = process.argv.slice(2);
  const extraJestArgs = jestArgs.length > 0 ? jestArgs : ['--runInBand'];

  const useExistingDb = process.env.CAMPAIGN_HUB_USE_EXISTING_TEST_DB === '1' && process.env.DATABASE_URL;
  let containerName = null;
  let databaseUrl = process.env.DATABASE_URL || '';

  if (!useExistingDb) {
    const suffix = crypto.randomBytes(4).toString('hex');
    const dbUser = `test_user_${suffix}`;
    const dbPassword = `test_pass_${suffix}`;
    const dbName = `campaign_hub_test_${suffix}`;
    const dbPort = await getAvailablePort();
    containerName = `campaign-hub-test-db-${suffix}`;
    databaseUrl = `postgresql://${dbUser}:${dbPassword}@127.0.0.1:${dbPort}/${dbName}?schema=public`;

    run('docker', [
      'run',
      '--rm',
      '--detach',
      '--name',
      containerName,
      '--publish',
      `${dbPort}:5432`,
      '--env',
      `POSTGRES_USER=${dbUser}`,
      '--env',
      `POSTGRES_PASSWORD=${dbPassword}`,
      '--env',
      `POSTGRES_DB=${dbName}`,
      'postgres:15-alpine',
    ]);

    await waitForPostgres(containerName, dbUser, dbName);
  }

  const env = createTestEnv(databaseUrl);

  try {
    run(npxBin, ['prisma', 'migrate', 'deploy'], { env });
    run(npxBin, ['jest', ...extraJestArgs], { env });
  } finally {
    if (containerName) {
      runQuiet('docker', ['rm', '-f', containerName]);
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
