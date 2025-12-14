# BinderUA Development Setup Guide

## Prerequisites Installation (Windows)

### 1. Install Java 21 JDK
- Download: https://adoptium.net/temurin/releases/?version=21
- Select: **Windows x64 MSI installer**
- Install and verify:
  ```powershell
  java -version  # Should show version 21
  ```

### 2. Install Apache Maven
- Download: https://maven.apache.org/download.cgi
- Extract to `C:\Program Files\Apache\maven`
- Add to PATH:
  ```powershell
  [System.Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\Program Files\Apache\maven\bin", "Machine")
  ```
- Restart PowerShell and verify:
  ```powershell
  mvn -version  # Should show Maven 3.9+
  ```

### 3. Install PostgreSQL 16
- Download: https://www.postgresql.org/download/windows/
- During installation:
  - Set password for `postgres` user: **postgres** (or your choice)
  - Port: **5432** (default)
  - Remember your password!

### 4. Install Docker Desktop (Optional)
- Download: https://www.docker.com/products/docker-desktop/
- Install and restart computer
- Verify:
  ```powershell
  docker --version
  docker compose version
  ```

## Running the Application

### Option 1: Docker Compose (Easiest)
```powershell
# Start PostgreSQL
docker compose up -d postgres

# Wait 10 seconds for database to initialize
Start-Sleep -Seconds 10

# Start backend
docker compose up -d backend

# View logs
docker compose logs -f backend
```

### Option 2: Local PostgreSQL + Maven
```powershell
# 1. Create database
psql -U postgres
CREATE DATABASE binderua;
\q

# 2. Update application.yml if needed
# Edit: backend/src/main/resources/application.yml
# Set your postgres password

# 3. Run backend
cd backend
mvn clean install
mvn spring-boot:run
```

### Option 3: Maven Wrapper (No Maven Install Required)
```powershell
cd backend

# Download Maven Wrapper
Invoke-WebRequest -Uri https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.2.0/maven-wrapper-3.2.0.jar -OutFile .mvn\wrapper\maven-wrapper.jar

# Run with wrapper
.\mvnw.cmd spring-boot:run
```

## Testing the Backend

Once the backend is running on http://localhost:8080:

```powershell
# Test 1: Health check
curl http://localhost:8080/actuator/health

# Test 2: Login as admin
curl -X POST http://localhost:8080/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"username":"admin","password":"admin123"}'

# Save the token from response, then:
$token = "YOUR_JWT_TOKEN_HERE"

# Test 3: Get current user info
curl http://localhost:8080/api/users/current `
  -H "Authorization: Bearer $token"

# Test 4: Get time entries
curl http://localhost:8080/api/time-entries?month=12&year=2025 `
  -H "Authorization: Bearer $token"
```

## Default Test Users

| Username | Password  | Role      | Language | Contract | Notes                  |
|----------|-----------|-----------|----------|----------|------------------------|
| admin    | admin123  | DYREKTOR  | PL       | UoP      | Full access            |
| manager  | admin123  | MANAGER   | EN       | UoP      | Can approve entries    |
| employee | admin123  | PRACOWNIK | UA       | B2B      | Has 5 test time entries|

## Troubleshooting

### "Port 8080 already in use"
```powershell
# Find process using port 8080
netstat -ano | findstr :8080

# Kill process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### "Connection refused to PostgreSQL"
```powershell
# Check if PostgreSQL is running
Get-Service postgresql*

# Start PostgreSQL service
Start-Service postgresql-x64-16
```

### "Flyway migration failed"
```powershell
# Drop and recreate database
psql -U postgres
DROP DATABASE binderua;
CREATE DATABASE binderua;
\q
```

### Maven build fails with "JAVA_HOME not set"
```powershell
# Set JAVA_HOME
[System.Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Eclipse Adoptium\jdk-21.0.0.0-hotspot", "Machine")
```

## Next Steps

After backend is running:
1. ✅ Backend API is accessible at http://localhost:8080
2. ⏳ Frontend development (Steps 12-18) - React + TypeScript
3. ⏳ Backend i18n messages (Step 10)
4. ⏳ Unit & integration tests (Step 20)

See [PROJECT_PLAN.md](docs/PROJECT_PLAN.md) for complete implementation roadmap.
