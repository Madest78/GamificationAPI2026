# DSPeopleBack — Implementation Plan

> **Blueprint reference:** `/home/tury/Downloads/dataflow-backend-blueprint (1).md`

---

## ✅ Completed (Phase 1 — Foundation)
- [x] TypeScript setup: `tsconfig.json`, ESM, strict mode, path aliases (`@/*`)
- [x] Express skeleton: `src/app.ts`, `src/index.ts`
- [x] Error handling: `src/errors/AppErrors.ts` (AppError + 6 subclasses)
- [x] Utils: `src/utils/asyncHandler.ts`
- [x] Scripts: `dev` (tsx watch), `build` (tsc), `start` (node dist)
- [x] Health endpoint: `GET /api/health` → `{"status":"ok"}`

---

## 🔧 Phase 2: Foundation (Before Auth)

### ✅ Done
- [x] PostgreSQL installed & running (v16.14)
- [x] Database `dspeople` created, user `dspeople` with password `314159`
- [x] Config Validation: `src/config/env.ts` — Zod schema written & reviewed
- [x] Prisma Client generated (`npx prisma generate`)
- [x] @prisma/adapter-pg installed
- [x] Prisma Singleton: `src/shared/prisma.ts` — singleton with globalThis pattern
- [x] Render.com PostgreSQL connected

### ⏭ Next Step
**Prisma Models + Migration + Repository Pattern**

---

## 🏗 Architecture: Repository Pattern (Database-Agnostic)

### Why Repository Pattern?

**Risk:** Possible migration from PostgreSQL to BigQuery in the future.

**Solution:** Separate business logic from database implementation using Repository Pattern.

```
┌─────────────────────────────────────────────┐
│            Application (Express)            │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │         Routes (HTTP Handlers)      │   │
│  │   Accepts request, returns response │   │
│  └──────────────┬──────────────────────┘   │
│                 │                          │
│  ┌──────────────▼──────────────────────┐   │
│  │         Service Layer               │   │
│  │   Business logic, validation        │   │
│  │   Uses INTERFACES, not Prisma       │   │
│  └──────────────┬──────────────────────┘   │
│                 │                          │
│  ┌──────────────▼──────────────────────┐   │
│  │      Repository Interface           │   │
│  │   Contract: what methods exist      │   │
│  └──────────────┬──────────────────────┘   │
│                 │                          │
│  ┌──────────────▼──────────────────────┐   │
│  │   Repository Implementation         │   │
│  │   (Prisma NOW → BigQuery LATER)     │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

### Rules (to minimize migration pain)

| # | Rule | Why |
|---|------|-----|
| 1 | **Business logic NEVER uses Prisma directly** | Easy to replace |
| 2 | **All DB queries go through interfaces** | Abstraction |
| 3 | **No raw SQL in services** | Portability |
| 4 | **Prisma-specific code ONLY in repository** | Isolation |

### What changes on migration?

| Layer | Changes? | Why |
|-------|----------|-----|
| Routes (endpoints) | ❌ No | Same HTTP endpoints |
| Service (business logic) | ❌ No | Same rules |
| Repository Interface | ❌ No | Same contract |
| Repository Implementation | ✅ Yes | Prisma → BigQuery |

**Analogy:** Restaurant stays the same, only the supplier changes.

---

## 📁 Target File Structure (Each Module)

```
src/modules/[feature]/
├── [feature].interface.ts      # Interfaces (contracts)
├── [feature].service.ts        # Business logic
├── [feature].repository.ts     # Repository interface
├── [feature].repository.prisma.ts  # Prisma implementation
└── [feature].routes.ts         # HTTP handlers
```

---

## 🔧 Phase 2: Foundation (Before Auth) — Detailed

### 2.0 Infrastructure Setup

#### Render.com PostgreSQL
- Database: `gamification_ds_db`
- User: `gamification_ds_db_user`
- Host: `dpg-d9kv0r5aeets73a95n70-a.singapore-postgres.render.com`
- SSL: Required (`?sslmode=require`)

#### .env (Final)
```env
DATABASE_URL="postgresql://gamification_ds_db_user:kaQ4tkMUVAPGoitLIDjJhOOiCkDNBCbu@dpg-d9kv0r5aeets73a95n70-a.singapore-postgres.render.com/gamification_ds_db?sslmode=require"
PORT=3000
NODE_ENV=development

