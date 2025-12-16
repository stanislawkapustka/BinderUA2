# BinderUA AI Coding Agent Instructions

## Architecture Overview

**BinderUA** is a time tracking & cost reporting system with tri-lingual support (Polish, Ukrainian, English). The stack comprises:
- **Backend**: Spring Boot 3.5.8 + Java 21, PostgreSQL 16, JWT auth, Flyway migrations
- **Frontend**: React 19 + TypeScript + Vite, TailwindCSS, react-i18next
- **Data flow**: RESTful API with JWT tokens, role-based access control (RBAC)

### Key Components
- **Backend** (`backend/src/main/java/com/timetracker/`): Layered architecture with `entity`, `repository`, `service`, `controller`, `security`, `dto`
- **Frontend** (`frontend/src/`): Pages, components, API client with axios interceptors
- **Database**: Flyway migrations in `backend/src/main/resources/db/migration/V*.sql`

## Critical Patterns & Conventions

### 1. Multi-Language & Currency Handling
**Ukrainian locale requires special formatting** (space thousand separator, comma decimal):
```java
// In CurrencyService.java - Ukrainian format: "1 234,56 ₴"
symbols.setGroupingSeparator(' ');
symbols.setDecimalSeparator(',');
```
- **Frontend**: i18n via `react-i18next` with JSON files in `frontend/public/locales/{pl,en,ua}/translation.json`
- **Backend**: `Accept-Language` header read from request; currency conversion PLN→UAH via `binderua.rates.pl-to-uah=10.5`
- **API interceptor** (`frontend/src/lib/api.ts`): Automatically adds `Accept-Language` header from localStorage

### 2. Cost Calculation Logic
Located in `ReportService.java` - **contract type determines formula**:
```java
// UoP (Umowa o Pracę): totalHours * (monthlyGrossRate / 160)
// B2B: totalHours * hourlyRate
```
Monthly hours default: **160** (configurable via `binderua.rates.monthly-hours`)

### 3. Role-Based Access Control (RBAC)
Roles: `PRACOWNIK`, `MANAGER`, `DYREKTOR` (Polish enum names in entity layer)
```java
// Example from TimeController.java
@PreAuthorize("hasRole('MANAGER') or hasRole('DYREKTOR')")
public ResponseEntity<Void> approveTimeEntry(@PathVariable Long id)
```
- **DYREKTOR**: Full user management access (`UserController` methods)
- **MANAGER/DYREKTOR**: Approve/reject time entries
- **PRACOWNIK**: Create own entries, view own data

### 4. Security & Authentication
- **JWT tokens**: Generated in `JwtUtil.java`, validated in `JwtAuthenticationFilter.java`
- **Password hashing**: BCrypt with strength 10 (`SecurityConfig.java`)
- **Password change required**: `User.passwordChangeRequired` flag - users redirected to `/change-password` on login (see `Dashboard.tsx:43`)
- **CORS**: Configured in `SecurityConfig.corsConfigurationSource()` - reads `binderua.cors.allowed-origins`

### 5. Database Migrations (Flyway)
- **Sequential versioning**: `V1__create_users_table.sql`, `V2__create_projects_table.sql`, etc.
- **Seed data**: `V4__seed_test_data.sql` creates admin/manager/employee with BCrypt passwords
- **Never modify existing migrations** - create new `V{N+1}__*.sql` files
- **Placeholders**: Use `${admin_user_id}` etc. defined in `application.yml:spring.flyway.placeholders`

## Development Workflows

### Backend Development
```powershell
# Run with Maven (no Docker required)
cd backend
mvn spring-boot:run

# PostgreSQL must be running on localhost:5432
# Database setup instructions in SETUP_GUIDE.md
# API available at http://localhost:8080
```

### Frontend Development
```powershell
cd frontend
npm run dev  # Vite dev server on port 3000
```

### Testing Credentials
| Username | Password | Role | Contract | Language |
|----------|----------|------|----------|----------|
| admin    | admin123 | DYREKTOR | UoP | PL |
| manager  | admin123 | MANAGER  | UoP | EN |
| employee | admin123 | PRACOWNIK | B2B | UA |

### API Testing Pattern
```powershell
# Login to get JWT
$response = curl -X POST http://localhost:8080/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"username":"admin","password":"admin123"}'

# Extract token and use in subsequent requests
curl http://localhost:8080/api/users `
  -H "Authorization: Bearer $token" `
  -H "Accept-Language: PL"
```

## Project-Specific Rules

