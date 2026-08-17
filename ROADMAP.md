# DSPeopleBack — Project Roadmap

## 🎯 Vision
Corporate social backend for drafters (FP, Big FP, ESX) with gamified achievements, kudos, and automated feed based on production statistics.

---

## 🏗 Architecture: Repository Pattern

**PostgreSQL — основная продовая база (всегда).**
**BigQuery — внешний источник данных для импорта (заменит ручной парсинг Emplanner).**

```
External Sources (BigQuery, Emplanner API) 
    → Import Service → Transform → Prisma → PostgreSQL

Internal CRUD:
    Routes → Service → Repository Interface → PrismaUserRepository → PostgreSQL
```

**Rules:**
1. Business logic NEVER uses Prisma directly
2. All DB queries go through interfaces
3. No raw SQL in services
4. Prisma-specific code ONLY in repository
5. Import adapters follow same pattern (SourceAdapter interface)

**Current approach:** Manual Emplanner endpoint scraping via browser DevTools.
**Future:** Emplanner will provide API with BigQuery data access.

---

## ✅ Done

- [x] Project initialized (Express 5, Prisma, TypeScript/ESM)
- [x] Basic health endpoint (`GET /api/health`)
- [x] Prisma skills installed (9 skills)
- [x] Architecture grilled & planned (see below)
- [x] Config validation — Zod env schema (`src/config/env.ts`)
- [x] Error handling — AppError classes (`src/errors/AppErrors.ts`)
- [x] Async handler utility (`src/utils/asyncHandler.ts`)
- [x] Prisma Client generated (`npx prisma generate`)
- [x] @prisma/adapter-pg installed
- [x] Prisma Singleton — `src/shared/prisma.ts` (globalThis pattern)
- [x] Render.com PostgreSQL connected

---

## ✅ Foundation Complete

### 1. Foundation (Independent of Source DB)
- [x] **Config validation** — Zod env schema (`src/config/env.ts`)
- [x] **PrismaClient singleton** — with graceful shutdown (`src/shared/prisma.ts`)
- [x] **Prisma models** — User, Role, UserRole, Specialization, UserSpecialization, RefreshToken, RevokedToken, LoginCode
- [x] **Prisma migration** — `npx prisma migrate dev --name init`
- [x] **Seed roles** — 5 roles (DRAFTER, TEAMLEAD, MEMBER, ADMIN, SUPERADMIN)
- [x] **User repository interface** — `src/modules/users/user.repository.ts`
- [x] **User repository Prisma** — `src/modules/users/user.repository.prisma.ts`
- [x] **User interface (Zod + DTO)** — `src/modules/users/user.interface.ts`
- [x] **Auth repository interface** — `src/modules/auth/auth.repository.ts`
- [x] **Auth repository Prisma** — `src/modules/auth/auth.repository.prisma.ts`
- [x] **Auth interface (Zod + DTO)** — `src/modules/auth/auth.interface.ts`
- [x] **Express middleware** — requestId, validate, logger (`src/shared/middleware/`)
- [x] **Error handling** — AppError classes, global handler

---

## ✅ Phase 3 Complete

### 2. Auth (Google OAuth + JWT)
- [x] **Google OAuth** — manual with `jose` (`src/modules/auth/auth.service.ts`)
- [x] **JWT access (15m) + refresh (30d) tokens** — with rotation
- [x] **Auth middleware** — `verifyToken`, `requireAuth`, `requireRole` (`src/modules/auth/auth.middleware.ts`)
- [x] **Auth routes** — `GET /api/auth/google`, `GET /api/auth/google/callback`, `POST /api/auth/refresh`, `POST /api/auth/logout`, `GET /api/auth/me`

---

## 🔧 In Progress (Next Session)

### 3. Users Module (Basic)
- [ ] User service — business logic
- [ ] User repository interface — contract
- [ ] User repository Prisma — implementation
- [ ] Routes: `GET /api/users/:id`, `PATCH /api/users/:id` (profile), `GET /api/users/:id/achievements`

### 4. Job Infrastructure
- [x] **node-cron** scheduler setup (`src/shared/jobs/scheduler.ts`)
- [x] **pg-boss** queue (PostgreSQL-based) (`src/shared/jobs/queue.ts`)
- [x] **Workers** — job handlers (`src/shared/jobs/workers.ts`)
- [x] **Job types** — `import.daily`, `achievements.check`, `kudos.reset`

### 5. WebSocket Server
- [x] **ws server** — on same port (upgrade) (`src/shared/websocket/server.ts`)
- [x] **Auth via token** — JWT verification on connection
- [x] **Events** — ping/pong, subscribe

---

## ⏳ Phase 6: Orders & Import (Waiting for API Access)

### Data Sources
- **Emplanner** — Orders, statuses, drafters, reviewers, tour history (evaluation, time, participants)
- **Slack** — User avatars
- **Google Cloud (DS Shop)** — Deposit data (migrating from GoDaddy)
- **Google Sheets** — Manager-filled reference data

### Models
- [ ] **Order** model — sourceOrderId, title, status, drafterId, reviewerId, evaluation, duration
- [ ] **ImportBatch** model — source, status, records count, errors

### Source Adapters (Repository Pattern)
- [ ] **SourceAdapter interface** — base contract for all adapters
- [ ] **EmplannerAdapter** — fetch orders from Emplanner API
- [ ] **SlackAdapter** — fetch avatars from Slack API
- [ ] **GoogleSheetsAdapter** — fetch data from Google Sheets API
- [ ] **DsShopAdapter** — fetch deposits from Google Cloud