JWT_SECRET="generates_with_openssl_rand_base64_32"
GOOGLE_CLIENT_ID="from_google_cloud_console"
GOOGLE_CLIENT_SECRET="from_google_cloud_console"
GOOGLE_CALLBACK_URL="http://localhost:3000/api/auth/google/callback"
FRONTEND_URL="http://localhost:5173"
ALLOWED_DOMAINS="emplanner.team,docusketch.com"
LOG_LEVEL="debug"
```

Generate JWT_SECRET:
```bash
openssl rand -base64 32
```

#### Google Cloud Console
1. https://console.cloud.google.com → Create project "DSPeople"
2. APIs & Services → Credentials → Create OAuth 2.0 Client ID
3. Type: Web application
4. Redirect URIs: `http://localhost:3000/api/auth/google/callback`
5. Save `client_id` + `client_secret` to `.env`

### 2.1 Config Validation — `src/config/env.ts`

Zod schema for all env vars:

| Variable | Required | Type | Notes |
|----------|----------|------|-------|
| `DATABASE_URL` | ✅ | string (URL) | PostgreSQL connection |
| `PORT` | ❌ | number | Default: 3000 |
| `NODE_ENV` | ❌ | enum | development/production/test |
| `JWT_SECRET` | ✅ | string | Min 32 chars |
| `GOOGLE_CLIENT_ID` | ✅ | string | OAuth client |
| `GOOGLE_CLIENT_SECRET` | ✅ | string | OAuth secret |
| `GOOGLE_CALLBACK_URL` | ✅ | string (URL) | Callback URL |
| `FRONTEND_URL` | ✅ | string (URL) | Post-login redirect |
| `ALLOWED_DOMAINS` | ✅ | string | Comma-separated domains |
| `LOG_LEVEL` | ❌ | enum | trace/debug/info/warn/error/fatal |

**Behavior:**
- `dotenv.config()` loads `.env`
- Zod validates `process.env`
- Invalid → clear error at startup
- Export typed `env` object

### 2.2 PrismaClient Singleton — `src/shared/prisma.ts`

- Single instance cached in `globalThis` (dev hot-reload safe)
- Graceful shutdown: `process.on('beforeExit')` → `prisma.$disconnect()`
- Uses PrismaPg adapter for PostgreSQL connection

### 2.3 Prisma Models — `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
}

model User {
  id              String              @id @default(cuid())
  email           String              @unique
  name            String?
  avatarUrl       String?
  googleId        String?             @unique
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt

  roles           UserRole[]
  specializations UserSpecialization[]
  refreshTokens   RefreshToken[]
  revokedTokens   RevokedToken[]
  loginCodes      LoginCode[]
}

model Role {
  id          String      @id @default(cuid())
  code        String      @unique
  name        String
  description String?
  users       UserRole[]
}

model UserRole {
  userId String
  roleId String
  user   User @relation(fields: [userId], references: [id], onDelete: Cascade)
  role   Role @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@id([userId, roleId])
}

model Specialization {
  id          String              @id @default(cuid())
  code        String              @unique
  name        String
  users       UserSpecialization[]
}

model UserSpecialization {
  userId            String
  specializationId  String
  user              User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  specialization    Specialization  @relation(fields: [specializationId], references: [id], onDelete: Cascade)

  @@id([userId, specializationId])
}

model RefreshToken {
  id        String   @id @default(cuid())
  tokenHash String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  createdAt DateTime @default(now())
  userAgent String?
  ip        String?
}

model RevokedToken {
  id        String   @id @default(cuid())
  jti       String   @unique
  userId    String
  revokedAt DateTime @default(now())
}

