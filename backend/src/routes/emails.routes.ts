import { Router } from 'express';
import { z } from 'zod';
import { emailQueue } from '../queue/queue';
import { prisma } from '../db/client';
import { EmailStatus } from '@prisma/client';

const router = Router();

const scheduleEmailSchema = z.object({
  recipientEmails: z.array(z.string().email()).min(1),
  subject: z.string().min(1),
  body: z.string().min(1),
  scheduledTime: z.string().datetime(),
  delayBetweenEmails: z.number().int().positive().optional(),
  hourlyLimit: z.number().int().positive().optional(),
  userId: z.string().uuid(),
});

// Schedule emails
router.post('/schedule', async (req, res) => {
  try {
    const data = scheduleEmailSchema.parse(req.body);
    const { recipientEmails, subject, body, scheduledTime, userId } = data;

    const scheduledDateTime = new Date(scheduledTime);
    const now = new Date();

    if (scheduledDateTime < now) {
      return res.status(400).json({ error: 'Scheduled time must be in the future' });
    }

    const createdJobs = [];

    for (const recipientEmail of recipientEmails) {
      // Create email job in database
      const emailJob = await prisma.emailJob.create({
        data: {
          userId,
          recipientEmail,
          subject,
          body,
          scheduledTime: scheduledDateTime,
          status: EmailStatus.SCHEDULED,
        },
      });

      // Calculate delay from now until scheduled time
      const delay = scheduledDateTime.getTime() - now.getTime();

      // Add job to BullMQ queue with delay
      const job = await emailQueue.add(
        `email-${emailJob.id}`,
        {
          emailJobId: emailJob.id,
          recipientEmail,
          subject,
          body,
          scheduledTime: scheduledDateTime.toISOString(),
          userId,
        },
        {
          jobId: emailJob.id, // Use emailJob.id as jobId for idempotency
          delay: delay > 0 ? delay : 0,
        }
      );

      // Update email job with BullMQ job ID
      await prisma.emailJob.update({
        where: { id: emailJob.id },
        data: { jobId: job.id },
      });

      createdJobs.push({
        id: emailJob.id,
        recipientEmail,
        scheduledTime: scheduledDateTime,
        status: emailJob.status,
      });
    }

    res.json({
      success: true,
      jobs: createdJobs,
      count: createdJobs.length,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Error scheduling emails:', error);
    res.status(500).json({ error: 'Failed to schedule emails', message: error.message });
  }
});

// Get scheduled emails
router.get('/scheduled', async (req, res) => {
  try {
    const userId = req.query.userId as string;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const scheduledEmails = await prisma.emailJob.findMany({
      where: {
        userId,
        status: {
          in: [EmailStatus.SCHEDULED, EmailStatus.PROCESSING],
        },
      },
      orderBy: {
        scheduledTime: 'asc',
      },
    });

    res.json({
      success: true,
      emails: scheduledEmails.map((email) => ({
        id: email.id,
        email: email.recipientEmail,
        subject: email.subject,
        scheduledTime: email.scheduledTime,
        status: email.status,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching scheduled emails:', error);
    res.status(500).json({ error: 'Failed to fetch scheduled emails', message: error.message });
  }
});

// Get sent emails
router.get('/sent', async (req, res) => {
  try {
    const userId = req.query.userId as string;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const sentEmails = await prisma.emailJob.findMany({
      where: {
        userId,
        status: {
          in: [EmailStatus.SENT, EmailStatus.FAILED],
        },
      },
      orderBy: {
        sentTime: 'desc',
      },
    });

    res.json({
      success: true,
      emails: sentEmails.map((email) => ({
        id: email.id,
        email: email.recipientEmail,
        subject: email.subject,
        sentTime: email.sentTime,
        status: email.status,
        errorMessage: email.errorMessage,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching sent emails:', error);
    res.status(500).json({ error: 'Failed to fetch sent emails', message: error.message });
  }
});

export default router;