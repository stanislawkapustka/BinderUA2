## Plan: BinderUA Production Web App

A full-stack, production-ready time-tracking and cost-reporting app with multi-language support and currency formatting. Backend: Spring Boot 3 + PostgreSQL 16 with JWT security, Flyway migrations, i18n, and Excel export. Frontend: React 18 + TypeScript strict with Vite, Tailwind, react-query, react-hook-form + Zod, axios interceptor (JWT + Accept-Language), responsive UI, and role-based features. Docker Compose orchestrates Postgres, backend, and frontend. Includes test fixtures, seed users (admin/manager/employee), and a README with quick start.

### Steps
1. Scaffold backend with Maven, profiles, Flyway, and MessageSource i18n in backend/src/main/resources/messages.
2. Define entities/enums in backend/src/main/java/com/timetracker/entities (User, Project, TimeEntry, Role, ContractType, Language, Status).
3. Implement repositories/services/controllers in backend/src/main/java/com/timetracker with DTOs, validation, and @PreAuthorize.
4. Configure security in backend/src/main/java/com/timetracker/security: SecurityConfig, JwtUtil, JwtAuthenticationFilter, PasswordConfig.
5. Build reporting and Excel export in backend/src/main/java/com/timetracker/report using Apache POI with i18n headers.
6. Write Flyway migrations in backend/src/main/resources/db/migration including seed users/projects/time entries.
7. Scaffold frontend (Vite React TS strict), Tailwind, HeadlessUI, router, i18n (react-i18next + http backend) in frontend.
8. Create axios service in frontend/src/services/api.ts with JWT + Accept-Language; configure TanStack Query keys by role/lang.
9. Implement core components, forms, and hooks in frontend/src/components and frontend/src/hooks with Zod validation and accessibility.
10. Add Docker Compose in docker/docker-compose.yml, env samples, and document Quick Start in README.md.
11. Add minimal tests: backend unit/integration and frontend component/integration with fixtures.

### Backend Architecture
- Layout: backend/pom.xml, backend/src/main/java/com/timetracker, backend/src/main/resources.
- Packages:
  - config: MessageSourceConfig, FlywayConfig, CorsConfig.
  - security: SecurityConfig, JwtUtil, JwtAuthenticationFilter, PasswordConfig, rate limiting filter.
  - entities: User, Project, TimeEntry, enums.
  - dto: UserDto, TimeEntryDto, ReportDto, AuthRequest, AuthResponse, ErrorResponse.
  - repository: UserRepository, ProjectRepository, TimeEntryRepository.
  - service: UserService, TimeEntryService, ReportService, ExcelService, AuthService, CurrencyService.
  - controller: AuthController, ProjectController, TimeController, ReportController, UserController.
  - common: GlobalExceptionHandler, validation utilities, ownership checks.
- Config keys in backend/src/main/resources/application.yml: inderua.jwt.secret, inderua.rates.plToUah=10.5, inderua.locale.default, inderua.security.rateLimitPerMin, spring.jpa.hibernate.ddl-auto=none.

### Data Model (JPA Entities)
- User: id, username, email, firstName, lastName, password (BCrypt), role, contractType, uopGrossRate, b2bHourlyNetRate, language, createdAt.
- Project: id, name, description, managerId; future subprojects; referenced by TimeEntry.subprojectId.
- TimeEntry: id, userId, projectId, subprojectId, date, hoursFrom, hoursTo, totalHours, description, status, approvedBy, createdAt, updatedAt.
- Enums as strings: Role {PRACOWNIK, MANAGER, DYREKTOR}, ContractType {UOP, B2B}, Language {PL, EN, UA}, Status {ZGLOSZONY, ZATWIERDZONY, ODRZUCONY}.
- Migrations: backend/src/main/resources/db/migration/V1__users.sql, V2__projects.sql, V3__time_entries.sql, V4__seed_data.sql.

### REST API Contract
- Auth:
  - POST /api/auth/login: AuthRequest{username,password} → AuthResponse{token,role,language,expiresAt}; rate limited.
  - POST /api/auth/register: @Valid UserDto; BCrypt; default role PRACOWNIK.
- Projects:
  - GET/POST/PUT/DELETE /api/projects @PreAuthorize("hasRole('MANAGER') or hasRole('DYREKTOR')"); unique name; manager ownership checks.
- Time Entries:
  - POST /api/time-entries: @Valid TimeEntryDto; prevent overlaps; compute 	otalHours if hoursFrom/hoursTo; status ZGLOSZONY.
  - GET /api/time-entries/user/{userId}/month/{year}/{month}: self/manager/director access.
  - PUT /api/time-entries/{id}/approve @PreAuthorize("hasRole('MANAGER')"): set Status=ZATWIERDZONY, pprovedBy.
