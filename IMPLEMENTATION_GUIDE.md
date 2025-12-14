# BinderUA Development Roadmap

## Completed (Step 1-4)
✅ Backend Maven pom.xml with Spring Boot 3, security, data-jpa, PostgreSQL, JWT, POI, Flyway
✅ Backend application.yml with dev/prod profiles, DB config, JWT secret, i18n, rate limiting, CORS
✅ Backend entities: User, Project, TimeEntry with enums (Role, ContractType, Language, Status)
✅ Backend DTOs: UserDto, AuthRequest, AuthResponse, TimeEntryDto, ReportDto, ErrorResponse

## Remaining Steps (5-21) - Implementation Guide

### Step 5: Backend Repositories
Create in `backend/src/main/java/com/timetracker/repository/`:
- `UserRepository extends JpaRepository<User, Long>` with:
  - `Optional<User> findByUsername(String username)`
  - `Optional<User> findByEmail(String email)`
  - `Page<User> findByRole(Role role, Pageable pageable)`
  
- `ProjectRepository extends JpaRepository<Project, Long>` with:
  - `Page<Project> findByManagerIdAndActive(Long managerId, boolean active, Pageable pageable)`
  - `List<Project> findByManagerId(Long managerId)`

- `TimeEntryRepository extends JpaRepository<TimeEntry, Long>` with:
  - `List<TimeEntry> findByUserIdAndDateBetween(Long userId, LocalDate from, LocalDate to)`
  - `Page<TimeEntry> findByUserIdAndDate(Long userId, LocalDate date, Pageable pageable)`
  - `List<TimeEntry> findByProjectIdAndDateBetween(Long projectId, LocalDate from, LocalDate to)`

### Step 6: Backend Security
Create in `backend/src/main/java/com/timetracker/security/`:
- **SecurityConfig.java**: Configure FilterChain with CORS, CSRF disabled, JWT filter, rate limiting
- **JwtUtil.java**: Methods `generateToken(User user)`, `validateToken(String token)`, `extractUsername(String token)`
- **JwtAuthenticationFilter.java**: Extends OncePerRequestFilter, extracts JWT from header, sets Authentication
- **PasswordConfig.java**: Configure BCryptPasswordEncoder with strength 12

### Step 7: Backend Services
Create in `backend/src/main/java/com/timetracker/service/`:

#### AuthService.java
```java
public AuthResponse login(AuthRequest request)
public User register(UserDto userDto)
```

#### UserService.java
```java
public Page<UserDto> getAllUsers(Pageable pageable)
public UserDto getUserById(Long id)
public void updateUserRoles(Long id, UserDto dto)
```

#### TimeEntryService.java
```java
public TimeEntryDto createEntry(TimeEntryDto dto)
public List<TimeEntryDto> getEntriesByUserAndMonth(Long userId, int year, int month)
public void approveEntry(Long id, Long approverId)
public void rejectEntry(Long id)
```

#### ReportService.java
```java
public ReportDto generateMonthlyReport(Long userId, int year, int month, String currency)
// Cost calculation:
// UOP: totalHours * (uopGrossRate / 160)
// B2B: totalHours * b2bHourlyNetRate
// Currency conversion: apply PLN→UAH rate if currency is UAH
```

#### ExcelService.java
```java
public byte[] exportToExcel(ReportDto report, String language)
// Use Apache POI XSSF to create workbook with:
// - Headers localized via MessageSource
// - Styles for currency per locale
// - Summary row with totals
// - Auto-sized columns
// - Filename: report_<user>_<YYYY-MM>.xlsx
```

#### CurrencyService.java
```java
public BigDecimal convertPLNtoUAH(BigDecimal plnAmount)
public String formatCurrency(BigDecimal amount, String language)
// Locales: pl-PL, en-US, uk-UA
// UA format: 1 234,56 ₴ (space thousands, comma decimal)
```

