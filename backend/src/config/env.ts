import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  databaseUrl: process.env.DATABASE_URL || '',
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },
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