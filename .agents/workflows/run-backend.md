---
description: Build and run the Kasoti Spring Boot backend
---

// turbo-all

# Backend — Build & Run

## 1. Build the backend JAR
```
cd c:\Users\sif-\Desktop\kasoti\backend
.\mvnw clean package -DskipTests
```
Output: `target/java-quiz-server-*.jar`

## 2. Run tests
```
cd c:\Users\sif-\Desktop\kasoti\backend
.\mvnw test
```

## 3. Start in development mode
```
cd c:\Users\sif-\Desktop\kasoti\backend
.\mvnw spring-boot:run
```

## 4. Start with custom DB credentials
```
cd c:\Users\sif-\Desktop\kasoti\backend
$env:DB_PASSWORD="yourpassword"; .\mvnw spring-boot:run
```

---

## Backend Config Reference (`application.properties`)

| Property | Default | Override via |
|----------|---------|--------------|
| `server.port` | 8080 | `SERVER_PORT` env var |
| `spring.datasource.url` | `jdbc:postgresql://localhost:5432/quiz-app` | `DB_URL` env var |
| `spring.datasource.username` | `postgres` | `DB_USER` env var |
| `spring.datasource.password` | `1206` | `DB_PASSWORD` env var |
| `jwt.secret` | (dev default) | `JWT_SECRET` env var |
| `jwt.expiration` | `86400000` (24h) | `JWT_EXPIRATION` env var |

## Common Backend Issues
| Issue | Fix |
|-------|-----|
| Port 8080 already in use | Kill process or change `SERVER_PORT` |
| DB connection refused | Ensure PostgreSQL is running: `net start postgresql-x64-15` |
| JWT validation error | JWT_SECRET must be at least 32 chars |
