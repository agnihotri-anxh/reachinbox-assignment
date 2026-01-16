import { Worker, Job } from 'bullmq';
import { redisConnection, redisOptions } from './queue';
import { config } from '../config/env';
import { sendEmail } from '../services/email.service';
import { checkRateLimit, incrementRateLimit, getDelayUntilNextHour } from '../services/rate-limit.service';
import { prisma } from '../db/client';
import { EmailStatus } from '@prisma/client';

interface EmailJobData {
  emailJobId: string;
  recipientEmail: string;
  subject: string;
  body: string;
  scheduledTime: string;
  userId: string;
  senderId?: string;
}

// Track last email send time for delay enforcement
let lastEmailSendTime = 0;

export function createEmailWorker() {
  const worker = new Worker<EmailJobData>(
    config.queue.name,
    async (job: Job<EmailJobData>) => {
      const { emailJobId, recipientEmail, subject, body, userId, senderId } = job.data;

      try {
        // Update status to PROCESSING
        await prisma.emailJob.update({
          where: { id: emailJobId },
          data: { status: EmailStatus.PROCESSING },
        });

        // Check rate limit
        const canSend = await checkRateLimit(senderId);

        if (!canSend) {
          // Rate limit exceeded - reschedule to next hour
          const delay = await getDelayUntilNextHour();
          console.log(`Rate limit exceeded for job ${emailJobId}. Rescheduling in ${delay}ms`);

          await job.moveToDelayed(Date.now() + delay);

          // Update job status back to SCHEDULED
          await prisma.emailJob.update({
            where: { id: emailJobId },
            data: { status: EmailStatus.SCHEDULED },
          });

          return { status: 'rate_limited', rescheduled: true };
        }

        // Enforce minimum delay between emails
        const now = Date.now();
        const timeSinceLastEmail = now - lastEmailSendTime;
        if (timeSinceLastEmail < config.rateLimit.minDelayBetweenEmails) {
          const delayNeeded = config.rateLimit.minDelayBetweenEmails - timeSinceLastEmail;
          console.log(`Enforcing delay of ${delayNeeded}ms for job ${emailJobId}`);
          await new Promise(resolve => setTimeout(resolve, delayNeeded));
        }

        // Send email
        const result = await sendEmail(recipientEmail, subject, body);

        // Increment rate limit counter
        await incrementRateLimit(senderId);
        lastEmailSendTime = Date.now();

        // Update job status to SENT
        await prisma.emailJob.update({
          where: { id: emailJobId },
          data: {
            status: EmailStatus.SENT,
            sentTime: new Date(),
          },
        });

        console.log(`Email sent successfully: ${recipientEmail} (Job ID: ${emailJobId})`);

        return {
          status: 'sent',
          messageId: result.messageId,
          previewUrl: result.previewUrl,
        };
      } catch (error: any) {
        console.error(`Error processing email job ${emailJobId}:`, error);

        // Update job status to FAILED
        await prisma.emailJob.update({
          where: { id: emailJobId },
          data: {
            status: EmailStatus.FAILED,
            errorMessage: error.message || 'Unknown error',
          },
        });

        throw error;
      }
    },
    {
      connection: redisOptions,
      concurrency: config.worker.concurrency,
      limiter: {
        max: config.rateLimit.maxEmailsPerHour,
        duration: 3600000, // 1 hour in milliseconds
      },
    }
  );

  worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, err);
  });

  return worker;
}