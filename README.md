# BinderUA - Time Tracking & Cost Reporting System

Production-ready web application for tracking work hours on projects with multi-language support (Polish, English, Ukrainian) and automatic cost calculation for UoP and B2B contracts.

## 🚀 Quick Start

### With Docker Compose (Recommended)
```bash
# Start PostgreSQL database
docker-compose up -d postgres

# Wait for database to be ready (about 10 seconds)

# Run backend locally
cd backend
mvn spring-boot:run
```

Backend API: http://localhost:8080

### Full Stack with Docker
```bash
docker-compose up -d
```

## 📋 Default Credentials

| Username | Password | Role | Contract | Language |
|----------|----------|------|----------|----------|
| admin | admin123 | DYREKTOR | UoP | PL 🇵🇱 |
| manager | admin123 | MANAGER | UoP | EN 🇺🇸 |
| employee | admin123 | PRACOWNIK | B2B | UA 🇺🇦 |

## 🌍 Multi-Language Support

- **PL** 🇵🇱 Polish - Default currency: PLN (1 234,56 zł)
- **EN** 🇺🇸 English - Default currency: USD ($1,234.56)
- **UA** 🇺🇦 Ukrainian - Default currency: UAH (1 234,56 ₴)

### Currency Conversion
- 1 PLN = 10.5 UAH (configurable via `binderua.rates.pl-to-uah`)
- Monthly hours for UoP: 160 (configurable via `binderua.rates.monthly-hours`)

## 💰 Cost Calculation

### UoP (Umowa o Pracę)
```
Cost = totalHours * (monthlyGrossRate / 160)
Example: 35h * (6000 PLN / 160) = 1312.50 PLN
```

### B2B
```
Cost = totalHours * hourlyRate
Example: 35h * 120 PLN = 4200 PLN
```

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/login` - Login and get JWT token
- `POST /api/auth/register` - Register new user

### Users (DYREKTOR only)
- `GET /api/users` - Get all users (paginated)
- `GET /api/users/{id}` - Get user by ID
- `PUT /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Delete user

### Time Entries
- `POST /api/time-entries` - Create time entry
- `GET /api/time-entries/user/{userId}/month/{year}/{month}` - Get monthly entries
- `PUT /api/time-entries/{id}/approve` - Approve entry (MANAGER/DYREKTOR)
- `PUT /api/time-entries/{id}/reject` - Reject entry (MANAGER/DYREKTOR)

### Reports
- `GET /api/reports/monthly?year=2025&month=12&userId=1&currency=PLN` - Get monthly report

## 🛠️ Technology Stack

### Backend
- **Framework**: Spring Boot 3.2.1
- **Security**: JWT + BCrypt (strength 12)
- **Database**: PostgreSQL 16 + Flyway migrations
- **Validation**: Jakarta Validation
- **Export**: Apache POI 5.x (Excel with i18n)
- **Build**: Maven 3.9+
- **Java**: 21

### Security Features
- JWT stateless authentication
- BCrypt password hashing (strength 12)
- CORS configuration
- Rate limiting: 100 requests/minute
- Role-based access control (`@PreAuthorize`)
- Password policy: min 12 chars, complexity requirements

## 📦 Project Structure

```
backend/
├── src/main/java/com/timetracker/
│   ├── BinderUaApplication.java
│   ├── controller/          # REST endpoints
│   ├── service/             # Business logic
│   ├── repository/          # Data access
│   ├── entity/              # JPA entities
│   ├── dto/                 # Data transfer objects
│   ├── security/            # JWT, filters, config
│   └── exception/           # Global error handling
├── src/main/resources/
│   ├── application.yml      # Configuration
│   └── db/migration/        # Flyway SQL scripts
├── Dockerfile
├── pom.xml
└── .env.example
```

## 🏃 Running Locally

### Prerequisites
- Java 21
- Maven 3.9+
- PostgreSQL 16 (or use Docker)

### Setup Database
```bash
# Using Docker
docker-compose up -d postgres

# Or install PostgreSQL locally and create database
createdb timetracker_db
```

### Run Backend
```bash
cd backend
cp .env.example .env
# Edit .env with your configuration
mvn clean install
mvn spring-boot:run
```

### Run Tests
```bash
cd backend
mvn test
```

## 🐳 Docker Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop all services
docker-compose down

# Rebuild after code changes
docker-compose up -d --build backend

# Reset database
docker-compose down -v
docker-compose up -d postgres
```

## ⚙️ Configuration

Key environment variables (see `.env.example`):

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_URL` | PostgreSQL connection string | `jdbc:postgresql://localhost:5432/timetracker_db` |
| `DB_USER` | Database username | `admin` |
| `DB_PASSWORD` | Database password | `secret` |
| `JWT_SECRET` | Secret key for JWT signing | Change in production! |
| `CORS_ORIGINS` | Allowed CORS origins | `http://localhost:3000` |
| `PL_TO_UAH` | PLN to UAH exchange rate | `10.5` |
| `RATE_LIMIT_PER_MIN` | API rate limit | `100` |

## 🧪 Testing

### Example Login Request
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

### Example Time Entry
```bash
curl -X POST http://localhost:8080/api/time-entries \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "userId": 3,
    "projectId": 1,
    "date": "2025-12-13",
    "totalHours": 8.0,
    "description": "Backend development"
  }'
```

### Example Monthly Report
```bash
curl "http://localhost:8080/api/reports/monthly?year=2025&month=12&userId=3&currency=UAH" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🔧 Troubleshooting

### Port 5432 already in use
```bash
docker ps -a
docker stop <postgres_container>
# Or change port in docker-compose.yml
```

### JWT token expired
Re-login to get a new token. Tokens expire after 24 hours.

### Database connection refused
Ensure PostgreSQL is running and check connection string in `.env`

### Flyway migration failed
```bash
# Reset database
docker-compose down -v
docker-compose up -d postgres
# Wait 10 seconds, then restart backend
```

## 📚 API Documentation

See [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md) for detailed API specifications, schemas, and implementation patterns.

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📧 Support

For issues and questions, please check the [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md) or create an issue in the repository.

---

**BinderUA** © 2025 - Time Tracking Made Simple 🚀
