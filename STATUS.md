# Статус проекта Gamification-DS

**Дата:** 20 августа 2026
**Этап:** Phase 11 — External Integrations ✅
**URL:** https://gamification-ds.onrender.com

---

## Инфраструктура

| Компонент | Значение |
|-----------|----------|
| Production URL | `https://gamification-ds.onrender.com` |
| GitHub repo | `FPScriptTeam/Gamification-ds` |
| DB | PostgreSQL 16 на Render (`gamification_ds_db`) |
| Frontend (dev) | `http://localhost:5173` |

---

## Выполнено (Phase 1 — Foundation) ✅

| Компонент | Статус |
|-----------|--------|
| TypeScript (tsconfig, ESM, strict, path aliases) | ✅ |
| Express 5 skeleton (app.ts, index.ts) | ✅ |
| Error handling (AppErrors.ts — 6 subclasses) | ✅ |
| Scripts (dev, build, start, postinstall) | ✅ |
| Health endpoint (GET /api/health) | ✅ |
| PostgreSQL on Render | ✅ |
| Config Validation (env.ts + Zod) | ✅ |
| Prisma models (14 моделей) | ✅ |
| Seed (5 ролей, 3 специализации, 8 kudos, 10 achievements) | ✅ |
| All repositories (User, Auth, Achievement, Kudos, Feed) | ✅ |
| Middleware (requestId, validate, logger) | ✅ |

---

## Выполнено (Phase 3 — Auth) ✅

| Компонент | Статус |
|-----------|--------|
| Google OAuth 2.0 (jose library) | ✅ Работает |
| JWT access token (15 мин) + refresh token (30 дней) | ✅ |
| Auth middleware (verifyToken, requireAuth, requireRole) | ✅ |
| Auth error page (auth-error.html) | ✅ |

---

## Выполнено (Phase 4 — Job Infrastructure) ✅

| Компонент | Статус |
|-----------|--------|
| node-cron scheduler | ✅ |
| pg-boss queue + workers | ✅ |
| Jobs: import.daily, achievements.check, kudos.reset | ✅ |
| Graceful shutdown (SIGINT/SIGTERM) | ✅ |

---

## Выполнено (Phase 5 — WebSocket) ✅

| Компонент | Статус |
|-----------|--------|
| ws library + JWT auth on connect | ✅ |
| Events (ping/pong, subscribe) | ✅ |

---

## Выполнено (Phase 7 — Achievements) ✅

| Компонент | Статус |
|-----------|--------|
| AchievementDef + UserAchievement models | ✅ |
| Service + Routes (GET, POST /check) | ✅ |
| JSONLogic conditions | ✅ |
| Seed: 10 achievements | ✅ |

---

## Выполнено (Phase 8 — Kudos) ✅

| Компонент | Статус |
|-----------|--------|
| KudosType, KudosTransaction, UserKudosBalance models | ✅ |
| Service + Routes (types, send, history, balance) | ✅ |
| Seed: 8 kudos types | ✅ |

---

## Выполнено (Phase 9 — Feed) ✅

| Компонент | Статус |
|-----------|--------|
| Follow model | ✅ |
| Service + Routes (follow, unfollow, feed, following, followers) | ✅ |

---

## Выполнено (Phase 10 — Admin) ✅

| Компонент | Статус |
|-----------|--------|
| Admin service + routes | ✅ |
| Управление пользователями, ролями, специализациями | ✅ |

---

## Выполнено (Phase 11 — External Integrations) ✅

| Компонент | Статус |
|-----------|--------|
| **Emplanner API** | |
| EmplannerAdapter (session auth, paginated search) | ✅ |
| EmplannerSyncService (all metrics) | ✅ |
| Auto-sync on GET /api/users/me | ✅ |
| Fields: uid, extraId, roles, tags, country, city, gender, teams, productivity, feedbackUrl | ✅ |
| Generic cooldown cache (5 min) | ✅ |
| **Slack API** | |
| SlackAdapter (Bot token, paginated users) | ✅ |
| SlackSyncService (slackId, avatarUrl) | ✅ |
| Auto-sync on GET /api/users/me | ✅ |
| **Google OAuth** | |
| Google OAuth callback → create/login user | ✅ |
| Redirect to frontend (localhost:5173) | ✅ |

---

## Phase 6: Orders & Import (ожидает доступа к Source DB) ⏳

| Компонент | Статус |
|-----------|--------|
| OrderSourceAdapter interface | ⏳ Ожидает |
| BigQuery adapter | ⏳ Ожидает |
| Import cron job | ⏳ Ожидает |

---