- Reports:
  - GET /api/reports/monthly: year,month,userId?,projectId?,lang → ReportDto with items, totals, raw + formatted currency.
  - GET /api/reports/yearly: year,lang → totals per project/user.
  - GET /api/export/monthly/{reportId}: lang → Excel.
- Users:
  - GET /api/users @PreAuthorize("hasRole('DYREKTOR')"): paginated list.

### Cost Calculation & Currency
- UoP: 	totalHours * (uopGrossRate / 160); configurable inderua.rates.monthlyHours=160.
- B2B: 	totalHours * b2bHourlyNetRate.
- Locales/currencies: PLN (PL), USD (EN), UAH (UA); PLN→UAH rate 10.5. UA currencies default
- UA format: 1 234,56 ₴; BigDecimal backend; frontend Intl.NumberFormat for pl-PL, en-US, uk-UA.

### Internationalization
- Backend MessageSource: messages_pl.properties, messages_en.properties, messages_ua.properties; Accept-Language resolver.
- Frontend: 
eact-i18next + i18n-http-backend; translations in frontend/src/translations: pl.json, en.json, ua.json; LanguageSwitcher.

### Frontend Structure & Features
- Config: frontend/package.json, frontend/vite.config.ts, frontend/tailwind.config.js, frontend/tsconfig.json strict.
- Types: frontend/src/types/User.ts, frontend/src/types/TimeEntry.ts, frontend/src/types/Report.ts.
- Context: frontend/src/context/UserContext.tsx, frontend/src/context/AuthContext.tsx.
- Services: frontend/src/services/api.ts with JWT + Accept-Language; global 401/403 toasts and redirects.
- Components: Calendar frontend/src/components/Calendar/MonthCalendar.tsx; TimeEntry frontend/src/components/TimeEntry/TimeEntryForm.tsx; Reports frontend/src/components/Reports/ReportTable.tsx, frontend/src/components/Reports/ExcelExportButton.tsx; UI frontend/src/components/LanguageSwitcher.tsx, frontend/src/components/UserProfile.tsx.
- Hooks: frontend/src/hooks/useTimeEntries.ts, frontend/src/hooks/useUserRates.ts.
- Router: Login, Dashboard, Projects, Time, Reports/:year/:month with ProtectedRoute.

### Security & Best Practices
- Dependencies: web, security, data-jpa, validation, postgresql, jjwt, Apache POI 5.x, Flyway.
- JWT stateless auth; CSRF disabled for API.
- BCrypt strength 12; password policy min 12 chars; lockout after 5 attempts.
- Rate limiting: configurable inderua.security.rateLimitPerMin.
- Security headers: X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, HSTS in prod.
- CORS: configured origins; allow Authorization, Accept-Language.

### Error Handling Strategy
- Backend GlobalExceptionHandler → ErrorResponse{timestamp,code,message,details,traceId}; localized.
- Frontend: map error codes → i18n toasts; field errors surfaced via RHF.

### Excel Export (Apache POI)
- Service in backend/src/main/java/com/timetracker/report/ExcelService.java; i18n headers; currency styles per locale; summary row; filename 
eport_<user>_<YYYY-MM>.xlsx.

### Docker Compose
- docker/docker-compose.yml: postgres:16 (db 	imetracker_db, user dmin, pass secret), ackend (8080), rontend (3000, proxy /api → backend); healthchecks, volumes.

### Seed & Test Data
- Users: Admin dmin/admin123 (DYREKTOR, PL), Manager manager/manager123 (MANAGER, EN), Employee employee/employee123 (PRACOWNIK, UA).
- Projects: Alpha (B2B), Bravo (UOP) managed by manager.
- Time Entries: 2025-12 sample across statuses and edge cases.
- Migration: backend/src/main/resources/db/migration/V4__seed_data.sql.

### README Quick Start
- Docker: docker-compose up -d postgres
- Backend: cd backend && mvn spring-boot:run
- Frontend: cd frontend && npm install && npm run dev
- Languages: PL/🇵🇱 EN/🇺🇸 UA/🇺🇦; Currency: 1 PLN = 10.5 UAH; Default admin: dmin/admin123.

### Minimal Tests
- Backend unit: UserService, TimeEntryService, ReportService.
- Backend integration: Auth/Time endpoints with JWT; Testcontainers Postgres.
- Frontend component: LoginForm, TimeEntryForm, ReportTable.
- Frontend integration: axios interceptors, protected routes, i18n switching; msw.

### Further Considerations
1. Subproject: add entity now or keep simple subprojectId until needed?
2. Monthly hours: fixed 160 vs configurable per month.
3. Currency conversion: server-side per requested lang vs client-side format from PLN base.
