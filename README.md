# Mileage Tracker (SaaS)

Multi-tenant SaaS web application for recording vehicle mileage and producing IRS-substantiation-grade records for tax filing. Each organization (tenant) gets an isolated workspace, with a platform-admin portal for managing every tenant. Built with **Next.js 14 App Router**, **TypeScript**, **Tailwind CSS**, **Prisma**, and **SQLite**.

## SaaS / multi-tenancy

- **Organizations (tenants)** — every Vehicle and Trip is scoped to an `organizationId`; all data-access queries filter by tenant so organizations can never see each other's records.
- **Self-service onboarding** — anyone can create a new organization at `/register`; the creator becomes the organization administrator (`ORG_ADMIN`).
- **Role-based access control** — `PLATFORM_ADMIN`, `ORG_ADMIN`, and `MEMBER` roles, enforced in middleware and on the server.
- **Platform admin portal** — `/admin` lists every tenant with user/vehicle/trip counts and lets the platform admin suspend or reactivate organizations. Suspended tenants are locked out at the server boundary.
- **Default platform admin** (from seed): username `platform-admin`, password `admin12345` (override with `PLATFORM_ADMIN_USERNAME` / `PLATFORM_ADMIN_PASSWORD`).

## Features

- **Authentication** — Argon2id password hashing, encrypted HTTP-only sessions (iron-session), login rate limiting (5 attempts / 300 seconds), organization-scoped sign-up
- **Vehicles** — Create, edit, archive; annual start/end odometer readings per tax year
- **Trips** — Full IRC §274(d) substantiation (date, origin, destination, purpose, miles, category, vehicle); late-entry flagging (>7 days)
- **IRS rates** — Time-effective mileage rates stored as reference data (never hardcoded in app logic); `RATE_SCALE=10` (725 = 72.5¢/mile)
- **Deductions** — Year-end summary with integer-cent math (`MILES_SCALE=100`); business-use percentage
- **Exports** — CSV trip log and PDF year summary with receipt references
- **Receipts** — Upload JPEG/PNG/WebP/HEIC (max 10 MB); ownership-gated image serving; audit trail
- **Design system** — Ledger palette with CSS custom properties, dark mode toggle, responsive layout

## Quick start

```bash
npm install
npx prisma db push
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), create your organization at `/register`, and start logging trips. Sign in as `platform-admin` / `admin12345` to reach the tenant-management portal at `/admin`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm test` | Run Vitest unit tests |
| `npm run db:push` | Push Prisma schema to SQLite |
| `npm run db:seed` | Seed trip categories and IRS mileage rates |
| `npm run smoke` | Run POST-flow smoke test (register, login, vehicle, trip) |

## Environment

Create `.env`:

```
DATABASE_URL="file:./dev.db"
SESSION_SECRET="your-secret-at-least-32-characters-long"
```

## Architecture

- **Monolith** — Server Components, Server Actions, and Route Handlers in one Next.js app
- **Auth** — Middleware enforces session on every request; public paths: `/login`, `/register`, auth API
- **Storage** — SQLite via Prisma; receipt files in `data/receipts/`
- **Rates** — Seeded IRS reference data; resolution errors block deduction calculation

## IRS rate reference data (seeded)

| Category | 2026 rate (stored) | 2025 business |
|----------|-------------------|---------------|
| Business | 725 (72.5¢) | 700 (70¢) |
| Medical / Moving | 205 (20.5¢) | — |
| Charitable | 140 (14¢) | — |

## License

Private — single-user MVP.
