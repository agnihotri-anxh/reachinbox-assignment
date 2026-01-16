import dotenv from 'dotenv';

dotenv.config();

// Parse Redis URL if provided (for Render.com and other platforms)
const parseRedisUrl = () => {
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    try {
      const url = new URL(redisUrl);
      return {
        host: url.hostname,
        port: parseInt(url.port || '6379', 10),
        password: url.password || undefined,
      };
    } catch (error) {
      console.error('Invalid REDIS_URL format:', error);
    }
  }
  
  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  };
};

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  databaseUrl: process.env.DATABASE_URL || '',
  redis: parseRedisUrl(),
  queue: {
    name: process.env.QUEUE_NAME || 'email-queue',
  },
  email: {
    etherealUser: process.env.ETHEREAL_USER || '',
    etherealPass: process.env.ETHEREAL_PASS || '',
  },
  rateLimit: {
    maxEmailsPerHour: parseInt(process.env.MAX_EMAILS_PER_HOUR || '200', 10),
    minDelayBetweenEmails: parseInt(process.env.MIN_DELAY_BETWEEN_EMAILS_MS || '2000', 10),
  },
  worker: {
    concurrency: parseInt(process.env.WORKER_CONCURRENCY || '5', 10),
  },
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
};