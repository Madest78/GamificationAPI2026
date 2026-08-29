# Graph Report - DSPeopleBack  (2026-08-26)

## Corpus Check
- 149 files · ~61,500 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1217 nodes · 1872 edges · 213 communities (34 shown, 179 thin omitted)
- Extraction: 94% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 101 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Authentication & Google OAuth
- Prisma Driver Adapter Interfaces
- Backend Package Manifest
- Achievements Module
- Prisma Compute Deploy CLI
- npm Transitive Dependencies
- Kudos Module
- Job Queue & Scheduler
- Prisma Client API Patterns
- Phase 6 Data Source Imports
- Accelerate & PG Adapter Setup
- Feed & Follows Module
- Database Provider Setup
- Backend TS Config
- MongoDB Upgrade Mapping
- App Wiring & Services
- Feed Router & Validation
- App Error Hierarchy
- Frontend TS Config
- Admin Routes & Seed Data
- Auth Repository Layer
- Emplanner Integration
- Sync Routes & Auth Middleware
- User Repo & Token Verify
- Prisma User Repository
- env
- auth.repository
- package
- admin.service
- auth.service
- auth.service.test
- admin.interface
- user.interface
- vitest.config
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- vite.config
- PLAN
- PLAN
- PLAN
- SKILL
- SKILL
- removed-features
- Community 208
- Community 209
- Community 210
- Community 211
- Community 212

## God Nodes (most connected - your core abstractions)
1. `UserRepository` - 33 edges
2. `Prisma CLI Skill` - 21 edges
3. `AchievementRepository` - 18 edges
4. `compilerOptions` - 17 edges
5. `PrismaUserRepository` - 17 edges
6. `PrismaAchievementRepository` - 16 edges
7. `PrismaKudosRepository` - 15 edges
8. `app deploy Command` - 15 edges
9. `AdminService` - 14 edges
10. `AchievementDefDto` - 14 edges

## Surprising Connections (you probably didn't know these)
- `Prisma Client Singleton (src/shared/prisma.ts)` --semantically_similar_to--> `globalThis Prisma Singleton Pattern`  [INFERRED] [semantically similar]
  ROADMAP.md → Backend/.agents/skills/prisma-upgrade-v7/references/driver-adapters.md
- `Driver Adapter Wiring (adapter option)` --semantically_similar_to--> `Prisma Driver Adapter Workflow`  [INFERRED] [semantically similar]
  Backend/.agents/skills/prisma-client-api/references/constructor.md → Backend/.agents/skills/prisma-database-setup/SKILL.md
- `Seed Roles Script (prisma/seed.ts)` --references--> `prisma.config.ts`  [INFERRED]
  .opencode/plans/PLAN.md → Backend/.agents/skills/prisma-cli/SKILL.md
- `Prisma Schema (prisma/schema.prisma)` --conceptually_related_to--> `schema.prisma`  [INFERRED]
  .opencode/plans/PLAN.md → Backend/.agents/skills/prisma-cli/SKILL.md
- `Gamification DS Landing Page` --conceptually_related_to--> `ALLOWED_DOMAINS Env Var`  [INFERRED]
  Frontend/index.html → render.yaml

## Import Cycles
- 1-file cycle: `Backend/src/shared/middleware/validate.ts -> Backend/src/shared/middleware/validate.ts`
- 1-file cycle: `Backend/src/shared/jobs/queue.ts -> Backend/src/shared/jobs/queue.ts`
- 1-file cycle: `Backend/src/shared/websocket/server.ts -> Backend/src/shared/websocket/server.ts`
- 1-file cycle: `Backend/src/shared/middleware/requestId.ts -> Backend/src/shared/middleware/requestId.ts`
- 1-file cycle: `Backend/src/app.ts -> Backend/src/app.ts`
- 1-file cycle: `Backend/src/shared/prisma.ts -> Backend/src/shared/prisma.ts`
- 1-file cycle: `Backend/src/modules/kudos/__tests__/kudos.service.test.ts -> Backend/src/modules/kudos/__tests__/kudos.service.test.ts`
- 1-file cycle: `Backend/src/utils/asyncHandler.ts -> Backend/src/utils/asyncHandler.ts`
- 1-file cycle: `Backend/src/index.ts -> Backend/src/index.ts`
- 1-file cycle: `Backend/src/seed/seed.ts -> Backend/src/seed/seed.ts`
- 1-file cycle: `Backend/src/shared/jobs/scheduler.ts -> Backend/src/shared/jobs/scheduler.ts`
- 1-file cycle: `Frontend/vite.config.ts -> Frontend/vite.config.ts`
- 1-file cycle: `Backend/prisma.config.ts -> Backend/prisma.config.ts`
- 1-file cycle: `Backend/vitest.config.ts -> Backend/vitest.config.ts`
- 3-file cycle: `Backend/src/app.ts -> Backend/src/config/env.ts -> Backend/src/index.ts -> Backend/src/app.ts`
- 3-file cycle: `Backend/src/config/env.ts -> Backend/src/index.ts -> Backend/src/shared/websocket/server.ts -> Backend/src/config/env.ts`
- 4-file cycle: `Backend/src/app.ts -> Backend/src/modules/auth/auth.service.ts -> Backend/src/config/env.ts -> Backend/src/index.ts -> Backend/src/app.ts`
- 4-file cycle: `Backend/src/app.ts -> Backend/src/modules/auth/auth.middleware.ts -> Backend/src/config/env.ts -> Backend/src/index.ts -> Backend/src/app.ts`
- 4-file cycle: `Backend/src/app.ts -> Backend/src/modules/auth/auth.routes.ts -> Backend/src/config/env.ts -> Backend/src/index.ts -> Backend/src/app.ts`
- 4-file cycle: `Backend/src/config/env.ts -> Backend/src/index.ts -> Backend/src/shared/websocket/index.ts -> Backend/src/shared/websocket/server.ts -> Backend/src/config/env.ts`

