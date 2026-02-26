# Kasoti — Comprehensive Project Documentation

> A full-stack quiz management platform built with **Java 21 + Spring Boot 3.2** (backend) and **React 18** (frontend).

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture Overview](#2-architecture-overview)
3. [Technology Stack](#3-technology-stack)
4. [Domain Model (Database Schema)](#4-domain-model-database-schema)
5. [Backend Architecture](#5-backend-architecture)
   - 5.1 [Package Structure](#51-package-structure)
   - 5.2 [Security & Authentication](#52-security--authentication)
   - 5.3 [REST API Reference](#53-rest-api-reference)
   - 5.4 [Service Layer](#54-service-layer)
   - 5.5 [Exception Handling](#55-exception-handling)
6. [Frontend Architecture](#6-frontend-architecture)
   - 6.1 [Project Layout](#61-project-layout)
   - 6.2 [Routing & Route Guards](#62-routing--route-guards)
   - 6.3 [Pages](#63-pages)
   - 6.4 [Reusable Components](#64-reusable-components)
   - 6.5 [API Client Layer](#65-api-client-layer)
   - 6.6 [State Management](#66-state-management)
7. [User Roles & Permissions](#7-user-roles--permissions)
8. [Quiz Lifecycle](#8-quiz-lifecycle)
9. [Question Types](#9-question-types)
10. [Environment Configuration](#10-environment-configuration)
11. [Getting Started (Local Setup)](#11-getting-started-local-setup)
12. [Security Measures](#12-security-measures)
13. [Data Export Features](#13-data-export-features)
14. [Key Design Decisions](#14-key-design-decisions)

---

## 1. Project Overview

**Kasoti** (meaning *examination* in Marathi) is a feature-rich, full-stack web application that enables:

- **Teachers** to create, manage, publish, and evaluate quizzes.
- **Students** to discover and take quizzes, view results instantly, and compete on leaderboards.
- **Administrators** to oversee all users, quizzes, attempts, and platform statistics.

The platform supports four distinct question types (MCQ, MSQ, True/False, Descriptive) with automatic and manual grading workflows, time limits, negative marking, randomisation, and rich filtering/export capabilities.

---

## 2. Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                        Browser                           │
│               React 18 SPA (port 3000)                   │
│  ┌────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │  Components│  │    Pages     │  │   Context/State  │  │
│  └────────────┘  └──────────────┘  └─────────────────┘  │
│                       Axios Client                       │
└──────────────────────────┬───────────────────────────────┘
                           │ HTTP/JSON  (Bearer JWT)
┌──────────────────────────▼───────────────────────────────┐
│          Spring Boot 3.2 REST API (port 8080)            │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  Controllers │→ │   Services   │→ │ Repositories  │  │
│  └──────────────┘  └──────────────┘  └───────┬───────┘  │
│  Spring Security (JWT Filter + Rate Limiter)  │           │
└──────────────────────────────────────────────┼──────────┘
                                               │ JPA / Hibernate
                                   ┌───────────▼──────────┐
                                   │  PostgreSQL Database  │
                                   └──────────────────────┘
```

**Communication**: The frontend communicates with the backend exclusively via RESTful HTTP APIs. Every protected request carries a JWT Bearer token in the `Authorization` header.

---

## 3. Technology Stack

| Layer | Technology | Version |
|---|---|---|
| **Backend Language** | Java | 21 |
| **Backend Framework** | Spring Boot | 3.2 |
| **Security** | Spring Security + jjwt | 0.12.3 |
| **Persistence** | Spring Data JPA + Hibernate | — |
| **Database** | PostgreSQL | 15+ |
| **Boilerplate Reduction** | Lombok | Latest |
| **API Docs** | SpringDoc OpenAPI (Swagger UI) | — |
| **Build Tool** | Maven | Wrapper included |
| **Frontend Library** | React | 18 |
| **HTTP Client** | Axios | — |
| **Routing** | React Router DOM | v6 |
| **Notifications** | react-toastify | — |
| **Styling** | TailwindCSS | — |
| **Node Version** | Node.js | 18+ |

---

## 4. Domain Model (Database Schema)

### Entity Relationship Diagram

```
User (1) ──────── creates ──────► Quiz (1)
                                    │
                    contains        │ has many
                       ▼            ▼
                  Question ◄─── quiz_id
                  (question_option table — options list)
                  (question_correct_option table — correctOptions list)

User (1) ─── attempts ──► QuizAttempt (1)
                              │
                  has many    ▼
                          Answer
                          (answer_selected_option table — multi-select)
```

### Table Descriptions

#### `"user"` — Platform users
| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT (seq) | PK |
| `name` | VARCHAR(100) | Optional display name |
| `username` | VARCHAR(50) | Unique, required |
| `password` | VARCHAR | BCrypt-hashed, never sent to frontend |
| `email` | VARCHAR | Unique, required |
| `phone` | VARCHAR | Optional |
| `role` | VARCHAR | `STUDENT` / `TEACHER` / `ADMIN` (default: STUDENT) |
| `created_at` | TIMESTAMP | Auto-set on insert |
| `updated_at` | TIMESTAMP | Auto-updated |

#### `quiz` — Quiz definitions
| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT (seq) | PK |
| `title` | VARCHAR | Required |
| `description` | TEXT | Optional |
| `created_by` | BIGINT FK → user | Quiz owner |
| `category` | VARCHAR | Default: "General" |
| `status` | VARCHAR | `DRAFT` / `PUBLISHED` / `CLOSED` |
| `share_code` | VARCHAR | Unique, generated on publish |
| `time_limit_minutes` | INT | NULL = no limit |
| `start_time` | TIMESTAMP | NULL = available immediately |
| `end_time` | TIMESTAMP | NULL = no expiry |
| `negative_marking` | BOOLEAN | Default: false |
| `shuffle_questions` | BOOLEAN | Default: false |
| `shuffle_options` | BOOLEAN | Default: false |
| `pass_percentage` | INT | NULL = no pass threshold |
| `difficulty` | VARCHAR(10) | EASY / MEDIUM / HARD |
| `tags` | VARCHAR(500) | Comma-separated |
| `created_at` / `updated_at` | TIMESTAMP | Auto-managed |

#### `question` — Quiz questions
| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT (seq) | PK |
| `quiz_id` | BIGINT FK → quiz | Owning quiz (via @JoinColumn) |
| `text` | TEXT | Required |
| `question_type` | VARCHAR(20) | `MCQ` / `MSQ` / `TRUE_FALSE` / `DESCRIPTIVE` |
| `correct_option` | VARCHAR | For MCQ/TRUE_FALSE |
| `model_answer` | TEXT | Reference answer for DESCRIPTIVE |
| `keywords` | VARCHAR(1000) | Evaluation hints for DESCRIPTIVE |
| `marks` | INT | Default: 1 |

Element collection tables:
- `question_option (question_id, options)` — answer choices
- `question_correct_option (question_id, correct_option)` — multiple correct answers (MSQ)

#### `quiz_attempt` — Student attempt records
| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT (seq) | PK |
| `user_id` | BIGINT FK → user | |
| `quiz_id` | BIGINT FK → quiz | |
| `score` | INT | Percentage score |
| `total_questions` | INT | |
| `total_marks` | INT | |
| `marks_obtained` | INT | |
| `correct_answers` | INT | |
| `time_taken_seconds` | INT | |
| `attempted_at` | TIMESTAMP | Auto-set |

Unique constraint: `(user_id, quiz_id)` — one attempt per student per quiz.

#### `answer` — Individual question answers within an attempt
| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT (seq) | PK |
| `attempt_id` | BIGINT FK → quiz_attempt | |
| `question_id` | BIGINT FK → question | |
| `selected_option` | VARCHAR | MCQ / TRUE_FALSE answer |
| `text_answer` | TEXT | DESCRIPTIVE answer |
| `is_correct` | BOOLEAN | Auto-graded result |
| `marks_obtained` | INT | Default: 0 |
| `evaluation_status` | VARCHAR(20) | `AUTO_GRADED` / `PENDING` / `EVALUATED` |
| `evaluation_comment` | TEXT | Teacher feedback |

---

## 5. Backend Architecture

### 5.1 Package Structure

```
src/main/java/com/tukaram/kasoti/
├── KasotiApplication.java        # Spring Boot entry point (@SpringBootApplication)
├── config/                       # Configuration beans
│   ├── SecurityConfig.java       # Spring Security rules, CORS, BCrypt
│   └── DataInitializer.java      # Seed admin user on startup (if needed)
├── controller/                   # REST endpoint handlers
│   ├── AuthController.java       # /api/auth/**
│   ├── QuizController.java       # /api/quizzes/**
│   ├── DashboardController.java  # /api/dashboard/**
│   ├── ProfileController.java    # /api/profile/**
│   ├── AdminController.java      # /api/admin/**
│   ├── CategoryController.java   # /api/categories/**
│   ├── PublicController.java     # /api/public/** (no auth)
│   └── HealthController.java     # /actuator/health equivalent
├── dto/                          # Data Transfer Objects (25 classes)
│   ├── LoginRequest.java / RegisterRequest.java
│   ├── AuthResponse.java
│   ├── CreateQuizRequest.java / QuizDTO.java / QuizSummaryDTO.java
│   ├── SubmitQuizRequest.java / QuizResultResponse.java
│   ├── LeaderboardEntryDTO.java
│   ├── SystemStatsDTO.java / UserAdminDTO.java
│   └── ... (more DTOs)
├── exception/                    # Custom exception hierarchy
│   ├── GlobalExceptionHandler.java  # @ControllerAdvice
│   └── ... (custom exception classes)
├── model/                        # JPA entities
│   ├── User.java, Role.java
│   ├── Quiz.java, QuizStatus.java
│   ├── Question.java, QuestionType.java
│   ├── QuizAttempt.java
│   ├── Answer.java, EvaluationStatus.java
├── repository/                   # Spring Data JPA interfaces
│   ├── UserRepository.java
│   ├── QuizRepository.java
│   ├── QuizAttemptRepository.java
│   └── AnswerRepository.java
├── security/                     # Auth infrastructure
│   ├── JwtTokenProvider.java     # Token generation & validation
│   ├── JwtAuthFilter.java        # OncePerRequestFilter
│   ├── UserPrincipal.java        # Spring Security UserDetails impl
│   ├── LoginAttemptService.java  # Brute-force rate limiter
│   ├── RateLimitFilter.java      # Per-IP rate limiting
│   └── CustomAuthenticationEntryPoint.java
└── service/                      # Business logic
    ├── AuthService.java
    ├── QuizService.java          # Core quiz CRUD, grading, scoring
    ├── DashboardService.java
    ├── AdminService.java
    ├── EvaluationService.java    # Descriptive answer grading
    ├── ExportService.java        # JSON/CSV exports
    ├── PasswordResetService.java
    └── QuestionValidator.java    # Input validation for question types
```

### 5.2 Security & Authentication

#### JWT Token Flow

```
Client                     AuthController            JwtTokenProvider
  │                              │                         │
  │── POST /api/auth/login ─────►│                         │
  │   { username, password }     │── generateToken() ─────►│
  │                              │◄─ JWT string ───────────│
  │◄─ { token, role, ... } ─────│                         │
  │                              │                         │
  │── GET /api/... ─────────────►│                         │
  │   Authorization: Bearer JWT  │                         │
  │                        JwtAuthFilter                   │
  │                        validates token                 │
  │                        injects UserPrincipal           │
  │                        into SecurityContext            │
```

**Token Claims**: `subject` (username), `userId` (Long), `role` (String).

**JWT Security**:
- Secret validated at startup — must be Base64-encoded, minimum 256-bit (32 bytes).
- Default expiration: 24 hours (configurable via `JWT_EXPIRATION`).
- Algorithm: HMAC-SHA256.

#### Login Attempt Protection (`LoginAttemptService`)
- Tracks failed login attempts per username using an in-memory map.
- After **5 consecutive failures**, the account is locked for **15 minutes**.
- Prevents brute-force credential attacks.

#### Rate Limiting (`RateLimitFilter`)
- Per-IP request rate limiting via `RateLimitFilter` (servlet filter).
- Applied before controller processing to prevent API abuse.

#### IDOR Protection
- Dashboard endpoints verify the caller's identity before returning data.
- Teachers can only see their own quizzes and student attempts.
- Students cannot access other students' attempts.

### 5.3 REST API Reference

#### Authentication — `/api/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register a new user, returns JWT |
| `POST` | `/api/auth/login` | Public | Authenticate, returns JWT |
| `POST` | `/api/auth/forgot-password` | Public | Request password reset (token logged in dev) |
| `POST` | `/api/auth/reset-password` | Public | Reset password via token |

#### Quizzes — `/api/quizzes`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/quizzes` | Public | List published quizzes (paginated, filterable) |
| `GET` | `/api/quizzes/{id}` | Public | Get quiz with questions |
| `GET` | `/api/quizzes/share/{code}` | Public | Get quiz by share code |
| `GET` | `/api/quizzes/{id}/leaderboard` | Any | Top scorers for quiz |
| `GET` | `/api/quizzes/{id}/attempted` | Student | Check if already attempted |
| `POST` | `/api/quizzes/{id}/submit` | Student | Submit quiz answers |
| `GET` | `/api/quizzes/my` | Teacher | Get own quizzes |
| `POST` | `/api/quizzes` | Teacher | Create quiz |
| `PUT` | `/api/quizzes/{id}` | Teacher | Update quiz |
| `DELETE` | `/api/quizzes/{id}` | Teacher | Delete quiz |
| `POST` | `/api/quizzes/{id}/publish` | Teacher | Publish → generates share code |
| `POST` | `/api/quizzes/{id}/close` | Teacher | Close quiz |
| `GET` | `/api/quizzes/{id}/students` | Teacher | Student attempts with scores |
| `GET` | `/api/quizzes/{id}/export` | Teacher | Export quiz as JSON |
| `GET` | `/api/quizzes/{id}/attempts/export` | Teacher | Export attempts as CSV |
| `GET` | `/api/quizzes/{id}/pending-evaluations` | Teacher | Unevaluated descriptive answers |
| `PUT` | `/api/quizzes/answers/{id}/evaluate` | Teacher | Grade descriptive answer |

#### Dashboard (Teacher) — `/api/dashboard`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/dashboard/stats` | Teacher | Aggregate stats (total quizzes, attempts, avg score) |
| `GET` | `/api/dashboard/quizzes` | Teacher | Paginated quiz list with stats |
| `GET` | `/api/dashboard/quizzes/{id}/stats` | Teacher | Per-quiz detailed statistics |
| `GET` | `/api/dashboard/recent-attempts` | Teacher | Recent student activity |

#### Profile — `/api/profile`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/profile` | Any user | Get own profile |
| `PUT` | `/api/profile` | Any user | Update profile |
| `POST` | `/api/profile/change-password` | Any user | Change password |
| `GET` | `/api/profile/attempts` | Student | Quiz attempt history |
| `GET` | `/api/profile/attempts/paginated` | Student | Paginated attempt history |

#### Admin — `/api/admin`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/admin/users` | Admin | List all users (paginated) |
| `GET` | `/api/admin/users/role/{role}` | Admin | Filter users by role |
| `GET` | `/api/admin/users/{id}` | Admin | Get specific user |
| `PUT` | `/api/admin/users/{id}/role` | Admin | Change user role |
| `DELETE` | `/api/admin/users/{id}` | Admin | Delete user (not self) |
| `GET` | `/api/admin/quizzes` | Admin | List all quizzes |
| `DELETE` | `/api/admin/quizzes/{id}` | Admin | Delete any quiz |
| `GET` | `/api/admin/stats` | Admin | System-wide statistics |
| `GET` | `/api/admin/attempts` | Admin | All quiz attempts (paginated) |
| `GET` | `/api/admin/attempts/{id}` | Admin | Specific attempt detail |

#### Public — `/api/public`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/public/quizzes/share/{code}` | None | Resolve share code to quiz |

#### Other

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/categories` | Any | Quiz categories list |
| `GET` | `/api/categories/tags` | Any | All tags in use |
| `GET` | `/api/health` | None | Server liveness check |

### 5.4 Service Layer

| Service | Responsibility |
|---|---|
| `AuthService` | Register, login (BCrypt verify), JWT generation, password reset token lifecycle |
| `QuizService` | CRUD, publish/close lifecycle, quiz submission, auto-scoring, leaderboard, IDOR enforcement |
| `DashboardService` | Aggregate statistics for teacher dashboard: totals, per-quiz analytics, recent activity |
| `AdminService` | User management (CRUD), role changes, system-wide stats, global quiz/attempt views |
| `EvaluationService` | Retrieve pending descriptive answers, apply teacher grades and comments |
| `ExportService` | Serialize quiz data to JSON; serialize attempt data to CSV (formula injection–protected) |
| `PasswordResetService` | Generate/validate/expire password reset tokens |
| `QuestionValidator` | Validate question payloads by type (MCQ must have options, DESCRIPTIVE must not, etc.) |

### 5.5 Exception Handling

A `@ControllerAdvice` global handler (`GlobalExceptionHandler`) intercepts all exceptions and returns structured JSON error responses. The custom exception hierarchy ensures correct HTTP status codes across the application.

---

## 6. Frontend Architecture

### 6.1 Project Layout

```
frontend/src/
├── index.js               # React DOM entry — wraps App in AuthProvider + ThemeProvider
├── App.js                 # Root component — Router, routes, ErrorBoundary, ToastContainer
├── api/
│   └── index.js           # Axios instance + 5 grouped API modules
├── components/            # Shared UI components (11 files)
├── context/               # React Context providers
│   ├── AuthContext.js     # User auth state, login/logout
│   └── ThemeContext.js    # Dark/light mode toggle
├── pages/                 # Feature pages (14 directories)
└── styles/
    └── index.css          # Global TailwindCSS base styles
```

### 6.2 Routing & Route Guards

`App.js` defines all application routes with three access tiers using wrapper components from `RouteGuards.js`:

| Guard Component | Behaviour |
|---|---|
| `<GuestRoute>` | Redirects to `/home` if the user is already logged in (for `/login`, `/register`) |
| `<ProtectedRoute>` | Redirects to `/login` if the user is not authenticated |
| `<RoleGuard roles={[...]}>` | Renders `403`-style fallback if the user's role is not in the allowed list |

All pages are **lazy-loaded** with `React.lazy()` and wrapped in `<Suspense>` with a `<LoadingSpinner>` fallback, improving initial load time.

**Page-level `AppLayout`** wraps protected routes, rendering the `<Navbar>` once at the layout level rather than per-page.

### 6.3 Pages

| Page | Route | Roles | Purpose |
|---|---|---|---|
| `Landing` | `/` | Public | Marketing landing page with features, CTA, public quiz verification |
| `Login` | `/login` | Guest | Username + password login form |
| `Register` | `/register` | Guest | New account registration form |
| `Home` | `/home` | Any authed | Browse & search published quizzes with filters |
| `QuizData` | `/quiz/:id` | Any authed | Take a quiz — renders all question types, timer, submission |
| `ShareQuiz` | `/share/:shareCode` | Public | Entry via share link — loads quiz by share code |
| `Profile` | `/profile` | Any authed | View/edit own profile, attempt history, change password |
| `Leaderboard` | `/leaderboard/:id` | Any authed | Ranked scoreboard for a specific quiz |
| `AddQuiz` | `/addQuiz` | Teacher/Admin | Quiz creation form (title, questions, settings) |
| `EditQuiz` | `/editQuiz/:id` | Teacher/Admin | Edit existing quiz with prefilled data |
| `QuizStudents` | `/quiz/:id/students` | Teacher/Admin | All student results for a quiz |
| `Dashboard` | `/dashboard` | Teacher/Admin | Teacher analytics dashboard |
| `Admin` | `/admin` | Admin only | User management, system stats, all quizzes/attempts |
| `NotFound` | `*` | Any | Custom 404 page |

### 6.4 Reusable Components

| Component | Description |
|---|---|
| `Navbar.js` | Top navigation bar with role-based links, dark mode toggle |
| `QuizCard.js` | Card displaying quiz info (title, category, difficulty, stats, actions) |
| `QuizForm.js` | Comprehensive form for creating/editing quizzes with all question types |
| `RouteGuards.js` | `ProtectedRoute`, `GuestRoute`, and `RoleGuard` HOCs |
| `ErrorBoundary.js` | React class error boundary catching render errors |
| `LoadingSpinner.js` | Centered animated loading indicator |
| `QuizSkeleton.js` | Skeleton placeholder cards while quiz data loads |
| `ConfirmDialog.js` | Reusable modal confirmation dialog (for destructive actions) |
| `PageHeader.js` | Consistent page title + breadcrumb component |
| `PasswordInput.js` | Input with toggle-visibility button for passwords |
| `StatsCard.js` | Metric card component for dashboard statistics |

### 6.5 API Client Layer

All HTTP communication is centralised in `src/api/index.js`. It creates a single **Axios instance** with:
- Base URL from `REACT_APP_API_URL` env variable (defaults to `http://localhost:8080`)
- `Content-Type: application/json`
- **Request Interceptor**: Reads JWT from `localStorage["user"]` and injects `Authorization: Bearer <token>` header.
- **Response Interceptor**: If a `401 Unauthorized` is received, clears localStorage and dispatches a custom `auth:expired` DOM event (so `AuthContext` can clear React state cleanly without triggering full page reload).

Five named API modules are exported:

| Module | Covers |
|---|---|
| `authAPI` | login, register, forgot-password, reset-password |
| `quizAPI` | All quiz operations (CRUD, publish, close, submit, leaderboard, export, evaluation) |
| `profileAPI` | Profile get/update, change-password, attempt history |
| `dashboardAPI` | Teacher statistics and recent activity |
| `adminAPI` | User management, system stats, attempt inspection |

### 6.6 State Management

The application uses **React Context** (no Redux):

| Context | Provides |
|---|---|
| `AuthContext` | `user` object (id, username, role, token), `login()`, `logout()` — persisted to `localStorage` |
| `ThemeContext` | `darkMode` boolean + `toggleDarkMode()` — drives Tailwind `dark:` classes and toast theme |

---

## 7. User Roles & Permissions

```
STUDENT < TEACHER < ADMIN
```

| Capability | STUDENT | TEACHER | ADMIN |
|---|:---:|:---:|:---:|
| Browse/take published quizzes | ✅ | ✅ | ✅ |
| View quiz results & leaderboard | ✅ | ✅ | ✅ |
| View own attempt history | ✅ | ✅ | ✅ |
| Edit own profile & change password | ✅ | ✅ | ✅ |
| Create / edit / delete own quizzes | ❌ | ✅ | ✅ |
| Publish / close quizzes | ❌ | ✅ | ✅ |
| View student results for own quiz | ❌ | ✅ | ✅ |
| Evaluate descriptive answers | ❌ | ✅ | ✅ |
| Export quiz data (JSON/CSV) | ❌ | ✅ | ✅ |
| Teacher dashboard & analytics | ❌ | ✅ | ✅ |
| Manage all users (view/role/delete) | ❌ | ❌ | ✅ |
| Manage all quizzes | ❌ | ❌ | ✅ |
| View all quiz attempts | ❌ | ❌ | ✅ |
| View system statistics | ❌ | ❌ | ✅ |

---

## 8. Quiz Lifecycle

```
[Draft] ──publish()──► [Published] ──close()──► [Closed]
   ▲                        │
   └────updateQuiz()────────┘ (only from Draft)
```

- **DRAFT**: Created but not visible to students. Can be fully edited.
- **PUBLISHED**: Visible to students. A unique `shareCode` is generated. Editing is restricted.
- **CLOSED**: No new submissions accepted. Historical data is preserved.

**Availability Check** (server-side, see `Quiz.isAvailable()`):
- Status must be `PUBLISHED`.
- `startTime` (if set) must be in the past.
- `endTime` (if set) must be in the future.

**One-Attempt Rule**: `QuizAttempt` has a unique constraint on `(user_id, quiz_id)` — a student can only submit once per quiz.

---

## 9. Question Types

| Type | Key | Selection | Grading |
|---|---|---|---|
| Multiple Choice | `MCQ` | Single option from list | Auto — matches `correctOption` |
| Multiple Select | `MSQ` | Multiple options from list | Auto — all `correctOptions` must match exactly |
| True or False | `TRUE_FALSE` | `"True"` or `"False"` | Auto — matches `correctOption` |
| Descriptive | `DESCRIPTIVE` | Free-text | Manual — teacher reviews and assigns marks + comment |

**Negative Marking** (when enabled on quiz): Deducts marks for wrong answers on `MCQ` and `TRUE_FALSE`.

**Descriptive Evaluation Workflow**:
1. Student submits text answer → `EvaluationStatus.PENDING`.
2. Teacher views pending evaluations list.
3. Teacher assigns marks (0 to question max) and optional comment.
4. Status changes to `EvaluationStatus.EVALUATED`.
5. Attempt total score is recalculated.

---

## 10. Environment Configuration

### Backend (`.env` or system environment)

| Variable | Default | Description |
|---|---|---|
| `DB_URL` | `jdbc:postgresql://localhost:5432/quiz-app` | Database JDBC URL |
| `DB_USER` | `postgres` | Database username |
| `DB_PASSWORD` | *(required)* | Database password |
| `JWT_SECRET` | *(required)* | Base64-encoded secret, min 256-bit |
| `JWT_EXPIRATION` | `86400000` | Token TTL in milliseconds (24h) |
| `SERVER_PORT` | `8080` | Backend HTTP port |

> ⚠️ **JWT_SECRET is mandatory and validated at startup.** The server will refuse to start if it is missing, blank, or encodes fewer than 32 bytes.

### Frontend (`.env` file)

| Variable | Default | Description |
|---|---|---|
| `REACT_APP_API_URL` | `http://localhost:8080` | Backend base URL |

---

## 11. Getting Started (Local Setup)

### Prerequisites
- Java 21+
- PostgreSQL 15+ (running locally)
- Node.js 18+
- Maven (or use the included `mvnw` wrapper)

### 1. Database Setup

```sql
CREATE DATABASE "quiz-app";
```

### 2. Backend

```bash
cd backend

# Copy and fill environment variables
cp .env.example .env
# Edit .env: set DB_PASSWORD and JWT_SECRET

# Run (Maven wrapper included)
./mvnw spring-boot:run
```

**API available at**: `http://localhost:8080`  
**Swagger UI**: `http://localhost:8080/swagger-ui.html`

### 3. Frontend

```bash
cd frontend

# Copy and configure
cp .env.example .env
# Edit .env if backend is not on localhost:8080

npm install
npm start
```

**App available at**: `http://localhost:3000`

### 4. Running Tests (Backend)

```bash
cd backend
./mvnw test
```

---

## 12. Security Measures

| Measure | Implementation |
|---|---|
| **Password Storage** | BCrypt hashing — plaintext passwords never stored |
| **JWT Signing** | HMAC-SHA256 with minimum 256-bit key validated at startup |
| **Stateless Sessions** | No server-side session; every request is self-authenticated via JWT |
| **Login Rate Limiting** | 5 failed attempts → 15-minute account lockout (`LoginAttemptService`) |
| **API Rate Limiting** | `RateLimitFilter` limits per-IP request throughput |
| **IDOR Protection** | Service layer verifies resource ownership before returning data |
| **Password Never Sent** | `@JsonIgnore` on `User.password` field — never serialised to JSON responses |
| **Password Reset Security** | Token never returned in the HTTP response body (logged only in dev mode) |
| **CSV Injection Prevention** | `ExportService` sanitises all cell values before writing CSV |
| **CORS Configuration** | Configured in `SecurityConfig` — restrict origins in production |
| **Input Validation** | Jakarta Bean Validation on all DTOs; `QuestionValidator` for type-specific rules |

---

## 13. Data Export Features

Teachers can export their quiz data in two formats:

### JSON Export (`GET /api/quizzes/{id}/export`)
- Complete quiz data including all questions, correct answers, and settings.
- Downloaded as `quiz-{id}.json`.
- Suitable for quiz backup or migration.

### CSV Export (`GET /api/quizzes/{id}/attempts/export`)
- All student attempts with name, score, time taken, and per-question answers.
- Downloaded as `quiz-{id}-attempts.csv`.
- Sanitised to prevent **CSV formula injection** (cells starting with `=`, `+`, `-`, `@` are escaped).

---

## 14. Key Design Decisions

| Decision | Rationale |
|---|---|
| **Stateless JWT auth** | Enables horizontal scaling without shared session state |
| **Lazy-loaded React pages** | Reduces initial JS bundle size; pages load on demand |
| **Single Axios instance with interceptors** | Centralises auth header injection and 401 handling — avoids duplication across 40+ API calls |
| **`auth:expired` DOM event vs. direct redirect** | Allows `AuthContext` to clean up React state before navigation, avoiding stale UI |
| **`@JsonIgnore` on User.password** | Defence-in-depth: even if serialisation logic has bugs, password is structurally excluded |
| **Unique constraint on (user_id, quiz_id)** | One-attempt rule enforced at DB level, not just application code |
| **QuestionType enum** | Forward-compatible: new question types can be added without schema migrations |
| **`QuizStatus` lifecycle enum** | Makes quiz state transitions explicit and auditable |
| **`EvaluationStatus` on Answer** | Allows partial auto-grading — objective questions grade immediately, descriptive waits for teacher |
| **`QuestionValidator` service** | Keeps complex type-specific validation logic out of controller and model layers |
| **Lombok on entities** | Reduces boilerplate; `@Builder.Default` ensures safe defaults on entity creation |
| **`ErrorBoundary` component** | Prevents a single crashing component from taking down the entire React tree |
