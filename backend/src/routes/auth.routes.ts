import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db/client';

const router = Router();

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  avatar: z.string().url().optional(),
});

// Create or get user (for OAuth)
router.post('/user', async (req, res) => {
  try {
    const data = createUserSchema.parse(req.body);
    const { email, name, avatar } = data;

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        name,
        avatar: avatar || undefined,
      },
      create: {
        email,
        name,
        avatar: avatar || undefined,
      },
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Error creating/getting user:', error);
    res.status(500).json({ error: 'Failed to create/get user', message: error.message });
  }
});

export default router;