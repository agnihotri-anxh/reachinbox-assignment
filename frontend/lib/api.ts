const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface EmailJob {
  id: string;
  email: string;
  subject: string;
  scheduledTime?: string;
  sentTime?: string;
  status: 'SCHEDULED' | 'PROCESSING' | 'SENT' | 'FAILED';
  errorMessage?: string;
}

export async function createOrGetUser(user: {
  email: string;
  name: string;
  avatar?: string;
}): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/auth/user`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(user),
  });

  if (!response.ok) {
    throw new Error('Failed to create/get user');
  }

  const data = await response.json();
  return data.user;
}

export async function scheduleEmails(
  userId: string,
  data: {
    recipientEmails: string[];
    subject: string;
    body: string;
    scheduledTime: string;
    delayBetweenEmails?: number;
    hourlyLimit?: number;
  }
): Promise<{ success: boolean; jobs: any[]; count: number }> {
  const response = await fetch(`${API_BASE_URL}/emails/schedule`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...data,
      userId,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to schedule emails');
  }

  return response.json();
}

export async function getScheduledEmails(userId: string): Promise<EmailJob[]> {
  const response = await fetch(`${API_BASE_URL}/emails/scheduled?userId=${userId}`);

  if (!response.ok) {
    throw new Error('Failed to fetch scheduled emails');
  }

  const data = await response.json();
  return data.emails;
}

export async function getSentEmails(userId: string): Promise<EmailJob[]> {
  const response = await fetch(`${API_BASE_URL}/emails/sent?userId=${userId}`);

  if (!response.ok) {
    throw new Error('Failed to fetch sent emails');
  }

  const data = await response.json();
  return data.emails;
}