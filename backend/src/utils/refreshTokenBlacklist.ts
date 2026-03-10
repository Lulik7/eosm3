import { createClient, type RedisClientType } from 'redis';

const getRedisUrl = (): string => process.env['REDIS_URL'] ?? 'redis://localhost:6379';

const keyForJti = (jti: string): string => `refresh:blacklist:${jti}`;

let client: RedisClientType | undefined;
let connectPromise: Promise<void> | undefined;

const getClient = (): RedisClientType => {
  if (!client) {
    client = createClient({ url: getRedisUrl() });
    client.on('error', (err: unknown) => console.error('Redis error:', err));
  }
  return client;
};

const ensureConnected = async (): Promise<void> => {
  const c = getClient();
  if (c.isReady) return;
  connectPromise ??= c.connect().then(() => undefined);
  await connectPromise;
};

const ttlSecondsFromExp = (expSecondsSinceEpoch: number): number => {
  const nowSeconds = Math.floor(Date.now() / 1000);
  return expSecondsSinceEpoch - nowSeconds;
};

export const blacklistRefreshJti = async (jti: string, expSecondsSinceEpoch: number): Promise<void> => {
  const ttlSeconds = ttlSecondsFromExp(expSecondsSinceEpoch);
  if (ttlSeconds <= 0) return;

  try {
    await ensureConnected();
    await getClient().set(keyForJti(jti), '1', { EX: ttlSeconds });
  } catch (err) {
    console.error('Redis blacklistRefreshJti failed:', err);
    throw err;
  }
};

export const isRefreshJtiBlacklisted = async (jti: string): Promise<boolean> => {
  try {
    await ensureConnected();
    const exists = await getClient().exists(keyForJti(jti));
    return exists === 1;
  } catch (err) {
    console.error('Redis isRefreshJtiBlacklisted failed:', err);
    return true;
  }
};
