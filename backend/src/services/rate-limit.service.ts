import { redisConnection } from '../queue/queue';
import { config } from '../config/env';

/**
 * Get the current hour timestamp (rounded down to the hour)
 */
function getCurrentHourTimestamp(): number {
  const now = new Date();
  now.setMinutes(0, 0, 0);
  return now.getTime();
}

/**
 * Get the next hour timestamp
 */
function getNextHourTimestamp(): number {
  const now = new Date();
  now.setHours(now.getHours() + 1);
  now.setMinutes(0, 0, 0);
  return now.getTime();
}

/**
 * Get rate limit key for a sender or global
 */
function getRateLimitKey(senderId?: string): string {
  const hourTimestamp = getCurrentHourTimestamp();
  if (senderId) {
    return `rate_limit:hour:${hourTimestamp}:sender:${senderId}`;
  }
  return `rate_limit:hour:${hourTimestamp}:global`;
}

/**
 * Check if we can send an email (rate limit check)
 * Returns true if allowed, false if rate limited
 */
export async function checkRateLimit(senderId?: string): Promise<boolean> {
  const key = getRateLimitKey(senderId);
  const count = await redisConnection.get(key);
  const currentCount = count ? parseInt(count, 10) : 0;
  
  return currentCount < config.rateLimit.maxEmailsPerHour;
}

/**
 * Increment rate limit counter
 */
export async function incrementRateLimit(senderId?: string): Promise<number> {
  const key = getRateLimitKey(senderId);
  const hourTimestamp = getCurrentHourTimestamp();
  const nextHourTimestamp = getNextHourTimestamp();
  const ttl = Math.floor((nextHourTimestamp - hourTimestamp) / 1000); // TTL in seconds
  
  const count = await redisConnection.incr(key);
  await redisConnection.expire(key, ttl);
  
  return count;
}

/**
 * Get current rate limit count
 */
export async function getRateLimitCount(senderId?: string): Promise<number> {
  const key = getRateLimitKey(senderId);
  const count = await redisConnection.get(key);
  return count ? parseInt(count, 10) : 0;
}

/**
 * Calculate delay until next available hour window
 */
export async function getDelayUntilNextHour(): Promise<number> {
  const now = Date.now();
  const nextHour = getNextHourTimestamp();
  return nextHour - now;
}