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
app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📧 Email queue: ${config.queue.name}`);
  console.log(`⚙️  Worker concurrency: ${config.worker.concurrency}`);
  console.log(`⏱️  Min delay between emails: ${config.rateLimit.minDelayBetweenEmails}ms`);
  console.log(`📊 Max emails per hour: ${config.rateLimit.maxEmailsPerHour}`);

  // Connect to Redis with retry
  try {
    await redisConnection.connect();
    console.log('✅ Connected to Redis');
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
  }

  // Start email worker
  const worker = createEmailWorker();
  console.log('✅ Email worker started');

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    await redisConnection.quit();
    await worker.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully...');
    await redisConnection.quit();
    await worker.close();
    process.exit(0);
  });
});