## Hyperedges (group relationships)
- **Bearer Auth & Token Refresh Flow** — frontend_dashboard_api_helper, frontend_dashboard_token_refresh_flow, frontend_dashboard_endpoint_auth_refresh, frontend_dashboard_localstorage_tokens [EXTRACTED 1.00]
- **Compute App Deployment Workflow** — backend__agents_skills_prisma_compute_skill_app_deploy_command, backend__agents_skills_prisma_compute_references_compute_config_prisma_compute_ts, backend__agents_skills_prisma_compute_skill_prisma_service_token, backend__agents_skills_prisma_compute_skill_auth_workspace_commands, backend__agents_skills_prisma_compute_references_app_deploy_cli_branch_scope [EXTRACTED 1.00]
- **Dashboard Initialization Flow** — frontend_dashboard_init, frontend_dashboard_endpoint_users_me, frontend_dashboard_endpoint_teams, frontend_dashboard_render_user, frontend_dashboard_render_teams [EXTRACTED 1.00]
- **Prisma v7 Driver Adapter Architecture** — backend__agents_skills_prisma_driver_adapter_implementation_skill_sqldriveradapter, backend__agents_skills_prisma_driver_adapter_implementation_skill_sqlmigrationawaredriveradapterfactory, backend__agents_skills_prisma_driver_adapter_implementation_skill_transaction, backend__agents_skills_prisma_driver_adapter_implementation_skill_prismaclient [EXTRACTED 1.00]
- **DSPeople Google OAuth -> One-Time Code -> JWT Auth Flow** — _opencode_plans_plan_google_oauth_module, _opencode_plans_plan_login_code, _opencode_plans_plan_jwt_utils, _opencode_plans_plan_jti_revocation, _opencode_plans_plan_auth_service [EXTRACTED 1.00]
- **Prisma v7 Explicit Post-Migration Follow-up Workflow (migrate dev -> generate -> db seed)** — backend__agents_skills_prisma_cli_references_migrate_dev_prisma_migrate_dev, backend__agents_skills_prisma_cli_references_generate_prisma_generate, backend__agents_skills_prisma_cli_references_db_seed_prisma_db_seed [EXTRACTED 1.00]
- **v6 to Prisma Next Staged Cutover Verification** — backend__agents_skills_prisma_mongodb_upgrade_references_verify_cutover_checklist, backend__agents_skills_prisma_mongodb_upgrade_references_schema_contract_mapping, backend__agents_skills_prisma_mongodb_upgrade_references_client_api_mapping, backend__agents_skills_prisma_mongodb_upgrade_references_migrations_mapping [EXTRACTED 1.00]
- **Prisma Postgres Provisioning Surfaces** — backend__agents_skills_prisma_postgres_references_management_api, backend__agents_skills_prisma_postgres_references_management_api_sdk, backend__agents_skills_prisma_postgres_references_console_and_connections [EXTRACTED 1.00]
- **Prisma Transaction System** — backend__agents_skills_prisma_client_api_references_transactions_sequential_transactions, backend__agents_skills_prisma_client_api_references_transactions_interactive_transactions, backend__agents_skills_prisma_client_api_references_transactions_isolation_levels, backend__agents_skills_prisma_client_api_references_transactions_transaction_client, backend__agents_skills_prisma_client_api_references_relations_nested_writes [EXTRACTED 1.00]
- **Prisma v7 Breaking Change Set** — backend__agents_skills_prisma_upgrade_v7_skill_prisma_client_generator, backend__agents_skills_prisma_upgrade_v7_skill_driver_adapters, backend__agents_skills_prisma_upgrade_v7_skill_prisma_config_ts, backend__agents_skills_prisma_upgrade_v7_skill_explicit_environment_loading, backend__agents_skills_prisma_upgrade_v7_skill_generated_client_entrypoints, backend__agents_skills_prisma_upgrade_v7_references_esm_support_esm_first_module_format [EXTRACTED 1.00]
- **Source Adapter Import Pipeline** — database_phase6_data_sources_source_adapter_interface, database_phase6_data_sources_emplanner_adapter, database_phase6_data_sources_slack_adapter, database_phase6_data_sources_google_sheets_adapter, database_phase6_data_sources_ds_shop_adapter, database_phase6_data_sources_import_cron_jobs, database_phase6_data_sources_import_batch_model [EXTRACTED 1.00]
- **Dashboard Cards Composition** — frontend_dashboard_render_user, frontend_dashboard_render_teams, frontend_dashboard_profile_card, frontend_dashboard_roles_display, frontend_dashboard_specializations_card, frontend_dashboard_my_team_card, frontend_dashboard_emplanner_teams_card, frontend_dashboard_emplanner_info_card [INFERRED 0.85]
- **Prisma Driver Adapter Ecosystem Across Databases** — backend__agents_skills_prisma_database_setup_skill_driver_adapter_workflow, backend__agents_skills_prisma_database_setup_references_postgresql_adapter_pg, backend__agents_skills_prisma_database_setup_references_mysql_adapter_mariadb, backend__agents_skills_prisma_database_setup_references_sqlite_adapter_better_sqlite3, backend__agents_skills_prisma_database_setup_references_sqlite_adapter_libsql_turso, backend__agents_skills_prisma_database_setup_references_sqlserver_adapter_mssql, backend__agents_skills_prisma_database_setup_references_prisma_postgres_adapter_ppg_serverless [INFERRED 0.85]
- **Production Migration Pipeline (status -> deploy -> resolve/diff recovery)** — backend__agents_skills_prisma_cli_references_migrate_deploy_prisma_migrate_deploy, backend__agents_skills_prisma_cli_references_migrate_status_prisma_migrate_status, backend__agents_skills_prisma_cli_references_migrate_resolve_prisma_migrate_resolve, backend__agents_skills_prisma_cli_references_migrate_diff_prisma_migrate_diff [INFERRED 0.95]

