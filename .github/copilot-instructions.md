# BinderUA AI Coding Agent Instructions

## Architecture Overview

**BinderUA** is a time tracking & cost reporting system with tri-lingual support (Polish, Ukrainian, English). The stack comprises:
- **Backend**: Spring Boot 3.5.8 + Java 21, PostgreSQL 16, JWT auth, Flyway migrations
- **Frontend**: React 19 + TypeScript + Vite, TailwindCSS, react-i18next
# BinderUA — Copilot / AI Agent Instructions

Purpose: give an AI coding agent the minimum, high-value knowledge to be productive in this repo.

**Big picture**
- Backend: Spring Boot app in [backend/src/main/java/com/timetracker/](backend/src/main/java/com/timetracker/) (entities, services, controllers, security).
- Frontend: Vite + React in [frontend/src/](frontend/src/) with i18n JSONs at [frontend/public/locales/](frontend/public/locales/).
- DB: PostgreSQL, migrations in [backend/src/main/resources/db/migration/](backend/src/main/resources/db/migration/).

**Why things are organized this way (short)**
- i18n and currency formatting are first-class concerns (Ukrainian formatting uses space grouping and comma decimal). See [backend/src/main/java/com/timetracker/service/CurrencyService.java](backend/src/main/java/com/timetracker/service/CurrencyService.java) and frontend locale files.
- Cost logic lives in services (e.g. `ReportService`) because formulas depend on contract type (UoP vs B2B) and config (`binderua.rates.monthly-hours`).
- Security is centralized (JWT + filters + `@PreAuthorize`) to keep controllers thin.

**Essential workflows and commands**
- Start backend (dev):
  - cd backend
  - mvn spring-boot:run
  - PostgreSQL must be available (see [SETUP_GUIDE.md](SETUP_GUIDE.md)).
- Build backend jar:
  - cd backend
  - mvn -DskipTests clean package
  - java -jar target\binderua-backend-1.0.0.jar
- Frontend dev:
  - cd frontend
  - npm install
  - npm run dev (Vite runs on port 3000)

**Project-specific conventions (do not diverge)**
- Lombok for entities: use `@Data`, `@Builder`, `@NoArgsConstructor`, `@AllArgsConstructor` in [backend/src/main/java/com/timetracker/entity/](backend/src/main/java/com/timetracker/entity/).
- Flyway migrations are immutable: never edit existing `V*.sql` files; add a new `V{N+1}__*.sql` for schema changes.
- Role names are Polish enums (`PRACOWNIK`, `MANAGER`, `DYREKTOR`); use the `Role` enum rather than hardcoded strings.
- Passwords must never be returned in DTOs (`@JsonIgnore` on password fields).

**Key integration points and files**
- Security: [backend/src/main/java/com/timetracker/security/SecurityConfig.java](backend/src/main/java/com/timetracker/security/SecurityConfig.java), [JwtUtil.java](backend/src/main/java/com/timetracker/security/JwtUtil.java), [JwtAuthenticationFilter.java](backend/src/main/java/com/timetracker/security/JwtAuthenticationFilter.java).
- Cost & currency: [backend/src/main/java/com/timetracker/service/ReportService.java](backend/src/main/java/com/timetracker/service/ReportService.java), [CurrencyService.java](backend/src/main/java/com/timetracker/service/CurrencyService.java).
- Frontend API: [frontend/src/lib/api.ts](frontend/src/lib/api.ts) — adds `Accept-Language` and `Authorization` headers; update when changing auth flow.

**Quick how-to (adding entities / endpoints)**
- Add entity under [backend/src/main/java/com/timetracker/entity/](backend/src/main/java/com/timetracker/entity/), add repository (extends `JpaRepository`), create service methods, add controller with `@PreAuthorize` as needed, then create a Flyway migration SQL in [backend/src/main/resources/db/migration/](backend/src/main/resources/db/migration/).
- When adding frontend calls, update [frontend/src/lib/api.ts](frontend/src/lib/api.ts) typings and add translations in [frontend/public/locales/](frontend/public/locales/).

**Testing & debugging tips**
- Use the seeded users from `V4__seed_test_data.sql` for quick auth testing (admin/manager/employee). Credentials are listed in the repo docs.
- If authentication fails, inspect CORS and JWT settings in [backend/src/main/resources/application.yml](backend/src/main/resources/application.yml) and `SecurityConfig.java`.

If something is unclear or you want more detail (examples, common PR patterns, or a short checklist for code changes), tell me which area to expand.

4. **Flyway migrations are immutable** - create new versions, never edit existing
5. **JWT tokens in localStorage** - frontend stores both token and user object
6. **Date handling**: Use `LocalDate` (backend) and `date-fns` (frontend), not timezone-aware types
7. **Missing comments** - Always document business logic, especially cost calculations and i18n handling

## Key Files Reference

- **Security setup**: `backend/src/main/java/com/timetracker/security/SecurityConfig.java`
- **API client config**: `frontend/src/lib/api.ts`
- **Main config**: `backend/src/main/resources/application.yml`
- **Cost calculations**: `backend/src/main/java/com/timetracker/service/ReportService.java`
- **Currency formatting**: `backend/src/main/java/com/timetracker/service/CurrencyService.java`
- **Setup guides**: `README.md`, `SETUP_GUIDE.md`, `IMPLEMENTATION_GUIDE.md`

## Quick Reference: Common Tasks

**Add new translation key**: Edit `frontend/public/locales/{pl,en,ua}/translation.json` + use via `t('key')` hook  
**Change currency rate**: Update `binderua.rates.pl-to-uah` in `application.yml`  
**Add new role permission**: Update `@PreAuthorize` in controller + test with appropriate user  
**Debug auth issues**: Check `SecurityConfig` CORS settings and JWT token expiration (`binderua.jwt.expiration-ms`)  
**Add database column**: Create new Flyway migration `V{next}__add_{column}_to_{table}.sql`
