# ReachInbox - Email Job Scheduler

A production-grade email scheduler service with a modern dashboard, built with TypeScript, Express.js, Next.js, BullMQ, and PostgreSQL. This system reliably schedules and sends emails at scale with rate limiting, concurrency control, and persistence across server restarts.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose (for PostgreSQL and Redis)
- Google Cloud Console account (for OAuth)

### 1. Start Infrastructure Services

```bash
# Start PostgreSQL and Redis using Docker
docker-compose up -d
```

This will start:
- PostgreSQL on port `5432`
- Redis on port `6379`

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file (see Environment Variables section below)
cp .env.example .env

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

Backend will run on `http://localhost:3001`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local file (see Environment Variables section below)
cp .env.example .env.local

# Start development server
npm run dev
```

Frontend will run on `http://localhost:3000`

## 📋 Environment Variables

### Backend (`backend/.env`)

```env
# Server Configuration
PORT=3001
FRONTEND_URL=http://localhost:3000

# Database (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/reachinbox?schema=public"

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# BullMQ Queue Configuration
QUEUE_NAME=email-queue

# Email Configuration (Ethereal Email)
# Leave empty for auto-generation on first run
ETHEREAL_USER=
ETHEREAL_PASS=

# Rate Limiting & Concurrency
MAX_EMAILS_PER_HOUR=200
MIN_DELAY_BETWEEN_EMAILS_MS=2000
WORKER_CONCURRENCY=5

# Google OAuth (for reference, actual OAuth handled by frontend)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Frontend (`frontend/.env.local`)

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-random-secret-here

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### Setting Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable "Google+ API"
4. Navigate to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Application type: **Web application**
6. **Authorized JavaScript origins**: `http://localhost:3000`
7. **Authorized redirect URIs**: `http://localhost:3000/api/auth/callback/google`
8. Copy the Client ID and Client Secret to both backend and frontend `.env` files

### Generating NEXTAUTH_SECRET

```bash
# Using OpenSSL
openssl rand -base64 32

# Or use an online generator
# https://generate-secret.vercel.app/32
```

### Ethereal Email Setup

Ethereal Email credentials are **automatically generated** on the first backend run. Check the console output for:

```
Ethereal Email credentials created:
User: [generated-user]
Pass: [generated-password]
```

You can optionally add these to your `.env` file to reuse the same account, or leave them empty to generate new credentials each time.

## 🏗️ Architecture Overview

### System Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Frontend  │──────▶│   Backend    │──────▶│  PostgreSQL │
│  (Next.js)  │  API  │  (Express)  │  ORM  │  (Prisma)   │
└─────────────┘      └──────┬───────┘      └─────────────┘
                             │
                             │ Queue
                             ▼
                        ┌─────────────┐
                        │    Redis    │
                        │   (BullMQ)  │
                        └──────┬──────┘
                               │
                               ▼
                        ┌─────────────┐
                        │   Worker    │
                        │  (BullMQ)   │
                        └──────┬──────┘
                               │
                               ▼
                        ┌─────────────┐
                        │   Ethereal  │
                        │    Email    │
                        └─────────────┘