## Communities (213 total, 179 thin omitted)

### Community 0 - "Authentication & Google OAuth"
Cohesion: 0.09
Nodes (52): AccessTokenPayload {userId, email, roles, jti}, Auth Middleware (verifyToken/requireAuth/requireRole), AuthRepository Interface, Auth Service (src/modules/auth/service.ts), DataFlow Auth Pattern (one-time code -> JWT Bearer), DataFlow Backend Blueprint, Corporate Domain Restriction (ALLOWED_DOMAINS), Config Validation (src/config/env.ts) (+44 more)

### Community 1 - "Prisma Driver Adapter Interfaces"
Cohesion: 0.09
Nodes (11): AchievementDefDto, CreateAchievementDefDto, createAchievementDefSchema, UpdateAchievementDefDto, updateAchievementDefSchema, UserAchievementDto, AchievementRepository, PrismaAchievementRepository (+3 more)

### Community 2 - "Backend Package Manifest"
Cohesion: 0.07
Nodes (29): createSyncRouter(), createUserRouter(), EmplannerAdapter, EmplannerApiResponse, EmplannerUser, SessionResponse, mapEmplannerTeamsToRoles(), MappingResult (+21 more)

### Community 3 - "Achievements Module"
Cohesion: 0.06
Nodes (45): Prisma 7 Driver Adapter Implementation Guide, Driver Error Mapping (MappedError), PrismaClient (v7 adapter-based), SqlDriverAdapter, SqlMigrationAwareDriverAdapterFactory, SqlQueryable, Transaction (driver adapter interface), Transaction Lifecycle Protocol (hooks only) (+37 more)

### Community 4 - "Prisma Compute Deploy CLI"
Cohesion: 0.07
Nodes (44): agent install/update/status Commands, Branch Scope Alignment (app/database/env), build logs vs app logs Distinction, Custom Domain Commands, Deployment Promotion (--no-promote / app promote), GitHub Push-to-Deploy Integration, Local Auth and CLI State Files (.prisma/local.json, cli/state.json), defineComputeConfig (+36 more)

