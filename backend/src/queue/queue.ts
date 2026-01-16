import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { config } from '../config/env';

export const redisOptions = {
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  maxRetriesPerRequest: null,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  enableReadyCheck: false,
  enableOfflineQueue: true,
  lazyConnect: true,
};

export const redisConnection = new Redis(redisOptions);

redisConnection.on('error', (err) => {
  console.log('❌ Redis connection error:', err.message);
});

redisConnection.on('connect', () => {
  console.log('✅ Redis connected');
});

export const emailQueue = new Queue(config.queue.name, {
  connection: redisOptions,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      age: 24 * 3600, // Keep completed jobs for 24 hours
      count: 1000,
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // Keep failed jobs for 7 days
    },
  },
});