### When Adding Entities
1. Create entity in `backend/src/main/java/com/timetracker/entity/`
2. Use Lombok annotations: `@Data`, `@Builder`, `@NoArgsConstructor`, `@AllArgsConstructor`
3. Add database indexes via `@Index` annotation (see `User.java:14-17`)
4. Create corresponding Flyway migration `V{N}__create_{table}_table.sql`
5. Add repository extending `JpaRepository<Entity, Long>`

### When Adding API Endpoints
1. Create DTO in `dto/` package with validation annotations (`@NotBlank`, `@Email`, etc.)
2. Implement service method in appropriate service class
3. Add controller method with proper `@PreAuthorize` annotation
4. Handle exceptions via `GlobalExceptionHandler.java`
5. Update frontend `api.ts` with typed method

### When Working with i18n
- **Backend**: Add keys to `backend/src/main/resources/messages/messages_{locale}.properties`
- **Frontend**: Add keys to `frontend/public/locales/{locale}/translation.json`
- **Access**: Backend via `MessageSource`, frontend via `useTranslation()` hook
- **Ukrainian translations**: Ensure proper Cyrillic characters, test formatting

### Excel Export (Planned)
- **Service**: Will be implemented in `backend/src/main/java/com/timetracker/service/ExcelService.java`
- **Library**: Apache POI 5.2.5 already configured in `pom.xml`
- **i18n**: Export headers should use localized strings via `MessageSource`
- **Format**: XSSF workbook format (.xlsx) with styled cells for currency per locale

### Configuration Management
All app config in `application.yml` under `binderua:` prefix:
- `binderua.jwt.secret` - JWT signing key (change in production!)
- `binderua.rates.pl-to-uah` - Currency conversion rate
- `binderua.cors.allowed-origins` - Comma-separated frontend URLs
- Environment variables override via `${VAR_NAME:default}` syntax

## Code Documentation Standards

**This codebase currently lacks comprehensive comments** - when adding or modifying code, include documentation following these patterns:

### Backend (Java)
**Class-level JavaDoc** - Explain purpose and business context:
```java
/**
 * Service handling time entry operations including creation, approval/rejection,
 * and retrieval. Enforces business rules: prevents overlapping entries,
 * validates user permissions, and maintains audit trail via approvedBy field.
 */
@Service
public class TimeEntryService { }
```

**Method-level JavaDoc** - Document parameters, return values, exceptions, business rules:
```java
/**
 * Approve a time entry. Only MANAGER or DYREKTOR roles can approve.
 * Sets status to ZATWIERDZONY and records the approver's ID.
 *
 * @param id Entry ID to approve
 * @param approverId ID of user performing approval
 * @return Updated TimeEntryDto with ZATWIERDZONY status
 * @throws RuntimeException if entry not found or user lacks permission
 */
public TimeEntryDto approveEntry(Long id, Long approverId) { }
```

**Inline comments** for complex logic:
```java
// UoP contract: Calculate cost based on monthly rate divided by 160 hours
// Example: 40 hours * (6000 PLN / 160) = 1500 PLN
BigDecimal costPerHour = user.getUopGrossRate().divide(
    BigDecimal.valueOf(monthlyHours), 2, RoundingMode.HALF_UP
);
```

### Frontend (TypeScript/React)
**Component JSDoc** - Describe purpose, props, and key behaviors:
```tsx
/**
 * TimeEntryForm - Modal form for creating/editing time entries.
 * Fetches available projects on mount, validates hours (positive number),
 * auto-formats date to yyyy-MM-dd for backend compatibility.
 *
 * @param onSuccess - Callback invoked after successful submission
 * @param initialDate - Pre-populate date field (defaults to today)
 */
export default function TimeEntryForm({ onSuccess, initialDate }: TimeEntryFormProps) { }
```

**Function/hook comments** for non-obvious logic:
```typescript
// API interceptor automatically adds JWT token from localStorage
// and Accept-Language header based on user's selected language.
// On 401 response, clears auth state and redirects to login.
api.interceptors.request.use((config) => { ... });
```

### SQL Migrations
**Header comments** in every migration:
```sql
-- V6__add_ukrainian_names_and_active_flag.sql
-- Purpose: Add Ukrainian name fields for bilingual user display
-- and active flag for soft-deletion of user accounts.
-- Related to: User entity changes for i18n support
```

### Configuration Files
**Inline YAML comments** explaining non-obvious settings:
```yaml
binderua:
  rates:
    pl-to-uah: 10.5  # Currency conversion rate: 1 PLN = 10.5 UAH (update manually)
    monthly-hours: 160  # Standard monthly hours for UoP cost calculation
```

## Common Pitfalls to Avoid

1. **Don't hardcode role names** - use `Role` enum from entity package
2. **Never expose passwords in DTOs** - use `@JsonIgnore` on `User.password`
3. **Ukrainian locale requires space separator** - don't use standard formatters
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
