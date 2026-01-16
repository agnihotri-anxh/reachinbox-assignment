import express from 'express';
import cors from 'cors';
import { config } from './config/env';
import emailRoutes from './routes/emails.routes';
import authRoutes from './routes/auth.routes';
import { createEmailWorker } from './queue/worker';
import { redisConnection } from './queue/queue';

const app = express();

// Middleware
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/emails', emailRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📧 Email queue: ${config.queue.name}`);
  console.log(`⚙️  Worker concurrency: ${config.worker.concurrency}`);
  console.log(`⏱️  Min delay between emails: ${config.rateLimit.minDelayBetweenEmails}ms`);
  console.log(`📊 Max emails per hour: ${config.rateLimit.maxEmailsPerHour}`);

  // Connect to Redis with retry (non-blocking)
  const connectRedis = async () => {
    try {
      await redisConnection.connect();
      console.log('✅ Connected to Redis');
      
      // Start email worker only after Redis is ready
      const worker = createEmailWorker();
      console.log('✅ Email worker started');
    } catch (error) {
      console.error('Failed to connect to Redis, retrying...', error);
      // Retry after 5 seconds
      setTimeout(connectRedis, 5000);
    }
  };

  // Don't block startup on Redis
  connectRedis().catch(() => {
    console.warn('⚠️  Running without email queue - Redis unavailable');
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    try {
      await redisConnection.quit();
    } catch (error) {
      console.error('Error closing Redis:', error);
    }
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully...');
    try {
      await redisConnection.quit();
    } catch (error) {
      console.error('Error closing Redis:', error);
    }
    process.exit(0);
  });
});