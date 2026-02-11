# Kasoti

A full-stack quiz management platform built with **Spring Boot** and **React**. Teachers create, publish, and manage quizzes — students take quizzes, view scores, and compete on leaderboards.

![Java](https://img.shields.io/badge/Java-21-orange)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2-green)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue)
![React](https://img.shields.io/badge/React-18-61DAFB)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## Features

### Authentication & Security
- JWT-based authentication with stateless sessions
- Role-based access control (Admin, Teacher, Student)
- Password hashing with BCrypt
- Login attempt rate limiting & account lockout
- Password reset functionality

### Quiz Management (Teachers)
- Create quizzes with multiple-choice questions
- Edit and delete quizzes
- Publish quizzes with shareable links
- View student attempts and scores
- Close quizzes to prevent new attempts

### Taking Quizzes (Students)
- Attempt published quizzes
- Time tracking for attempts
- View scores and results immediately
- Quiz history on profile page
- Leaderboard per quiz

### Admin Dashboard
- User management (view, update roles, delete)
- System-wide statistics
- Quiz and attempt management

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Java 21, Spring Boot 3.2, Spring Security, Spring Data JPA, Lombok |
| **Database** | PostgreSQL |
| **Auth** | JWT (jjwt 0.12.3) |
| **Frontend** | React 18, Axios |
| **Build** | Maven |

---

## Getting Started

### Prerequisites

- Java 21+
- PostgreSQL 15+
- Node.js 18+

### Backend

```bash
cd backend

# Configure database in src/main/resources/application.properties
# or set environment variables: DB_URL, DB_USER, DB_PASSWORD

./mvnw spring-boot:run
```

API available at `http://localhost:8080`

### Frontend

```bash
cd frontend
npm install
npm start
```

App opens at `http://localhost:3000`

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_URL` | `jdbc:postgresql://localhost:5432/quiz-app` | Database URL |
| `DB_USER` | `postgres` | Database username |
| `DB_PASSWORD` | — | Database password |
| `JWT_SECRET` | (built-in) | JWT signing key |
| `JWT_EXPIRATION` | `86400000` (24h) | Token expiry in ms |
| `SERVER_PORT` | `8080` | Backend port |

---

## API Endpoints

Full docs: [backend/docs/FRONTEND_API_DOCUMENTATION.md](backend/docs/FRONTEND_API_DOCUMENTATION.md)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | Login and get JWT |
| `GET` | `/api/quizzes` | Get quizzes (paginated, filterable) |
| `POST` | `/api/quizzes/{id}/submit` | Submit quiz answers |
| `GET` | `/api/quizzes/{id}/leaderboard` | Quiz leaderboard |
| `GET` | `/api/profile` | User profile |
| `GET` | `/api/dashboard/stats` | Teacher dashboard stats |
| `GET` | `/api/admin/stats` | System statistics (Admin) |

---

## Project Structure

```
kasoti/
├── backend/
│   ├── src/main/java/com/tukaram/kasoti/
│   │   ├── config/          # Security config, data initializer
│   │   ├── controller/      # REST controllers
│   │   ├── dto/             # Data Transfer Objects
│   │   ├── exception/       # Custom exceptions & global handler
│   │   ├── model/           # JPA entities
│   │   ├── repository/      # Spring Data repositories
│   │   ├── security/        # JWT filter, token provider, rate limiter
│   │   └── service/         # Business logic
│   ├── docs/                # API documentation
│   └── pom.xml
├── frontend/
│   ├── src/
│   │   ├── api/             # Axios API client
│   │   ├── components/      # Reusable UI components
│   │   ├── context/         # React context (auth)
│   │   ├── pages/           # Page components
│   │   └── styles/          # Global styles
│   └── package.json
└── Readme.md
```

---

## User Roles

| Role | Permissions |
|------|-------------|
| **STUDENT** | Take quizzes, view scores, access leaderboards |
| **TEACHER** | All student permissions + create/manage quizzes |
| **ADMIN** | All permissions + user management, system stats |

---

## Running Tests

```bash
cd backend
./mvnw test
```

---

## License

MIT