```

### How Scheduling Works

1. **Email Scheduling Request**
   - Frontend sends email scheduling request to `POST /api/emails/schedule`
   - Backend validates input (recipients, subject, body, scheduled time)
   - For each recipient, creates an `EmailJob` record in PostgreSQL
   - Calculates delay from current time to scheduled time
   - Adds job to BullMQ queue with calculated delay

2. **Job Processing**
   - BullMQ automatically processes jobs when their delay expires
   - Worker picks up jobs based on concurrency settings
   - Each job goes through:
     - Rate limit check (Redis-backed)
     - Delay enforcement (minimum time between emails)
     - Email sending via Ethereal SMTP
     - Status update in database

3. **Rate Limiting**
   - Uses Redis counters keyed by hour window: `rate_limit:hour:{timestamp}:global`
   - When limit exceeded, job is rescheduled to next hour window
   - Preserves order and prevents job loss

### Persistence on Restart

The system ensures **zero data loss** and **no duplicate sends** on server restart:

1. **Database Persistence**
   - All email jobs stored in PostgreSQL with status tracking
   - Job status: `SCHEDULED`, `PROCESSING`, `SENT`, `FAILED`

2. **Redis Persistence**
   - BullMQ stores job queue in Redis
   - Jobs with delays are persisted in Redis
   - On restart, BullMQ automatically resumes processing delayed jobs

3. **Idempotency**
   - Each job uses `emailJob.id` as BullMQ `jobId`
   - Prevents duplicate job creation
   - Database tracks BullMQ job ID for reference

4. **Worker Recovery**
   - Worker automatically reconnects to Redis on restart
   - Picks up pending jobs from queue
   - Continues processing from where it left off

### Rate Limiting & Concurrency Implementation

#### Rate Limiting

**Implementation**: Redis-backed counters with hourly windows

- **Key Format**: `rate_limit:hour:{hourTimestamp}:global` or `rate_limit:hour:{hourTimestamp}:sender:{senderId}`
- **Counter**: Incremented per email sent, expires after 1 hour
- **Limit Check**: Before sending, checks if current count < `MAX_EMAILS_PER_HOUR`
- **Exceeded Behavior**: Job rescheduled to next hour window using `job.moveToDelayed()`
- **Multi-Worker Safe**: Redis atomic operations ensure consistency across instances

**Configuration**:
- `MAX_EMAILS_PER_HOUR`: Default 200 (configurable via env)
- Supports global or per-sender limits

#### Concurrency Control

**Implementation**: BullMQ worker concurrency + custom delay enforcement

1. **Worker-Level Concurrency**
   - Configured via `WORKER_CONCURRENCY` (default: 5)
   - BullMQ manages parallel job processing
   - Safe for multiple workers/instances

2. **Email-Level Delay**
   - Minimum delay between individual emails: `MIN_DELAY_BETWEEN_EMAILS_MS` (default: 2000ms)
   - Enforced in worker logic before sending
   - Prevents provider throttling issues

3. **BullMQ Limiter**
   - Additional limiter configured at worker level
   - `max: MAX_EMAILS_PER_HOUR`, `duration: 3600000ms`
   - Provides secondary rate limiting layer

**Behavior Under Load**:
- 1000+ emails scheduled simultaneously: Queued and processed respecting rate limits
- Rate limit exceeded: Jobs automatically rescheduled to next available hour
- Order preservation: Jobs maintain relative order within hour windows

## ✨ Features Implemented

### Backend Features

#### ✅ Core Scheduler
- [x] Email scheduling API (`POST /api/emails/schedule`)
- [x] BullMQ delayed jobs (no cron)
- [x] PostgreSQL storage with Prisma ORM
- [x] Ethereal Email SMTP integration
- [x] Job status tracking (SCHEDULED, PROCESSING, SENT, FAILED)

#### ✅ Persistence & Reliability
- [x] Survives server restarts without data loss
- [x] Jobs persist in Redis + PostgreSQL
- [x] Automatic job recovery on restart
- [x] Idempotency (prevents duplicate sends)
- [x] Job retry mechanism (3 attempts with exponential backoff)

#### ✅ Rate Limiting & Concurrency
- [x] Redis-backed hourly rate limiting
- [x] Configurable `MAX_EMAILS_PER_HOUR`
- [x] Per-sender rate limiting support
- [x] Automatic rescheduling when limit exceeded
- [x] Configurable worker concurrency (`WORKER_CONCURRENCY`)
- [x] Minimum delay between emails (`MIN_DELAY_BETWEEN_EMAILS_MS`)
- [x] Multi-worker/instance safe

#### ✅ API Endpoints
- [x] `POST /api/emails/schedule` - Schedule emails
- [x] `GET /api/emails/scheduled?userId={id}` - Get scheduled emails
- [x] `GET /api/emails/sent?userId={id}` - Get sent emails
- [x] `POST /api/auth/user` - Create/get user (OAuth)
- [x] `GET /health` - Health check

### Frontend Features

#### ✅ Authentication
- [x] Google OAuth login (NextAuth.js)
- [x] User session management
- [x] Protected routes
- [x] User profile display (name, email, avatar)
- [x] Logout functionality

#### ✅ Dashboard
- [x] Sidebar navigation with user profile
- [x] CORE section (Scheduled/Sent tabs with counts)
- [x] Top bar with search functionality
- [x] Responsive layout matching Figma design

#### ✅ Compose Email
- [x] Compose modal with all required fields
- [x] CSV file upload for email lists
- [x] Email parsing and display (tag pills)
- [x] Subject and body fields
- [x] Rich text editor toolbar
- [x] Delay between emails configuration
- [x] Hourly limit configuration
- [x] Send Later popup with date/time picker
- [x] Suggested time options (Tomorrow 10 AM, 11 AM, 3 PM)

#### ✅ Email Views
- [x] Scheduled emails list
  - Email address, subject, scheduled time, status
  - Loading states
  - Empty states
- [x] Sent emails list
  - Email address, subject, sent time, status
  - Error messages for failed emails
  - Loading states
  - Empty states

#### ✅ UX Features
- [x] Loading indicators
- [x] Empty states
- [x] Error handling with user-friendly messages
- [x] Auto-refresh (every 5 seconds)
- [x] Clean, modern UI matching Figma design
- [x] TypeScript throughout
- [x] Reusable components

## 📁 Project Structure

```
reachinbox-assignment/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuration (env.ts)
│   │   ├── db/              # Database client (Prisma)
│   │   ├── queue/           # BullMQ queue & worker
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic (email, rate-limit)
│   │   └── index.ts         # Express server entry
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   └── package.json
├── frontend/
│   ├── app/
│   │   ├── api/
│   │   │   └── auth/        # NextAuth routes
│   │   ├── components/      # React components
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx        # Main page
│   ├── components/          # Shared components
│   ├── lib/                 # Utilities & API client
│   └── package.json
├── docker-compose.yml       # PostgreSQL & Redis
└── README.md
```

## 🧪 Testing the System

1. **Start all services** (Docker, backend, frontend)
2. **Login** with Google OAuth
3. **Compose an email**:
   - Upload CSV with email addresses
   - Set subject and body
   - Configure delay and hourly limit
   - Schedule for future time
4. **View scheduled emails** in the Scheduled tab
5. **Wait for scheduled time** or check Sent tab after emails are processed
6. **Test rate limiting**: Schedule 300+ emails for same time, verify rescheduling

## 🔧 Configuration Options

All rate limiting and concurrency settings are configurable via environment variables:

- `MAX_EMAILS_PER_HOUR`: Maximum emails per hour (default: 200)
- `MIN_DELAY_BETWEEN_EMAILS_MS`: Minimum delay between emails in milliseconds (default: 2000)
- `WORKER_CONCURRENCY`: Number of parallel jobs processed (default: 5)

## 📝 Notes

- **No Cron Jobs**: System uses BullMQ delayed jobs exclusively
- **Persistence**: Jobs survive restarts via Redis + PostgreSQL
- **Idempotency**: Job IDs prevent duplicate sends
- **Rate Limiting**: Redis-backed, multi-worker safe
- **Ethereal Email**: Auto-generates credentials, perfect for testing

## 🚨 Troubleshooting

### Backend won't start
- Ensure PostgreSQL and Redis are running (`docker-compose up -d`)
- Check `.env` file has correct `DATABASE_URL` and Redis settings
- Run `npm run db:migrate` if database errors occur

### Frontend auth errors
- Verify `NEXTAUTH_SECRET` is set in `.env.local`
- Check Google OAuth credentials are correct
- Ensure redirect URI matches Google Console settings

### Emails not sending
- Check Ethereal Email credentials in backend console
- Verify rate limits aren't blocking sends
- Check worker logs for errors

### Jobs not processing after restart
- Verify Redis is persistent (check Docker volume)
- Ensure worker is running (`npm run dev` in backend)
- Check BullMQ queue status

## 📄 License

This project is part of the ReachInbox hiring assignment.

Demo Video Link : https://drive.google.com/file/d/1dmASp4eGlPdFRnFW2PK9j9rxvTVeENzQ/view?usp=drive_link
