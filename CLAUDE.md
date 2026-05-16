# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Badminton club management app for tracking weekly session attendance and payments. Features member management, session creation with cost splitting, public check-in pages, and integrated QR payments via SePay.

**Tech Stack:** Next.js 16 (App Router), Prisma 7 + Turso (libSQL/SQLite), Tailwind CSS 4 + shadcn/ui, deployed on Vercel.

**Environment:** Node 22.x

## Common Commands

### Development
```bash
npm run dev              # Start dev server (http://localhost:3000)
npm run build            # Build (runs prisma generate first)
npm run start            # Start production server
npm run lint             # Run ESLint
```

### Database
```bash
npm run db:generate      # Generate Prisma client (output: app/generated/prisma/)
npm run db:migrate       # Run pending migrations
npm run db:push          # Sync schema with database (no migrations)
npm run db:studio        # Open Prisma Studio GUI
```

## Architecture

### Data Model
Five core models in `prisma/schema.prisma`:
- **Member**: Users (id, name, phone, active flag)
- **Session**: Weekly session with costs (court, shuttlecock, water, guest fee)
- **Attendance**: Member attendance per session (payment relation)
- **Payment**: Per-member payment per session (status, SePay ref, paidAt)
- **Guest**: Non-member guests registered for a session

Notes: Payments are 1:1 with Attendance. Payment amounts are recalculated on every attendance change (check-in/out). Guest payments tracked separately.

### Authentication
JWT-based admin access at `/admin`:
- Credentials from `BCLB_ADMIN_USER`/`BCLB_ADMIN_PASS` environment variables (defaults: admin / P@ssw0rd)
- JWT signed with `jose` library (`BCLB_JWT_SECRET` env var)
- Token stored in HttpOnly cookie `admin_session` (8-hour expiration)
- `lib/auth.ts` exports: `signAdminToken()`, `verifyAdminToken()`, `getAdminSession()`, `validateAdminCredentials()`

### Database Client
Custom Prisma setup in `lib/prisma.ts`:
- Prisma 7 with LibSQL adapter (Turso/SQLite)
- Client output path: `app/generated/prisma/` (checked into git)
- Supports local SQLite (`file:./prisma/dev.db`) and remote Turso via `BCLB_TURSO_DATABASE_URL` + `BCLB_TURSO_AUTH_TOKEN`
- Singleton pattern with global instance for dev

### API Routes (`app/api/`)
- `POST /auth/login` — Validate credentials, set JWT cookie
- `POST /auth/logout` — Clear JWT cookie
- `GET/POST /members` — List members, create new
- `GET/PUT/DELETE /members/[id]` — Member details and updates
- `GET/POST /sessions` — List sessions, create new
- `GET/PATCH /sessions/[id]` — Session details, update costs/notes; recalculates all pending payments when costs change
- `POST/PATCH/DELETE /sessions/[id]/attendance` — Check in (POST), mark paid (PATCH), check out (DELETE)
- `POST/GET /sessions/[id]/guests` — Guest registration
- `DELETE /sessions/[id]/guests/[guestId]` — Remove guest
- `POST /sessions/[id]/payment/[memberId]` — Mark payment method (links to `/sessions/[id]/payment/[memberId]` page)
- `POST /webhooks/sepay` — SePay callback (updates payment status to 'paid', sets paidAt)
- `POST /admin/sessions/[id]/regenerate-payments` — Admin tool to regenerate payment records

### Pages

**Public Routes:**
- `/login` — Admin login form
- `/sessions` — List upcoming sessions
- `/sessions/[id]` — Attendance check-in page (public, shows members + guests, calculates costs)
- `/sessions/[id]/payment/[memberId]` — Payment page with SePay QR code (uses `buildSePayQrUrl()` from `lib/sepay.ts`)
- `/sessions/[id]/guest-payment/[guestId]` — Guest payment page

**Protected Routes (require admin JWT):**
- `/admin` — Dashboard
- `/admin/members` — Member management (add, deactivate)
- `/admin/sessions` — Session list with controls
- `/admin/sessions/new` — Create session
- `/admin/sessions/[id]` — Session details and editing (split costs, edit notes as markdown)

### Payment Integration (SePay)
- `lib/sepay.ts` exports: `buildSePayQrUrl(amount, description)`, `buildPaymentRef(sessionId, memberId)`
- QR payload includes: bank code (`BCLB_SEPAY_BANK_CODE`, default "MB"), account (`BCLB_SEPAY_ACCOUNT_NUMBER`), amount, description
- Payment reference format: `CLB{first-10-chars-of-sha256-hash}` — deterministic per session/member
- Webhook at `/api/webhooks/sepay` expects SePay callback, updates Payment.status to 'paid', sets paidAt

### UI & Styling
- Tailwind CSS 4 + shadcn/ui for components
- Dark mode support via next-themes (select available but not actively used)
- Vietnamese text in admin UI (member labels, session labels)
- Markdown rendering in session notes (`react-markdown`)
- Toast notifications via `sonner`

## Key Patterns

**Prisma Generated Client:**
- TypeScript types are auto-generated into `app/generated/prisma/` on build
- Always import from `@/app/generated/prisma/client` (not directly from `@prisma/client`)
- Run `npm run db:generate` after schema changes to regenerate types

**Environment Variables:**
Prefix all custom env vars with `BCLB_` for consistency (see `lib/auth.ts`, `lib/prisma.ts`, `lib/sepay.ts`).

**Admin Layout:**
All admin routes inherit from `app/admin/layout.tsx` — provides header with nav and logout button.

**Cost Calculation:**
Costs are split equally among members per session. Recalculated on every attendance change (check-in/out) and also when admin updates `courtCost`/`shuttleCost`/`waterCost`. Only payments with `status !== 'paid'` are updated on cost change.

**Payment Workflow:**
1. Member checks in at `/sessions/[id]`
2. Admin creates session with costs at `/admin/sessions/new`
3. Member navigates to `/sessions/[id]/payment/[memberId]` to see QR
4. Member scans and pays via SePay
5. SePay webhook updates Payment.status to 'paid'
6. UI polls for payment confirmation (`poller.tsx` components)

## Important Implementation Details

- No global authentication middleware; admin routes check `getAdminSession()` manually
- Payment amounts recalculate on attendance change (check-in/out) and when admin edits session costs; already-paid payments are never modified
- Guests and members use separate payment tracks
- Session notes support Markdown (`react-markdown` component)
- Admin credentials stored in environment variables; no user management system
