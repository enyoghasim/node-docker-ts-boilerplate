import Redis from 'ioredis';

export const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT!) || 6379,
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
});

export async function connectRedis(): Promise<void> {
  try {
    await redis.ping();
    console.log('Redis connected successfully');
  } catch (error) {
    console.error('Redis connection failed:', error);
    throw error;
  }
}