## Прогресс

```
Phase 1 (Foundation)     ████████████████████ 100%
Phase 3 (Auth)           ████████████████████ 100%
Phase 4 (Job Infra)      ████████████████████ 100%
Phase 5 (WebSocket)      ████████████████████ 100%
Phase 6 (Orders)         ░░░░░░░░░░░░░░░░░░░░   0% ⏳
Phase 7 (Achievements)   ████████████████████ 100%
Phase 8 (Kudos)          ████████████████████ 100%
Phase 9 (Feed)           ████████████████████ 100%
Phase 10 (Admin)         ████████████████████ 100%
Phase 11 (Integrations)  ████████████████████ 100%
```

**Общий прогресс: ~91%** (Phase 6 ожидает внешний API)

---

## API Endpoints

### Auth
| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/auth/google` | Редирект на Google OAuth |
| GET | `/api/auth/google/callback` | Обработка ответа от Google |
| POST | `/api/auth/refresh` | Обновление токенов |
| POST | `/api/auth/logout` | Выход |

### Users
| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/users/me` | Текущий профиль + автосинхронизация |
| PATCH | `/api/users/me` | Обновить профиль |
| DELETE | `/api/users/me` | Удалить профиль |
| POST | `/api/users/reset-slack` | Сбросить slackId |
| POST | `/api/users/sync-emplanner` | Принудительная синхронизация Emplanner |

### Achievements
| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/achievements` | Все определения достижений |
| GET | `/api/achievements/user/:userId` | Достижения пользователя |
| POST | `/api/achievements/check` | Проверить и выдать достижения |

### Kudos
| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/kudos/types` | Все типы kudos |
| POST | `/api/kudos/send` | Отправить kudos |
| GET | `/api/kudos/history` | История kudos |
| GET | `/api/kudos/balance` | Баланс пользователя |

### Feed
| Метод | Endpoint | Описание |
|-------|----------|----------|
| POST | `/api/feed/follow` | Подписаться |
| DELETE | `/api/feed/follow/:id` | Отписаться |
| GET | `/api/feed` | Лента |
| GET | `/api/feed/following` | Подписки |
| GET | `/api/feed/followers` | Подписчики |

### Admin
| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/admin/users` | Все пользователи |
| GET | `/api/admin/users/:id` | Пользователь по ID |
| POST | `/api/admin/users/:id/roles` | Назначить роль |
| DELETE | `/api/admin/users/:id/roles/:code` | Удалить роль |
| GET | `/api/admin/specializations` | Все специализации |
| POST | `/api/admin/specializations` | Создать специализацию |
| DELETE | `/api/admin/specializations/:id` | Удалить специализацию |
| POST | `/api/admin/users/:id/specializations` | Назначить специализацию |
| DELETE | `/api/admin/users/:id/specializations/:code` | Удалить специализацию |

---

## Prisma Schema — User поля

| Поле | Источник | Описание |
|------|----------|----------|
| id | System | CUID |
| email | Google | Корпоративный email |
| personalEmail | Emplanner | Gmail (если есть) |
| name | Google | Имя |
| avatarUrl | Google | Фото |
| googleId | Google | Google ID |
| emplannerUid | Emplanner | Internal ID |
| extraId | Emplanner | Contract number (XX-XXXXXXX) |
| slackId | Slack | Slack member ID |
| emplannerRoles | Emplanner | Roles array |
| emplannerTags | Emplanner | Tags array |
| emplannerCountry | Emplanner | Country |
| emplannerCity | Emplanner | City |
| emplannerGender | Emplanner | Gender |
| emplannerFired | Emplanner | Fired status |
| emplannerUtc | Emplanner | UTC offset |
| emplannerTeams | Emplanner | Teams (JSON) |
| emplannerProductivity | Emplanner | Productivity (JSON) |
| emplannerFeedbackUrl | Emplanner | Feedback Google Doc |
| emplannerHasOnlyTestLicenses | Emplanner | Test licenses flag |
| emplannerIsVcs | Emplanner | VCS flag |

---

## Следующие шаги

1. Phase 6 — Orders & Import (когда будет доступ к Source DB)
2. Slack Bot Token — получить реальный токен
3. Тестирование всех endpoints с реальными данными

---

## Замечания

- Все Phase кроме 6 завершены!
- Emplanner API: поиск по email prefix (email.split('@')[0])
- Session token кэшируется в памяти (EmplannerAdapter)
- Cooldown cache 5 мин для внешних API (Slack + Emplanner)
- PostgreSQL — основная продовая БД
- Google OAuth client ID: `411907228924-...`
