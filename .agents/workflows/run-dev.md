---
description: Start the full Kasoti application locally (backend + frontend)
---

# Run Kasoti Locally

Prerequisites: Java 21+, PostgreSQL running on port 5432, Node.js 18+

## 1. Start the Backend

// turbo
Run the Spring Boot server:
```
cd c:\Users\sif-\Desktop\kasoti\backend
.\mvnw spring-boot:run
```
Wait until you see: `Started KasotiApplication` in the console (port 8080).

## 2. Start the Frontend

// turbo
In a separate terminal, start the React dev server:
```
cd c:\Users\sif-\Desktop\kasoti\frontend
npm start
```
The app opens at http://localhost:3000

---

## Default Credentials (from data initializer)
- Admin: check `DataInitializer.java` for seeded admin account
- DB: `localhost:5432/quiz-app`, user: `postgres`, password: `1206` (see `application.properties`)

## Ports
| Service | Port |
|---------|------|
| Backend API | :8080 |
| Frontend Dev | :3000 |
| PostgreSQL | :5432 |