model LoginCode {
  id        String   @id @default(cuid())
  code      String   @unique
  userId    String
  expiresAt DateTime
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

Run: `npx prisma migrate dev --name init`

### 2.4 Seed Roles — `prisma/seed.ts`

```typescript
const roles = [
  { code: 'DRAFTER_FP', name: 'Драфтер FP' },
  { code: 'DRAFTER_BIG_FP', name: 'Драфтер Big FP' },
  { code: 'DRAFTER_ESX', name: 'Драфтер ESX' },
  { code: 'REVIEWER', name: 'Ревьюер' },
  { code: 'ADMIN', name: 'Администратор' },
  { code: 'MODERATOR', name: 'Модератор' },
]
```

Run: `npx prisma db seed`

### 2.5 Repository Interfaces — `src/modules/*/`

#### User Repository Interface

```typescript
// src/modules/users/user.repository.ts

interface UserRepository {
  findById(id: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  findByGoogleId(googleId: string): Promise<User | null>
  create(data: CreateUser): Promise<User>
  update(id: string, data: UpdateUser): Promise<User>
  findRoles(userId: string): Promise<Role[]>
  findSpecializations(userId: string): Promise<Specialization[]>
}
```

#### Auth Repository Interface

```typescript
// src/modules/auth/auth.repository.ts

interface AuthRepository {
  findUserByEmail(email: string): Promise<User | null>
  findUserByGoogleId(googleId: string): Promise<User | null>
  createUser(data: CreateUser): Promise<User>
  createLoginCode(userId: string, code: string, expiresAt: Date): Promise<LoginCode>
  findLoginCode(code: string): Promise<LoginCode | null>
  deleteLoginCode(code: string): Promise<void>
  findRefreshToken(tokenHash: string): Promise<RefreshToken | null>
  createRefreshToken(data: CreateRefreshToken): Promise<RefreshToken>
  deleteRefreshToken(tokenHash: string): Promise<void>
  createRevokedToken(jti: string, userId: string): Promise<RevokedToken>
  isTokenRevoked(jti: string): Promise<boolean>
}
```

### 2.6 Prisma Repository Implementations

#### User Repository Prisma

```typescript
// src/modules/users/user.repository.prisma.ts

class PrismaUserRepository implements UserRepository {
  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } })
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } })
  }

  async create(data: CreateUser): Promise<User> {
    return prisma.user.create({ data })
  }

  // ... other methods
}
```

### 2.7 Middleware Stack — `src/shared/middleware/`

| File | Purpose |
|------|---------|
| `errorHandler.ts` | AppError → JSON; unknown → 500 + log + requestId |
| `validate.ts` | Zod safeParse → 400 VALIDATION_ERROR or replace data |
| `requestId.ts` | Generate x-request-id, echo in response |
| `logger.ts` | pino: pretty dev, json prod; request log |
| `auth.ts` | verifyToken, requireAuth, requireRole(...codes) |

#### auth.ts details:
```
verifyToken(req, res, next):
  - Read Authorization: Bearer <token>
  - verifyAccessToken(token) → { userId, email, roles, jti }
  - Check jti NOT IN revoked_tokens → 401 if revoked
  - Set req.user

requireAuth:
  - Wrapper: if !req.user → 401

requireRole(...codes):
  - Check req.user.roles includes any of codes → 403 if not
```

### 2.8 Update app.ts

Middleware order (DataFlow pattern):
```
1. trust proxy = 1
2. requestIdMiddleware
3. requestLogMiddleware
4. helmet
5. cors({ origin: ALLOWED_ORIGINS })
6. express.json({ limit: '256kb' })
7. GET /api/health (public)
8. /api/auth (OAuth + token exchange)
9. /api (JWT + business routes)
10. errorHandler (always last)
```

### 2.9 New Dependencies

```bash
npm install jose pino pino-pretty helmet
npm install -D @types/pino
```

---

## 🔐 Phase 3: Auth (DataFlow Pattern + jti Revocation)

### Design Decisions

| Aspect | Decision |
|--------|----------|
| Auth pattern | DataFlow: one-time code → JWT Bearer |
| JWT TTL | 24 hours |
| JWT algorithm | HS256 (pinned `algorithms: ['HS256']`) |
| JWT storage (client) | `localStorage` |
| Roles | In JWT payload + DB check for admin |
| Logout | Per-token: `jti` in `revoked_tokens` |
| Domains | `ALLOWED_DOMAINS` env, check on backend |
| CSRF | `oauth_state` cookie (httpOnly, SameSite=Lax) |

### 3.1 Auth Flow

```
1. LOGIN
   Client → GET /api/auth/google
   Server → set oauth_state cookie (httpOnly, 10min)
   Server → redirect to Google

   Google → user approves
   Google → GET /api/auth/google/callback?code=xxx&state=xxx

   Server:
     - verify state (constant-time)
     - exchange code for id_token
     - verify id_token → email, name, picture, sub
     - check domain: @emplanner.team / @docusketch.com
     - findOrCreateUser(email, name, picture, googleId)
     - createLoginCode(userId) → one-time code (60s TTL)
     - redirect to FRONTEND_URL?code=<login_code>

   Client (frontend):
     - GET /api/auth/token?code=<login_code>
     - Server: login_code → JWT → { token }
     - Save to localStorage
     - All requests: Authorization: Bearer <jwt>

2. AUTHENTICATED REQUEST
   Client → GET /api/users/me
            Authorization: Bearer <jwt>

   Server (auth middleware):
     - verifyAccessToken(token) → { userId, email, roles, jti }
     - check jti NOT IN revoked_tokens → 401 if revoked
     - set req.user

3. LOGOUT
   Client → POST /api/auth/logout
            Authorization: Bearer <jwt>

   Server:
     - extract jti from JWT
     - INSERT INTO revoked_tokens (jti, userId, now)
     - 200 OK

   Client:
     - remove JWT from localStorage
     - redirect to login

4. TOKEN EXCHANGE (one-time code → JWT)
   Client → GET /api/auth/token?code=<login_code>

   Server:
     - SELECT FROM login_codes WHERE code = ?
     - check TTL (60s)
     - DELETE (one-time use)
     - generate JWT
     - return { token: "eyJ..." }
```

### 3.2 JWT Utilities — `src/modules/auth/jwt.ts`

```typescript
import { SignJWT, jwtVerify } from 'jose'

interface AccessTokenPayload {
  userId: string
  email: string
  roles: string[]
  jti: string
}

// signAccessToken(userId, email, roles) → string
//   alg: HS256, exp: 24h, jti: crypto.randomUUID()

// verifyAccessToken(token) → AccessTokenPayload
//   algorithms: ['HS256']  // strict!
```

### 3.3 Google OAuth — `src/modules/auth/google.ts`

```typescript
// getAuthUrl(state) → string
//   Google consent screen URL with params

// exchangeCodeForTokens(code) → { id_token, access_token }
//   POST https://oauth2.googleapis.com/token

// verifyIdToken(id_token) → { sub, email, name, picture }
//   Via google-auth-library
```

### 3.4 Auth Service — `src/modules/auth/service.ts`

```typescript
// Uses AuthRepository interface (not Prisma directly!)

// findOrCreateUser(googlePayload) → User
//   upsert by email, default role: DRAFTER_FP

// createLoginCode(userId) → string
//   crypto.randomUUID(), save to login_codes, TTL 60s

// redeemLoginCode(code) → { user, roles }
//   SELECT + DELETE (one-time), check TTL

// logout(jti, userId)
//   INSERT INTO revoked_tokens
```

### 3.5 Auth Schemas — `src/modules/auth/schemas.ts`

Zod schemas for:
- `loginCodeSchema` — query: `{ code: string }`
- `meResponseSchema` — response shape

### 3.6 Auth Routes — `src/modules/auth/routes.ts`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/auth/google` | public | Redirect to Google OAuth |
| `GET` | `/api/auth/google/callback` | public | Handle callback, redirect to frontend |
| `GET` | `/api/auth/token` | public | One-time code → JWT |
| `GET` | `/api/auth/me` | Bearer | Current user |
| `POST` | `/api/auth/logout` | Bearer | Revoke jti |

### 3.7 Domain Restriction

```typescript
// In auth/service.ts
const ALLOWED_DOMAINS = env.ALLOWED_DOMAINS.split(',').map(d => d.trim())

function isAllowedDomain(email: string): boolean {
  const domain = email.split('@')[1]
  return ALLOWED_DOMAINS.includes(domain)
}

// In callback handler:
if (!isAllowedDomain(email)) {
  throw new ForbiddenError('Corporate accounts only')
}
```

---

## 📁 Target File Structure (Final)

```
Backend/src/
├── config/
│   └── env.ts                    # Zod validated env
├── shared/
│   ├── prisma.ts                 # PrismaClient singleton
│   └── middleware/
│       ├── errorHandler.ts       # AppError → JSON
│       ├── validate.ts           # Zod request validation
│       ├── requestId.ts          # x-request-id
│       ├── logger.ts             # pino
│       └── auth.ts               # verifyToken, requireAuth, requireRole
├── modules/
│   ├── auth/
│   │   ├── auth.interface.ts     # Auth interfaces
│   │   ├── auth.service.ts       # Business logic
│   │   ├── auth.repository.ts    # Repository interface
│   │   ├── auth.repository.prisma.ts  # Prisma implementation
│   │   ├── auth.routes.ts        # HTTP handlers
│   │   ├── jwt.ts                # sign/verify JWT
│   │   ├── google.ts             # OAuth URL, code exchange
│   │   └── schemas.ts            # Zod schemas
│   ├── users/
│   │   ├── user.interface.ts     # User interfaces
│   │   ├── user.service.ts       # Business logic
│   │   ├── user.repository.ts    # Repository interface
│   │   ├── user.repository.prisma.ts  # Prisma implementation
│   │   └── user.routes.ts        # HTTP handlers
│   └── ... (other modules)
├── errors/
│   └── AppErrors.ts              # (exists)
├── utils/
│   └── asyncHandler.ts           # (exists)
├── app.ts                        # Express bootstrap
└── index.ts                      # Entry point
```

---

## 🛠 Tech Stack (Locked)

| Layer | Choice |
|-------|--------|
| Runtime | Node 20 LTS (ESM) |
| Framework | Express 5 |
| ORM | Prisma (PostgreSQL) |
| Architecture | Repository Pattern (database-agnostic) |
| Auth | Google OAuth + JWT (`jose`) HS256 |
| JWT TTL | 24 hours |
| Validation | Zod |
| Security | helmet, SameSite cookies |
| Logging | pino |
| Tests | vitest |
| Deploy | Render.com |

---

## 📋 Execution Order (Sequential)

| # | Step | Files | Command | Status |
|---|------|-------|---------|--------|
| 0 | PostgreSQL setup | — | `sudo apt install postgresql` | ✅ Done |
| 0 | Create DB | — | `sudo -u postgres psql` | ✅ Done |
| 0 | Render.com PostgreSQL | — | dashboard.render.com | ✅ Done |
| 0 | Google Cloud Console | — | Manual setup | ⏳ Pending |
| 0 | Fill .env | `.env` | `openssl rand -base64 32` | ⏳ Pending |
| 1 | Config Validation | `src/config/env.ts`, `.env.example` | — | ✅ Done |
| 2 | Prisma Singleton | `src/shared/prisma.ts` | — | ✅ Done |
| 3 | Prisma Models + Migrate | `prisma/schema.prisma` | `npx prisma migrate dev --name init` | ⏭ Next |
| 4 | Seed roles | `prisma/seed.ts` | `npx prisma db seed` | ⏳ |
| 5 | Repository Interfaces | `src/modules/*/repository.ts` | — | ⏭ NEW |
| 6 | Prisma Repositories | `src/modules/*.repository.prisma.ts` | — | ⏭ NEW |
| 7 | Error Handler | `src/shared/middleware/errorHandler.ts` | — | ⏳ |
| 8 | Validate middleware | `src/shared/middleware/validate.ts` | — | ⏳ |
| 9 | Request ID | `src/shared/middleware/requestId.ts` | — | ⏳ |
| 10 | Logger | `src/shared/middleware/logger.ts` | — | ⏳ |
| 11 | Auth middleware | `src/shared/middleware/auth.ts` | — | ⏳ |
| 12 | Update app.ts | `src/app.ts` | — | ⏳ |
| 13 | JWT utilities | `src/modules/auth/jwt.ts` | — | ⏳ |
| 14 | Google OAuth | `src/modules/auth/google.ts` | — | ⏳ |
| 15 | Auth Service | `src/modules/auth/service.ts` | — | ⏳ |
| 16 | Auth Schemas | `src/modules/auth/schemas.ts` | — | ⏳ |
| 17 | Auth Routes | `src/modules/auth/routes.ts` | — | ⏳ |
| 18 | Register routes | `src/app.ts` | — | ⏳ |
| 19 | Test | `npm run dev` | `curl` requests | ⏳ |

---

## 📦 New Dependencies

```bash
npm install jose pino pino-pretty helmet
npm install -D @types/pino
```

---

## ✅ Acceptance Criteria

| Phase | Criteria |
|-------|----------|
| Config | `npm run dev` fails fast with clear error if `.env` missing/invalid |
| Prisma | `npx prisma migrate dev` creates all tables, `npx prisma studio` works |
| Roles | After seed: 6 roles in DB |
| Repository | All DB queries go through interfaces, not Prisma directly |
| Auth flow | Google OAuth → redirect → login_code → JWT |
| /me | `GET /api/auth/me` with Bearer → current user |
| Logout | `POST /api/auth/logout` → jti in revoked_tokens, same JWT → 401 |
| Domain | Login with @gmail.com → 403 "Corporate accounts only" |
| Migration-ready | Can swap Prisma for BigQuery by changing repository only |

---

## 📝 Notes

- **Architecture:** Repository Pattern for database-agnostic code
- **Migration risk:** Possible PostgreSQL → BigQuery migration
- **Preparation:** All DB access through interfaces, Prisma only in repository implementations
- **Source DB**: Google Cloud, daily batch export, format TBD (3-4 Aug)
- **Historical data**: Skip — start from zero for fair gamification
- **Order roles**: `drafter` (executes) / `reviewer` (verifies) — flag on Order
- **Achievements**: JSONLogic conditions, recurring + one-time
- **Kudos**: Emoji + text, weekly limit, random pool refresh
- **Roles**: Dictionary-based (`DRAFTER_FP`, `ADMIN`, `MODERATOR`...), many-to-many

---

*Plan updated: 2026-08-05 — Added Repository Pattern for database-agnostic architecture. Risk: PostgreSQL → BigQuery migration.*
*Blueprint: `/home/tury/Downloads/dataflow-backend-blueprint (1).md`*