### Step 8: Backend Controllers
Create in `backend/src/main/java/com/timetracker/controller/`:

#### AuthController.java
```java
@PostMapping("/api/auth/login") 
public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest request)

@PostMapping("/api/auth/register")
public ResponseEntity<UserDto> register(@Valid @RequestBody UserDto userDto)
```

#### UserController.java
```java
@GetMapping("/api/users")
@PreAuthorize("hasRole('DYREKTOR')")
public Page<UserDto> getUsers(Pageable pageable)
```

#### ProjectController.java
```java
@GetMapping("/api/projects")
public Page<ProjectDto> getProjects(Pageable pageable)

@PostMapping("/api/projects")
@PreAuthorize("hasRole('MANAGER') or hasRole('DYREKTOR')")
public ResponseEntity<ProjectDto> createProject(@Valid @RequestBody ProjectDto dto)

@PutMapping("/api/projects/{id}")
@PreAuthorize("hasRole('MANAGER') or hasRole('DYREKTOR')")
public ResponseEntity<ProjectDto> updateProject(@PathVariable Long id, @Valid @RequestBody ProjectDto dto)
```

#### TimeController.java
```java
@PostMapping("/api/time-entries")
public ResponseEntity<TimeEntryDto> createEntry(@Valid @RequestBody TimeEntryDto dto)

@GetMapping("/api/time-entries/user/{userId}/month/{year}/{month}")
public List<TimeEntryDto> getEntries(@PathVariable Long userId, @PathVariable int year, @PathVariable int month)

@PutMapping("/api/time-entries/{id}/approve")
@PreAuthorize("hasRole('MANAGER')")
public ResponseEntity<TimeEntryDto> approveEntry(@PathVariable Long id)
```

#### ReportController.java
```java
@GetMapping("/api/reports/monthly")
public ReportDto getMonthlyReport(
    @RequestParam int year, @RequestParam int month,
    @RequestParam(required=false) Long userId,
    @RequestParam(required=false) Long projectId,
    @RequestParam(defaultValue="PLN") String lang)

@GetMapping("/api/export/monthly/{reportId}")
public ResponseEntity<byte[]> exportMonthly(@PathVariable Long reportId, @RequestParam String lang)
```

### Step 9: GlobalExceptionHandler
Create in `backend/src/main/java/com/timetracker/common/GlobalExceptionHandler.java`:
- Handle `MethodArgumentNotValidException` → return field errors
- Handle `ConstraintViolationException` → return field errors
- Handle `AccessDeniedException` → return 403 with code `access_denied`
- Handle `EntityNotFoundException` → return 404 with code `not_found`
- All responses use `ErrorResponse{code, message, details, traceId}` localized via `MessageSource`

### Step 10: MessageSource & i18n Config
Create in `backend/src/main/java/com/timetracker/config/MessageSourceConfig.java`:
```java
@Bean
public MessageSource messageSource() {
    ReloadableResourceBundleMessageSource messageSource = new ReloadableResourceBundleMessageSource();
    messageSource.setBasename("classpath:messages/messages");
    messageSource.setDefaultEncoding("UTF-8");
    messageSource.setCacheSeconds(3600);
    return messageSource;
}
```

Create properties files in `backend/src/main/resources/messages/`:
- `messages_pl.properties`: Polish error/validation messages
- `messages_en.properties`: English messages
- `messages_ua.properties`: Ukrainian messages

Example keys:
```
error.user_not_found=Użytkownik nie znaleziony
error.access_denied=Dostęp zabroniony
validation.required=Pole wymagane
report.header.date=Data
report.header.hours=Godziny
report.header.cost=Koszt
```

### Step 11: Flyway Migrations
Create in `backend/src/main/resources/db/migration/`:

**V1__users.sql**
```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(64) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    contract_type VARCHAR(50) NOT NULL,
    uop_gross_rate NUMERIC(10,2),
    b2b_hourly_net_rate NUMERIC(10,2),
    language VARCHAR(10) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_username ON users(username);
CREATE INDEX idx_email ON users(email);
```