### Community 5 - "npm Transitive Dependencies"
Cohesion: 0.05
Nodes (43): agent-base, dependencies, agent-base, better-result, csstype, d3-array, d3-color, d3-shape (+35 more)

### Community 6 - "Kudos Module"
Cohesion: 0.08
Nodes (7): CreateRefreshTokenDto, createRefreshTokenSchema, RefreshTokenDto, AuthRepository, PrismaAuthRepository, AuthRouterDeps, AuthService

### Community 7 - "Job Queue & Scheduler"
Cohesion: 0.07
Nodes (39): $connect() / $disconnect() Lifecycle Methods, $extends() Client Extensions (client/model/query/result), $on() Query and Log Event Subscriptions, Prisma Namespace Type Utilities and satisfies Pattern, Driver Adapter Wiring (adapter option), PrismaClient Constructor Options, Prisma Client Singleton Pattern, SQL Commenter Plugins (comments option) (+31 more)

### Community 8 - "Prisma Client API Patterns"
Cohesion: 0.11
Nodes (10): External dep: Backend Src Generated Prisma Client Prismaclient, KudosTransactionDto, KudosTypeDto, SendKudosDto, sendKudosSchema, UserKudosBalanceDto, KudosRepository, PrismaKudosRepository (+2 more)

### Community 9 - "Phase 6 Data Source Imports"
Cohesion: 0.08
Nodes (29): achievementRepo, achievementService, adminService, allowedOrigins, authLimiter, authRepo, authService, feedRepo (+21 more)

### Community 10 - "Accelerate & PG Adapter Setup"
Cohesion: 0.09
Nodes (8): FeedItemDto, FollowDto, FollowUserDto, followUserSchema, FeedRepository, PrismaFeedRepository, FeedRouterDeps, FeedService

### Community 11 - "Feed & Follows Module"
Cohesion: 0.09
Nodes (31): accelerateUrl Client Setup, Accelerate Cache Strategy, Prisma Accelerate, @prisma/extension-accelerate, Adapter Connection Pool Configuration, globalThis Prisma Singleton Pattern, PrismaPg Adapter (@prisma/adapter-pg), Adapter SSL Configuration (+23 more)

### Community 12 - "Database Provider Setup"
Cohesion: 0.09
Nodes (30): Auth Callback Page (auth.html), localStorage Token Storage, API Fetch Helper Function, Gamification DS Dashboard Page, Emplanner Info Card, Emplanner Teams Card, /api/auth/refresh Endpoint Usage, /api/teams Endpoint Usage (+22 more)

### Community 13 - "Backend TS Config"
Cohesion: 0.14
Nodes (27): prisma.compute.ts vs prisma.config.ts Separation, CockroachDB Provider Setup, cockroachdb Provider String Requirement (Postgres wire protocol caveat), MongoDB db push / db pull Workflow (no migrations), MongoDB Provider Setup (Prisma 6.x), MongoDB _id ObjectId Mapping (@map/_id, @db.ObjectId), @prisma/adapter-mariadb, MySQL/MariaDB Provider Setup (+19 more)

### Community 14 - "MongoDB Upgrade Mapping"
Cohesion: 0.07
Nodes (26): compilerOptions, declaration, declarationMap, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution (+18 more)

### Community 15 - "App Wiring & Services"
Cohesion: 0.12
Nodes (26): client-api-mapping, MongoDB Driver Session Transactions, mongoRaw(...) Raw Lane, Collection Storage Name Addressing (db.orm.users), Typed Aggregation Pipeline Builder (db.query), decision-stay-or-migrate, Pre-Migration Blocker Checks, Stay-on-v6 Hygiene (+18 more)

### Community 16 - "Feed Router & Validation"
Cohesion: 0.17
Nodes (7): AppError, BadRequestError, ConflictError, ForbiddenError, InternalServerError, NotFoundError, UnauthorizedError

### Community 17 - "App Error Hierarchy"
Cohesion: 0.17
Nodes (7): External dep: Backend Src Generated Prisma Client, CreateUserDto, createUserSchema, UpdateUserDto, updateUserSchema, UserDto, PrismaUserRepository

### Community 18 - "Frontend TS Config"
Cohesion: 0.17
Nodes (15): AuthRequest, requireAuth(), createAuthRouter(), refreshSchema, createFeedRouter(), followSchema, paginationSchema, createKudosRouter() (+7 more)

