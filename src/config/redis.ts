import { createClient, RedisClientType } from 'redis';

export const redis: RedisClientType = createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
  password: process.env.REDIS_PASSWORD || undefined,
});

redis.on('error', (err) => console.error('Redis Client Error', err));

export async function connectRedis(): Promise<void> {
  try {
    await redis.connect();
    await redis.ping();
    console.log('Redis connected successfully');
  } catch (error) {
    console.error('Redis connection failed:', error);
    throw error;
  }
}