### Import Logic
- [ ] **Import service** — orchestrate fetch → transform → upsert
- [ ] **Idempotency** — by sourceOrderId (no duplicates)
- [ ] **Retry + alerting** — Slack webhook on failures

### Cron Jobs
- [ ] `import.emplanner` — daily at 02:00
- [ ] `import.slack` — daily at 04:00
- [ ] `import.google_sheets` — daily at 05:00
- [ ] `import.ds_shop` — daily at 06:00

**Documentation:** `DataBase/PHASE6_DATA_SOURCES.md`

---

## ✅ Phases 7-10 Complete

### 7. Achievements Engine
- [x] **Prisma models** — `AchievementDef`, `UserAchievement`
- [x] **Achievement interface** — `src/modules/achievements/achievement.interface.ts`
- [x] **Achievement repository** — interface + Prisma implementation
- [x] **Achievement service** — JSONLogic evaluator, check & grant
- [x] **Achievement routes** — `GET /api/achievements`, `GET /api/achievements/user/:userId`, `POST /api/achievements/check`

### 8. Kudos System
- [x] **Prisma models** — `KudosType`, `KudosTransaction`, `UserKudosBalance`
- [x] **Kudos interface** — `src/modules/kudos/kudos.interface.ts`
- [x] **Kudos repository** — interface + Prisma implementation
- [x] **Kudos service** — send, history, balance, weekly reset
- [x] **Kudos routes** — `GET /api/kudos/types`, `POST /api/kudos/send`, `GET /api/kudos/history`, `GET /api/kudos/balance`

### 9. Feed
- [x] **Prisma model** — `Follow`
- [x] **Feed interface** — `src/modules/feed/feed.interface.ts`
- [x] **Feed service** — follow, unfollow, feed, following, followers
- [x] **Feed routes** — `POST /api/feed/follow`, `DELETE /api/feed/follow/:id`, `GET /api/feed`, `GET /api/feed/following`, `GET /api/feed/followers`

### 10. Admin Panel
- [x] **Admin interface** — `src/modules/admin/admin.interface.ts`
- [x] **Admin service** — user management, roles, specializations
- [x] **Admin routes** — `GET /api/admin/users`, `POST /api/admin/users/:id/roles`, `GET /api/admin/specializations`, etc.

---

## 📦 Data Model (Agreed)

```mermaid
erDiagram
    User ||--o{ UserRole : has
    User }|--o{ Specialization : has
    Role ||--o{ UserRole : assigned
    User ||--o{ Order : executes (drafter)
    User ||--o{ Order : reviews (reviewer)
    User ||--o{ UserAchievement : earns
    AchievementDef ||--o{ UserAchievement : defines
    ImportBatch ||--o{ Order : contains
    User ||--o{ Follow : follows
    User ||--o{ KudosTransaction : sends
    User ||--o{ KudosTransaction : receives
```

---

## 🛠 Tech Stack

| Layer | Choice |
|-------|--------|
| Runtime | Node 20 LTS (ESM) |
| Framework | Express 5 |
| ORM | Prisma (PostgreSQL) |
| Architecture | Repository Pattern (Import Adapters + CRUD) |
| Auth | Google OAuth + JWT (`jose`) |
| Validation | Zod |
| Jobs | node-cron + pg-boss |
| WebSockets | ws |
| Logging | pino |
| Tests | vitest |
| Deploy | Render.com (Web Service + Managed PG) |

---

## 📁 Target File Structure

```
src/
├── config/
│   ├── env.ts
│   └── constants.ts
├── modules/
│   ├── auth/
│   │   ├── auth.interface.ts
│   │   ├── auth.service.ts
│   │   ├── auth.repository.ts
│   │   ├── auth.repository.prisma.ts
│   │   └── auth.routes.ts
│   ├── users/
│   │   ├── user.interface.ts
│   │   ├── user.service.ts
│   │   ├── user.repository.ts
│   │   ├── user.repository.prisma.ts
│   │   └── user.routes.ts
│   ├── orders/
│   │   └── import/
│   ├── achievements/
│   ├── kudos/
│   ├── feed/
│   └── admin/
├── shared/
│   ├── prisma.ts
│   ├── errors/
│   ├── utils/
│   ├── jobs/
│   └── websocket/
├── app.ts
└── server.ts
```

---

## 📝 Notes

- **Architecture:** Repository Pattern (Import Adapters + CRUD)
- **PostgreSQL:** Основная продовая база (Render.com Managed PostgreSQL)
- **BigQuery:** Внешний источник данных (Emplanner API), заменит ручной парсинг
- **Current import:** Manual Emplanner endpoint scraping via browser DevTools
- **Future import:** Emplanner API → BigQuery → daily batch import
- **Preparation:** All DB access through interfaces, Prisma only in repository implementations
- **Historical data**: Skip — start from zero for fair gamification
- **Order roles**: `drafter` (executes) / `reviewer` (verifies) — flag on Order
- **Achievements**: JSONLogic conditions, recurring + one-time
- **Kudos**: Emoji + text, weekly limit, random pool refresh
- **Roles**: Dictionary-based (`DRAFTER`, `TEAMLEAD`, `MEMBER`, `ADMIN`, `SUPERADMIN`), many-to-many

---

*Updated: 2026-08-12 — All phases complete except Phase 6. Phase 6 documented with data sources (Emplanner, Slack, Google Sheets, DS Shop). Ready for deployment!* 