### Community 19 - "Admin Routes & Seed Data"
Cohesion: 0.17
Nodes (22): DsShopAdapter, DS Shop Source (Google Cloud/BigQuery), EmplannerAdapter, Emplanner Data Source, GoogleSheetsAdapter, Google Sheets Data Source, ImportBatch Model, Import Cron Jobs (+14 more)

### Community 20 - "Auth Repository Layer"
Cohesion: 0.11
Nodes (19): devDependencies, prisma, tsc-alias, @types/express, @types/express-rate-limit, @types/helmet, @types/node, @types/pino (+11 more)

### Community 21 - "Emplanner Integration"
Cohesion: 0.12
Nodes (6): AdminRouterDeps, paginationSchema, roleSchema, specializationSchema, userSpecializationSchema, AdminService

### Community 22 - "Sync Routes & Auth Middleware"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, lib, module, moduleDetection, moduleResolution, noEmit, noFallthroughCasesInSwitch (+10 more)

### Community 23 - "User Repo & Token Verify"
Cohesion: 0.16
Nodes (14): app, initializeJobs(), shutdown(), main(), AuthenticatedSocket, broadcast(), handleMessage(), sendToUser() (+6 more)

### Community 24 - "Prisma User Repository"
Cohesion: 0.17
Nodes (8): env, envSchema, parsed, GoogleUserInfo, SlackAdapter, SlackUser, SlackUsersResponse, External dep: Jose

### Community 25 - "env"
Cohesion: 0.16
Nodes (3): createVerifyToken(), UserRepository, SlackSyncService

### Community 26 - "auth.repository"
Cohesion: 0.18
Nodes (10): author, description, keywords, license, main, name, prisma, seed (+2 more)

### Community 27 - "package"
Cohesion: 0.27
Nodes (7): updateProfileSchema, UserRouterDeps, failedSyncCache, recordSyncFailure(), recordSyncSuccess(), shouldAttemptSync(), SyncAttempt

### Community 28 - "admin.service"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, preview, type, version

### Community 29 - "auth.service"
Cohesion: 0.25
Nodes (8): scripts, build, db:seed, dev, postinstall, start, test, test:watch

### Community 30 - "auth.service.test"
Cohesion: 0.29
Nodes (6): CreateSpecializationDto, createSpecializationSchema, UpdateUserRoleDto, updateUserRoleSchema, UpdateUserSpecializationDto, updateUserSpecializationSchema

### Community 31 - "admin.interface"
Cohesion: 0.29
Nodes (5): achievementDefSchema, kudosTypeSchema, roleSchema, specializationSchema, External dep: Node Fs

### Community 32 - "user.interface"
Cohesion: 0.33
Nodes (6): typescript, typescript, devDependencies, typescript, vite, vite

### Community 33 - "vitest.config"
Cohesion: 0.47
Nodes (3): logger(), requestId(), External dep: Node Crypto

## Ambiguous Edges - Review These
- `Prisma CLI Skill` → `prisma-compute Skill`  [AMBIGUOUS]
  Backend/.agents/skills/prisma-cli/SKILL.md · relation: references
- `Prisma Driver Adapter Workflow` → `MongoDB Provider Setup (Prisma 6.x)`  [AMBIGUOUS]
  Backend/.agents/skills/prisma-database-setup/SKILL.md · relation: conceptually_related_to

## Knowledge Gaps
- **424 isolated node(s):** `SyncAttempt`, `ValidationTarget`, `AsyncHandler`, `EmplannerTeamsJson`, `TeamDirectoryEntry` (+419 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **179 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Prisma CLI Skill` and `prisma-compute Skill`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **What is the exact relationship between `Prisma Driver Adapter Workflow` and `MongoDB Provider Setup (Prisma 6.x)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `dependencies` connect `npm Transitive Dependencies` to `auth.repository`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `vite.config`?**
  _High betweenness centrality (0.143) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `Auth Repository Layer` to `user.interface`, `PLAN`, `PLAN`, `PLAN`, `auth.repository`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Why does `UserRepository` connect `env` to `Prisma Driver Adapter Interfaces`, `Backend Package Manifest`, `Kudos Module`, `Prisma Client API Patterns`, `Accelerate & PG Adapter Setup`, `Feed Router & Validation`, `App Error Hierarchy`, `Frontend TS Config`, `Emplanner Integration`, `Prisma User Repository`, `package`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **What connects `SyncAttempt`, `ValidationTarget`, `AsyncHandler` to the rest of the system?**
  _424 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Authentication & Google OAuth` be split into smaller, more focused modules?**
  _Cohesion score 0.09125188536953242 - nodes in this community are weakly interconnected._