**V2__projects.sql**
```sql
CREATE TABLE projects (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(1000),
    manager_id BIGINT NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_manager_id ON projects(manager_id);
```

**V3__time_entries.sql**
```sql
CREATE TABLE time_entries (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    project_id BIGINT NOT NULL,
    subproject_id BIGINT,
    date DATE NOT NULL,
    hours_from TIME,
    hours_to TIME,
    total_hours NUMERIC(5,2) NOT NULL,
    description VARCHAR(1000),
    status VARCHAR(50) NOT NULL DEFAULT 'ZGLOSZONY',
    approved_by BIGINT,
    approved_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_user_date ON time_entries(user_id, date);
CREATE INDEX idx_project_date ON time_entries(project_id, date);
CREATE INDEX idx_status ON time_entries(status);
```

**V4__seed_data.sql**
```sql
INSERT INTO users (username, email, first_name, last_name, password, role, contract_type, uop_gross_rate, b2b_hourly_net_rate, language)
VALUES
  ('admin', 'admin@binderua.com', 'Admin', 'User', '$2a$12$...hash...', 'DYREKTOR', 'UOP', 5000.00, NULL, 'PL'),
  ('manager', 'manager@binderua.com', 'Manager', 'User', '$2a$12$...hash...', 'MANAGER', 'UOP', 3000.00, NULL, 'EN'),
  ('employee', 'employee@binderua.com', 'Employee', 'User', '$2a$12$...hash...', 'PRACOWNIK', 'B2B', NULL, 75.00, 'UA');

INSERT INTO projects (name, description, manager_id, active)
VALUES
  ('Alpha', 'B2B Project', 2, TRUE),
  ('Bravo', 'UoP Project', 2, TRUE);

INSERT INTO time_entries (user_id, project_id, date, total_hours, description, status)
VALUES
  (3, 1, '2025-12-01', 8.00, 'Development', 'ZATWIERDZONY'),
  (3, 2, '2025-12-02', 6.50, 'Design review', 'ZGLOSZONY');
```

---

### Step 12-18: Frontend Scaffolding (Vite, React, i18n, Router)

Due to size, frontend implementation follows similar patterns:
- **tsconfig.json**: strict mode, noUncheckedIndexedAccess, exactOptionalPropertyTypes
- **Vite config**: proxy /api to backend, base URL env var
- **tailwind.config.js**: extend with custom colors, fonts
- **react-i18next setup**: http-backend loading from `/locales/{lang}/{ns}.json`
- **Axios instance**: JWT interceptor, Accept-Language header, 401/403 toast + redirect
- **TanStack Query**: cache keys include role and language
- **Components**: MonthCalendar (grid 42 days), TimeEntryForm (RHF + Zod), ReportTable, ExcelExportButton
- **Router**: ProtectedRoute wrapper, lazy-loaded routes for performance
- **Translations**: pl.json, en.json, ua.json with keys for forms, errors, reports, buttons

### Step 19: Docker Compose

`docker/docker-compose.yml`:
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: timetracker_db
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: secret
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U admin"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build: ./backend
    ports:
      - "8080:8080"
    environment:
      SPRING_PROFILES_ACTIVE: prod
      DB_URL: jdbc:postgresql://postgres:5432/timetracker_db
      DB_USER: admin
      DB_PASSWORD: secret
      JWT_SECRET: ${JWT_SECRET}
      CORS_ORIGINS: http://localhost:3000
    depends_on:
      postgres:
        condition: service_healthy

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      VITE_API_BASE_URL: http://localhost:8080
    depends_on:
      - backend

volumes:
  postgres_data:
```

### Step 20: Tests

**Backend unit tests** (use JUnit 5, Mockito):
- `UserServiceTest`: test password hashing, role validation
- `ReportServiceTest`: test UoP/B2B cost calculations, currency conversion
- `CurrencyServiceTest`: test PLN→UAH conversion, formatting

**Backend integration tests** (use @SpringBootTest, Testcontainers):
- `AuthControllerIntegrationTest`: test login/register endpoints with JWT
- `TimeEntryControllerIntegrationTest`: test CRUD and approval workflow
- Use embedded Postgres via Testcontainers

**Frontend component tests** (use Vitest, React Testing Library):
- `LoginForm.test.tsx`: test validation, submission
- `TimeEntryForm.test.tsx`: test date/hours validation
- Mock API responses with MSW (Mock Service Worker)

**Fixtures**:
- `users.json`: admin, manager, employee with hashed passwords
- `projects.json`: Alpha, Bravo projects
- `time_entries.json`: sample entries for 2025-12

### Step 21: README.md

```markdown
# BinderUA - Time Tracking & Cost Reporting

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node 18+ (for frontend dev)
- Java 21 (for backend dev)
- PostgreSQL 16 (optional, use Docker)

### Run with Docker Compose
\`\`\`bash
docker-compose up -d
\`\`\`

Backend: http://localhost:8080
Frontend: http://localhost:3000
Database: localhost:5432 (admin/secret)

### Run Locally
Backend:
\`\`\`bash
cd backend
mvn spring-boot:run
\`\`\`

Frontend:
\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`

### Default Admin
- Username: `admin`
- Password: `admin123`
- Role: DYREKTOR (Director)

### Languages
🇵🇱 PL (Polish) | 🇺🇸 EN (English) | 🇺🇦 UA (Ukrainian)

### Currency
1 PLN = 10.5 UAH (configurable via config)
- PLN: 1 234,56 zł
- USD: $1,234.56
- UAH: 1 234,56 ₴

## Architecture

### Backend
- **Framework**: Spring Boot 3.x
- **Security**: JWT + BCrypt
- **Database**: PostgreSQL 16 + Flyway migrations
- **Export**: Apache POI for Excel with i18n headers
- **i18n**: Spring MessageSource with locale resolver

### Frontend
- **Framework**: React 18 + TypeScript (strict mode)
- **Build**: Vite
- **Styling**: Tailwind CSS + HeadlessUI
- **Forms**: React Hook Form + Zod validation
- **State**: TanStack Query (caching by role/lang) + Context API
- **i18n**: react-i18next with http backend
- **HTTP**: Axios with JWT + Accept-Language interceptors

### Deployment
- **Container**: Docker Compose with Postgres, Backend, Frontend
- **Env vars**: .env files for secrets (JWT_SECRET, DB_PASSWORD)
- **CORS**: Configured per environment
- **Rate Limiting**: IP + user-based on login/write endpoints

## Testing

```bash
# Backend tests
cd backend
mvn test

# Frontend tests
cd frontend
npm test
```

## Troubleshooting

**Port 5432 already in use**:
```bash
docker ps -a
docker stop <container_id>
```

**JWT token expired**: Re-login via frontend

**Excel export fails**: Ensure Accept-Language header is sent

## Support
For issues, check docs/PROJECT_PLAN.md for detailed specifications.
```

---

## Next Actions

1. **Immediate**: Implement Step 5 (repositories) using the patterns above
2. **Short-term**: Complete Steps 6-11 (security, services, controllers, migrations)
3. **Mid-term**: Scaffold frontend (Steps 12-18)
4. **Long-term**: Docker, tests, final README

All code follows production standards:
- ✅ Input validation (@Valid, @NotNull, @Email, etc.)
- ✅ Error handling (GlobalExceptionHandler with localized messages)
- ✅ Security (JWT, BCrypt, rate limiting, CORS)
- ✅ Performance (TanStack Query caching, lazy routes, memoization)
- ✅ Accessibility (HeadlessUI, aria labels, keyboard nav)
- ✅ i18n (multi-language messages, currency formatting, locale-aware dates)
