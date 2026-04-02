# MediBuddy V3 Backend

MediBuddy V3 is a multi-tenant healthcare backend for pharmacies. It is built with NestJS, PostgreSQL, and Prisma.

## Overview

- Multi-tenant pharmacy onboarding
- Admin and staff invite flow
- Email verification and password reset
- Patients, prescriptions, and adherence tracking
- MoMo payment and subscription support
- Audit logging and health checks

## Tech Stack

- Backend: NestJS, Prisma, PostgreSQL, JWT, BullMQ, Redis, Nodemailer

## Project Structure

- `backend/src/` - NestJS backend modules
- `backend/prisma/` - Prisma schema and migrations
- `backend/scripts/` - backup and restore scripts
- `web/` - frontend app

## Core Backend Modules

- `auth` - login, invite handling, email verification, password reset
- `pharmacy` - tenant onboarding and pharmacy lookup
- `patient` - patient CRUD and history
- `prescription` - prescription creation and history
- `payments` - payment initiation and confirmation
- `audit` - audit log tracking
- `analytics` - summary metrics
- `dashboard` - tenant dashboard summary
- `common/health` - health checks for database, Redis, and mail config

## Tenant Flow

1. Create a new pharmacy with `POST /api/pharmacies/onboard`
2. Verify the first admin using the verification link or code
3. Log in with the verified admin account
4. Invite staff through `POST /api/auth/invite`
5. Accept invites with `POST /api/auth/accept-invite`

## Environment Variables

```env
DATABASE_URL="postgresql://myuser:mypassword@localhost:5433/mydatabase?schema=public"
JWT_SECRET="change-me"
FIELD_ENCRYPT_KEY="change-me-too"
APP_URL="http://127.0.0.1:3000"
SMTP_HOST=""
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=""
SMTP_PASS=""
MAIL_FROM="MediBuddy <no-reply@medibuddy.local>"
```

## Local Setup

```bash
npm install
```

Generate Prisma client and apply migrations:

```bash
npx prisma generate
npx prisma migrate dev
```

Run the backend:

```bash
npm run start:dev
```

Build the backend:

```bash
npm run build
```

## Example Onboarding Payload

```json
{
  "name": "Kwasi Pharmacy",
  "phone": "0200000000",
  "plan": "BASIC",
  "adminEmail": "admin@kwasi.test",
  "password": "Password123"
}
```

## Notes

- The backend uses tenant-scoped access control so each pharmacy only sees its own data.
- If SMTP is not configured, invite and verification emails return a development preview instead of failing the request.
# medibuddy
