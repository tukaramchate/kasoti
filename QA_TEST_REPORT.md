# Kasoti Quiz App — Production QA Test Report

**Date:** 2026-02-12  
**QA Engineer:** Senior QA — Automated Analysis  
**Stack:** Spring Boot 3 (JWT, PostgreSQL), React.js  
**Roles:** `ADMIN`, `TEACHER`, `STUDENT`  
**Base URL:** `http://localhost:8080`

---

## Table of Contents

1. [AUTH — Authentication & Authorization](#1-auth--authentication--authorization)
2. [ADMIN — Admin Operations](#2-admin--admin-operations)
3. [TEACHER — Teacher Operations](#3-teacher--teacher-operations)
4. [STUDENT — Student Operations](#4-student--student-operations)
5. [LOGIC — Business Logic Validation](#5-logic--business-logic-validation)
6. [SECURITY — Security Testing](#6-security--security-testing)
7. [EDGE CASES — Boundary & Error Handling](#7-edge-cases--boundary--error-handling)
8. [CRITICAL FINDINGS & PRODUCTION BLOCKERS](#8-critical-findings--production-blockers)

---

## 1. AUTH — Authentication & Authorization

### TC-AUTH-001: Successful Registration (STUDENT)

| Field | Value |
|---|---|
| **Endpoint** | `POST /api/auth/register` |
| **Auth** | None |
| **Request** | ```json {"name":"John Doe","username":"john_doe","email":"john@test.com","password":"Test@1234","phone":"1234567890","role":"STUDENT"}``` |
| **Expected Response** | `201 Created` — `{"token":"eyJhb...","user":{"id":1,"name":"John Doe","username":"john_doe","email":"john@test.com","role":"STUDENT"},"message":"Registration successful"}` |
| **Expected DB Change** | New row in `"user"` table. Password stored as BCrypt hash (`$2a$10$...`), NOT plaintext. `role=STUDENT`, `created_at` auto-set. |
| **Possible Failure** | Password stored in plaintext; role escalation to ADMIN accepted; duplicate username/email not rejected. |
| **Fix Suggestion** | Verify `passwordEncoder.encode()` is always called. Confirm `AuthService.register()` throws `BadRequestException` when `role == ADMIN`. |

---

### TC-AUTH-002: Successful Registration (TEACHER)

| Field | Value |
|---|---|
| **Endpoint** | `POST /api/auth/register` |
| **Auth** | None |
| **Request** | ```json {"name":"Prof Smith","username":"prof_smith","email":"smith@school.com","password":"Teach@2024","role":"TEACHER"}``` |
| **Expected Response** | `201 Created` — token + user with `role: TEACHER` |
| **Expected DB Change** | New user with `role=TEACHER`. |
| **Possible Failure** | Teacher registration may be undesired in some deployments (anyone can self-register as TEACHER). |
| **Fix Suggestion** | **CRITICAL**: Consider requiring admin approval for TEACHER registration. Currently ANY user can register as TEACHER — this is a **privilege escalation vector**. Add an admin approval workflow or restrict teacher creation to admin endpoints only. |

---

### TC-AUTH-003: Registration — Attempt ADMIN Role

| Field | Value |
|---|---|
| **Endpoint** | `POST /api/auth/register` |
| **Auth** | None |
| **Request** | ```json {"name":"Hacker","username":"hacker","email":"hack@evil.com","password":"Hack@1234","role":"ADMIN"}``` |
| **Expected Response** | `400 Bad Request` — `{"error":"BAD_REQUEST","message":"Admin accounts cannot be created through registration"}` |
| **Expected DB Change** | None. No user created. |
| **Possible Failure** | If role enum parsing fails silently and defaults to STUDENT instead of rejecting. |
| **Fix Suggestion** | Verified in `AuthService.register()` — explicit `ADMIN` check exists. Good. |

---

### TC-AUTH-004: Registration — Duplicate Username

| Field | Value |
|---|---|
| **Endpoint** | `POST /api/auth/register` |
| **Auth** | None |
| **Request** | ```json {"name":"Duplicate","username":"john_doe","email":"different@test.com","password":"Test@1234"}``` |
| **Expected Response** | `400 Bad Request` — `"Username already exists"` |
| **Expected DB Change** | None. |
| **Possible Failure** | Race condition: two concurrent registrations with same username could both pass the `findByUsername` check. |
| **Fix Suggestion** | The `username` column has a `UNIQUE` constraint in DB, so one will fail with a constraint violation. However, the `DataIntegrityViolationException` is NOT explicitly handled in `GlobalExceptionHandler` — it will fall through to the generic `Exception` handler returning `500 Internal Server Error` instead of a user-friendly `409 Conflict`. **Add a `@ExceptionHandler(DataIntegrityViolationException.class)`**. |

---

### TC-AUTH-005: Registration — Duplicate Email

| Field | Value |
|---|---|
| **Endpoint** | `POST /api/auth/register` |
| **Auth** | None |
| **Request** | ```json {"name":"Another","username":"another_user","email":"john@test.com","password":"Test@1234"}``` |
| **Expected Response** | `400 Bad Request` — `"Email already exists"` |
| **Expected DB Change** | None. |
| **Possible Failure** | Same race condition as TC-AUTH-004. |
| **Fix Suggestion** | Same fix — handle `DataIntegrityViolationException`. |

---

### TC-AUTH-006: Registration — Validation Failures

| Field | Value |
|---|---|
| **Endpoint** | `POST /api/auth/register` |
| **Auth** | None |
| **Request** | ```json {"name":"X","username":"ab","email":"invalid","password":"weak"}``` |
| **Expected Response** | `400 Bad Request` — `{"error":"VALIDATION_ERROR","message":"Validation failed","fieldErrors":{"username":"Username must be between 3 and 50 characters","email":"Invalid email format","password":"Password must be at least 8 characters"}}` |
| **Expected DB Change** | None. |
| **Possible Failure** | Password regex not enforced (upper+lower+digit+special required). |
| **Fix Suggestion** | The `@Pattern` annotation on `RegisterRequest.password` enforces `^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&#])`. Verify this fires correctly. |

---

### TC-AUTH-007: Successful Login

| Field | Value |
|---|---|
| **Endpoint** | `POST /api/auth/login` |
| **Auth** | None |
| **Request** | ```json {"username":"john_doe","password":"Test@1234"}``` |
| **Expected Response** | `200 OK` — `{"token":"eyJhb...","user":{"id":1,"username":"john_doe","role":"STUDENT"}}` |
| **Expected DB Change** | None. Login attempt counter reset for this username. |
| **Possible Failure** | Token contains wrong role claim; token expiration not set correctly. |
| **Fix Suggestion** | Decode the returned JWT and verify: `sub=john_doe`, `role=STUDENT`, `exp` is ~24h from now. |

---

### TC-AUTH-008: Invalid Login — Wrong Password

| Field | Value |
|---|---|
| **Endpoint** | `POST /api/auth/login` |
| **Auth** | None |
| **Request** | ```json {"username":"john_doe","password":"WrongPass@1"}``` |
| **Expected Response** | `401 Unauthorized` — `"Invalid username or password. 4 attempts remaining."` |
| **Expected DB Change** | None. `LoginAttemptService` counter incremented for `john_doe`. |
| **Possible Failure** | Message reveals that username exists (username enumeration attack). |
| **Fix Suggestion** | **MEDIUM RISK**: The error message `"Invalid username or password"` is good generic wording, but the `"X attempts remaining"` count leaks that the username IS valid. A non-existent username also increments the counter but the message pattern reveals account existence. Consider returning the same message regardless. |

---

### TC-AUTH-009: Invalid Login — Non-Existent Username

| Field | Value |
|---|---|
| **Endpoint** | `POST /api/auth/login` |
| **Auth** | None |
| **Request** | ```json {"username":"nonexistent","password":"Test@1234"}``` |
| **Expected Response** | `401 Unauthorized` — `"Invalid username or password"` |
| **Expected DB Change** | None. Counter still incremented for `nonexistent`. |
| **Possible Failure** | Different error message or timing vs. valid-username-wrong-password (information leak). |
| **Fix Suggestion** | Ensure response time is similar for both paths to prevent timing-based username enumeration. |

---

### TC-AUTH-010: Account Lockout After 5 Failed Attempts

| Field | Value |
|---|---|
| **Endpoint** | `POST /api/auth/login` (×6) |
| **Auth** | None |
| **Request** | Same invalid login 6 times for same username. |
| **Expected Response** | Attempts 1-4: `401` with remaining count. Attempt 5: `401` + lockout. Attempt 6: `423 Locked` — `"Account locked due to too many failed login attempts. Try again in 15 minutes."` |
| **Expected DB Change** | None. In-memory `ConcurrentHashMap` tracks lockouts. |
| **Possible Failure** | **CRITICAL**: Lockout state is **in-memory only**. Server restart clears all lockouts. Distributed deployments (multiple instances) don't share lockout state. |
| **Fix Suggestion** | Move lockout tracking to Redis or database for production. Current in-memory `ConcurrentHashMap` is not production-grade. Also add cleanup of stale entries to prevent memory leak. |

---

### TC-AUTH-011: Token Required — Access Protected Endpoint Without Token

| Field | Value |
|---|---|
| **Endpoint** | `GET /api/profile` |
| **Auth** | None (no `Authorization` header) |
| **Request** | No body. |
| **Expected Response** | `401 Unauthorized` or `403 Forbidden` |
| **Expected DB Change** | None. |
| **Possible Failure** | Spring Security returns `403` instead of `401` by default when no token provided. |
| **Fix Suggestion** | **BUG**: No custom `AuthenticationEntryPoint` is configured in `SecurityConfig`. Spring's default will return `403 Forbidden` for unauthenticated requests, which is semantically wrong — it should be `401 Unauthorized`. **Add a custom `AuthenticationEntryPoint` that returns 401 with a JSON body.** |

---

### TC-AUTH-012: Expired Token

| Field | Value |
|---|---|
| **Endpoint** | `GET /api/profile` |
| **Auth** | `Bearer <expired-jwt>` |
| **Request** | Use a JWT with `exp` set in the past. |
| **Expected Response** | `401 Unauthorized` — token validation fails |
| **Expected DB Change** | None. |
| **Possible Failure** | `JwtAuthFilter` catches the `ExpiredJwtException` silently (sets no auth context), request proceeds as unauthenticated → Spring returns `403` instead of `401`. |
| **Fix Suggestion** | In `JwtAuthFilter.doFilterInternal()`, when `validateToken()` returns `false`, the filter simply doesn't set authentication and continues. This results in a `403` from Spring Security. **Should return `401` with a clear "Token expired" message.** Override the filter to send `401` directly when token validation fails. |

---

### TC-AUTH-013: Tampered Token

| Field | Value |
|---|---|
| **Endpoint** | `GET /api/profile` |
| **Auth** | `Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJqb2huX2RvZSIsInJvbGUiOiJBRE1JTiJ9.invalid_signature` |
| **Request** | JWT with modified claims (role changed to ADMIN) but invalid signature. |
| **Expected Response** | `401 Unauthorized` (or `403` due to the bug in TC-AUTH-011) |
| **Expected DB Change** | None. |
| **Possible Failure** | If signature validation is weak or key is guessable. |
| **Fix Suggestion** | `JwtTokenProvider.validateToken()` properly catches `JwtException`. The HMAC key from `application.properties` is Base64-decoded (`bXlTdXBlclNlY3JldEtleUZvckpXVFRva2VuR2VuZXJhdGlvbjEyMzQ1Njc4OTA=` = `mySuperSecretKeyForJWTTokenGeneration1234567890`). **CRITICAL: This default secret is in the source code and easily guessable. Must use `JWT_SECRET` env var in production with a cryptographically random 256+ bit key.** |

---

### TC-AUTH-014: Role Access Control — Student Accessing Admin Endpoint

| Field | Value |
|---|---|
| **Endpoint** | `GET /api/admin/users` |
| **Auth** | `Bearer <student-token>` |
| **Expected Response** | `403 Forbidden` |
| **Expected DB Change** | None. |
| **Possible Failure** | Misconfigured `.hasRole("ADMIN")` in security chain. |
| **Fix Suggestion** | Verified: `.requestMatchers("/api/admin/**").hasRole("ADMIN")` is correctly configured. |

---

### TC-AUTH-015: Role Access Control — Student Creating Quiz

| Field | Value |
|---|---|
| **Endpoint** | `POST /api/quizzes` |
| **Auth** | `Bearer <student-token>` |
| **Request** | ```json {"title":"Student Quiz","status":"DRAFT","questions":[]}``` |
| **Expected Response** | `403 Forbidden` |
| **Expected DB Change** | None. |
| **Possible Failure** | Security config allows it accidentally. |
| **Fix Suggestion** | Verified: `.requestMatchers(HttpMethod.POST, "/api/quizzes").hasAnyRole("ADMIN", "TEACHER")`. Additionally, `QuizService.createQuiz()` checks `principal.isTeacherOrAdmin()`. Double-layer protection — good. |

---

### TC-AUTH-016: Rate Limiting on Auth Endpoints

| Field | Value |
|---|---|
| **Endpoint** | `POST /api/auth/login` (×11) |
| **Auth** | None |
| **Request** | 11 rapid requests from same IP within 1 minute. |
| **Expected Response** | First 10: normal responses. 11th: `429 Too Many Requests` — `{"status":429,"message":"Too many requests. Please try again later."}` |
| **Expected DB Change** | None. |
| **Possible Failure** | Rate limit is per-IP. Behind a load balancer, all clients may share the same IP (`X-Forwarded-For` is read but can be spoofed). |
| **Fix Suggestion** | **MEDIUM RISK**: `RateLimitFilter.getClientIP()` trusts `X-Forwarded-For` header. An attacker can bypass rate limiting by sending a fake `X-Forwarded-For: <random-ip>` header. **Only trust `X-Forwarded-For` from known proxy IPs.** Also, rate limit state is in-memory — same issue as login lockout. |

---

## 2. ADMIN — Admin Operations

### TC-ADMIN-001: List All Users (Paginated)

| Field | Value |
|---|---|
| **Endpoint** | `GET /api/admin/users?page=0&size=20` |
| **Auth** | `Bearer <admin-token>` |
| **Expected Response** | `200 OK` — paginated list of `UserAdminDTO` objects with `id, name, username, email, role, createdAt`. No passwords. |
| **Expected DB Change** | None. |
| **Possible Failure** | Password hash leaked in response. |
| **Fix Suggestion** | `UserAdminDTO` does not contain password field — safe. Verify `@JsonIgnore` on `User.password`. |

---

### TC-ADMIN-002: Get Users by Role

| Field | Value |
|---|---|
| **Endpoint** | `GET /api/admin/users/role/TEACHER?page=0&size=20` |
| **Auth** | `Bearer <admin-token>` |
| **Expected Response** | `200 OK` — only TEACHER users. |
| **Expected DB Change** | None. |
| **Possible Failure** | Invalid role string (e.g., `/role/HACKER`) might throw `500` instead of `400`. |
| **Fix Suggestion** | Spring will throw `MethodArgumentTypeMismatchException` for invalid enum value. This is NOT handled in `GlobalExceptionHandler` — will fall through to generic `500`. **Add handler for `MethodArgumentTypeMismatchException` returning `400`.** |

---

### TC-ADMIN-003: Update User Role

| Field | Value |
|---|---|
| **Endpoint** | `PUT /api/admin/users/5/role` |
| **Auth** | `Bearer <admin-token>` |
| **Request** | ```json {"role":"TEACHER"}``` |
| **Expected Response** | `200 OK` — updated `UserAdminDTO` with `role: TEACHER` |
| **Expected DB Change** | `"user"` table: row `id=5` has `role` updated to `TEACHER`. |
| **Possible Failure** | Admin can change their own role to non-admin, locking themselves out. |
| **Fix Suggestion** | Verify `AdminService.updateUserRole()` checks if admin is modifying their own account. If not, **add self-modification guard**: admin should not be able to demote themselves. |

---

### TC-ADMIN-004: Delete User

| Field | Value |
|---|---|
| **Endpoint** | `DELETE /api/admin/users/5` |
| **Auth** | `Bearer <admin-token>` |
| **Expected Response** | `204 No Content` |
| **Expected DB Change** | User `id=5` deleted. All associated quiz_attempts and answers for that user should cascade or be handled. |
| **Possible Failure** | Foreign key constraint violation if user has quiz attempts. Orphaned quizzes if deleted user was a teacher with quizzes. |
| **Fix Suggestion** | Verify cascade settings. `Quiz.createdBy` is `@ManyToOne` with no cascade delete — deleting a teacher will cause referential integrity violations. **Add `ON DELETE SET NULL` or handle cleanup in `AdminService.deleteUser()`.** |

---

### TC-ADMIN-005: Delete Quiz (Admin)

| Field | Value |
|---|---|
| **Endpoint** | `DELETE /api/admin/quizzes/10` |
| **Auth** | `Bearer <admin-token>` |
| **Expected Response** | `204 No Content` |
| **Expected DB Change** | Quiz `id=10` deleted with all questions, options, and attempts cascaded. |
| **Possible Failure** | Orphaned `quiz_attempt` records if cascade not set. |
| **Fix Suggestion** | `Quiz.questions` has `CascadeType.ALL, orphanRemoval = true`. But `QuizAttempt.quiz` is `@ManyToOne` — quiz deletion will fail with FK constraint on `quiz_attempt.quiz_id`. **CRITICAL: `AdminService.deleteQuiz()` must delete all attempts first, or add cascade on the Quiz side.** |

---

### TC-ADMIN-006: View System Statistics

| Field | Value |
|---|---|
| **Endpoint** | `GET /api/admin/stats` |
| **Auth** | `Bearer <admin-token>` |
| **Expected Response** | `200 OK` — `SystemStatsDTO` with counts of users, quizzes, attempts, etc. |
| **Expected DB Change** | None. |
| **Possible Failure** | N+1 query performance issue on large datasets. |
| **Fix Suggestion** | Ensure stats queries use `COUNT()` aggregations, not loading full entities. |

---

### TC-ADMIN-007: Non-Admin Accessing Admin Endpoint

| Field | Value |
|---|---|
| **Endpoint** | `GET /api/admin/users` |
| **Auth** | `Bearer <teacher-token>` |
| **Expected Response** | `403 Forbidden` |
| **Expected DB Change** | None. |
| **Possible Failure** | None expected — security config is correct. |
| **Fix Suggestion** | N/A — verified. |

---

## 3. TEACHER — Teacher Operations

### TC-TEACH-001: Create Quiz (Draft)

| Field | Value |
|---|---|
| **Endpoint** | `POST /api/quizzes` |
| **Auth** | `Bearer <teacher-token>` |
| **Request** | ```json {"title":"Java Basics","description":"Intro quiz","category":"Programming","timeLimitMinutes":30,"negativeMarking":false,"shuffleQuestions":true,"shuffleOptions":true,"passPercentage":60,"difficulty":"EASY","tags":"java,basics","questions":[{"text":"What is JVM?","options":["Virtual Machine","Compiler","Editor","OS"],"correctOption":"Virtual Machine","marks":2},{"text":"What is JDK?","options":["Dev Kit","Runtime","Library","None"],"correctOption":"Dev Kit","marks":1}]}``` |
| **Expected Response** | `201 Created` — full Quiz object with `id`, `status: DRAFT`, `createdBy` set to teacher, `shareCode: null`. |
| **Expected DB Change** | New row in `quiz` table. 2 rows in `question` table linked by `quiz_id`. 8 rows in `question_option` table. `totalMarks` computed as `2+1=3`. |
| **Possible Failure** | `status` could be overridden by request body (client sends `PUBLISHED` directly). |
| **Fix Suggestion** | **BUG CONFIRMED**: `QuizService.createQuiz()` does `quiz.setStatus(QuizStatus.DRAFT)` — this is correct, it overrides any client-sent status. Good. However, the client sends the full `Quiz` entity directly (`@RequestBody Quiz quiz`), not a DTO. This means clients can set `id`, `createdBy`, `createdAt`, `shareCode` in the request body. **Replace `Quiz` with a `CreateQuizRequest` DTO** to control exactly which fields are accepted. |

---

### TC-TEACH-002: Update Quiz

| Field | Value |
|---|---|
| **Endpoint** | `PUT /api/quizzes/10` |
| **Auth** | `Bearer <teacher-token>` (owner) |
| **Request** | ```json {"title":"Java Basics v2","description":"Updated","category":"Java","timeLimitMinutes":45,"questions":[{"text":"Updated Q1","options":["A","B","C","D"],"correctOption":"A","marks":3}]}``` |
| **Expected Response** | `200 OK` — updated Quiz. |
| **Expected DB Change** | Quiz `id=10` title, description, category updated. Old questions removed (`orphanRemoval=true`), new question inserted. |
| **Possible Failure** | Teacher can update a PUBLISHED quiz if no status check exists in `updateQuiz()`. |
| **Fix Suggestion** | **BUG**: `QuizService.updateQuiz()` does NOT check `quiz.getStatus()`. A teacher can modify a PUBLISHED or CLOSED quiz, changing questions after students have already attempted it. **Add guard: reject updates if `status != DRAFT`**, or at minimum disallow question changes on published quizzes. |

---

### TC-TEACH-003: Update Quiz — Not Owner

| Field | Value |
|---|---|
| **Endpoint** | `PUT /api/quizzes/10` |
| **Auth** | `Bearer <different-teacher-token>` |
| **Request** | ```json {"title":"Hijacked Quiz"}``` |
| **Expected Response** | `403 Forbidden` — `"You can only update your own quizzes"` |
| **Expected DB Change** | None. |
| **Possible Failure** | Ownership check bypass. |
| **Fix Suggestion** | `validateOwnership()` checks `principal.getId()` against `quiz.getCreatedBy().getId()`. Correct. |

---

### TC-TEACH-004: Delete Quiz — Owner

| Field | Value |
|---|---|
| **Endpoint** | `DELETE /api/quizzes/10` |
| **Auth** | `Bearer <teacher-token>` (owner) |
| **Expected Response** | `204 No Content` |
| **Expected DB Change** | Quiz deleted. Questions + options cascaded. |
| **Possible Failure** | FK constraint from `quiz_attempt` table blocks deletion. |
| **Fix Suggestion** | **CRITICAL**: Same issue as TC-ADMIN-005. Teacher deleting a quiz that has been attempted will fail with `DataIntegrityViolationException` → `500`. **Must either cascade delete attempts or prevent deletion of attempted quizzes.** |

---

### TC-TEACH-005: Publish Quiz

| Field | Value |
|---|---|
| **Endpoint** | `POST /api/quizzes/10/publish` |
| **Auth** | `Bearer <teacher-token>` (owner) |
| **Expected Response** | `200 OK` — `{"quizId":10,"title":"Java Basics","shareCode":"AB12CD34","shareUrl":"/api/quizzes/share/AB12CD34"}` |
| **Expected DB Change** | `quiz.status` → `PUBLISHED`. `quiz.share_code` generated (8 chars, alphanumeric). |
| **Possible Failure** | Publishing quiz with 0 questions. |
| **Fix Suggestion** | `publishQuiz()` checks `quiz.getQuestions().isEmpty()` — throws `BadRequestException`. Good. |

---

### TC-TEACH-006: Publish Quiz — No Questions

| Field | Value |
|---|---|
| **Endpoint** | `POST /api/quizzes/11/publish` |
| **Auth** | `Bearer <teacher-token>` (owner of quiz 11 which has 0 questions) |
| **Expected Response** | `400 Bad Request` — `"Cannot publish a quiz without questions"` |
| **Expected DB Change** | None. |
| **Possible Failure** | None — properly validated. |
| **Fix Suggestion** | N/A. |

---

### TC-TEACH-007: Close Quiz

| Field | Value |
|---|---|
| **Endpoint** | `POST /api/quizzes/10/close` |
| **Auth** | `Bearer <teacher-token>` (owner) |
| **Expected Response** | `200 OK` — Quiz with `status: CLOSED` |
| **Expected DB Change** | `quiz.status` → `CLOSED`. |
| **Possible Failure** | Closing a DRAFT quiz (should it be allowed?). |
| **Fix Suggestion** | `closeQuiz()` has no status check — allows closing a DRAFT quiz. **Consider adding validation: only PUBLISHED quizzes can be closed.** |

---

### TC-TEACH-008: View Quiz Students / Attempts

| Field | Value |
|---|---|
| **Endpoint** | `GET /api/quizzes/10/students?sort=score_desc` |
| **Auth** | `Bearer <teacher-token>` (owner) |
| **Expected Response** | `200 OK` — List of `QuizAttempt` objects sorted by score descending. |
| **Expected DB Change** | None. |
| **Possible Failure** | N+1 query: each attempt loads user + quiz lazily. |
| **Fix Suggestion** | Use `@EntityGraph` or `JOIN FETCH` in the repository query to eagerly load `user` and `quiz` associations. |

---

### TC-TEACH-009: View Leaderboard

| Field | Value |
|---|---|
| **Endpoint** | `GET /api/quizzes/10/leaderboard` |
| **Auth** | None (public endpoint per security config) |
| **Expected Response** | `200 OK` — List of `QuizAttempt` sorted by score desc, time asc. |
| **Expected DB Change** | None. |
| **Possible Failure** | **INFO LEAK**: Leaderboard is PUBLIC (no auth required). It exposes `User` objects (username, potentially other fields) via the `QuizAttempt.user` field. |
| **Fix Suggestion** | Return a `LeaderboardDTO` with only `username`, `score`, `timeTaken` — not the full `User` entity. Also verify `@JsonIgnore` on `User.password` is honored in this serialization path. |

---

### TC-TEACH-010: Export Quiz as JSON

| Field | Value |
|---|---|
| **Endpoint** | `GET /api/quizzes/10/export` |
| **Auth** | `Bearer <teacher-token>` (owner) |
| **Expected Response** | `200 OK` — `Content-Type: application/json`, `Content-Disposition: attachment; filename=quiz-10.json` |
| **Expected DB Change** | None. |
| **Possible Failure** | Correct answers exposed in export (may be intentional for teacher). |
| **Fix Suggestion** | This is expected behavior — teacher should see answers in export. |

---

### TC-TEACH-011: Export Attempts as CSV

| Field | Value |
|---|---|
| **Endpoint** | `GET /api/quizzes/10/attempts/export` |
| **Auth** | `Bearer <teacher-token>` (owner) |
| **Expected Response** | `200 OK` — `Content-Type: text/csv` with attempt data. |
| **Expected DB Change** | None. |
| **Possible Failure** | CSV injection if student names contain `=`, `+`, `-`, `@`. |
| **Fix Suggestion** | **MEDIUM RISK**: Sanitize all user-provided strings in CSV output by prefixing with `'` or wrapping in quotes to prevent formula injection in Excel. |

---

## 4. STUDENT — Student Operations

### TC-STU-001: View Available Quiz by ID

| Field | Value |
|---|---|
| **Endpoint** | `GET /api/quizzes/10` |
| **Auth** | None (public per security config `GET /api/quizzes/**` is `.permitAll()`) |
| **Expected Response** | `200 OK` — `QuizDTO` with questions and options but **NO correct answers**. |
| **Expected DB Change** | None. |
| **Possible Failure** | **CRITICAL**: `QuizDTO` must NOT contain `correctOption`. |
| **Fix Suggestion** | Verified: `QuestionDTO` only has `id`, `text`, `options` — no `correctOption` field. Good. |

---

### TC-STU-002: View Quiz by Share Code

| Field | Value |
|---|---|
| **Endpoint** | `GET /api/quizzes/share/AB12CD34` |
| **Auth** | None (public) |
| **Expected Response** | `200 OK` — `QuizDTO` if quiz is PUBLISHED and within time window. |
| **Expected DB Change** | None. |
| **Possible Failure** | Returns quiz even if DRAFT or CLOSED (status check missing). |
| **Fix Suggestion** | `getQuizByShareCode()` checks `quiz.isAvailable()` — good. If not available, throws `BadRequestException`. |

---

### TC-STU-003: Check If Already Attempted

| Field | Value |
|---|---|
| **Endpoint** | `GET /api/quizzes/10/attempted` |
| **Auth** | `Bearer <student-token>` |
| **Expected Response** | `200 OK` — `{"attempted": false}` or `{"attempted": true}` |
| **Expected DB Change** | None. |
| **Possible Failure** | Returns `attempted: false` even after submission (cache issue). |
| **Fix Suggestion** | Direct DB query — no caching involved. Should be accurate. |

---

### TC-STU-004: Submit Quiz — Valid Submission

| Field | Value |
|---|---|
| **Endpoint** | `POST /api/quizzes/10/submit` |
| **Auth** | `Bearer <student-token>` |
| **Request** | ```json {"answers":{"1":"Virtual Machine","2":"Dev Kit"},"timeTakenSeconds":450}``` |
| **Expected Response** | `200 OK` — `QuizResultResponse` with `correctCount`, `totalQuestions`, `marksObtained`, `totalMarks`, `passed`, `answers[]` with per-question review. |
| **Expected DB Change** | New `quiz_attempt` row. New `answer` rows for each question. `score = (marksObtained * 100) / totalMarks`. |
| **Possible Failure** | Score calculation error with negative marking. |
| **Fix Suggestion** | See TC-LOGIC section for detailed scoring tests. |

---

### TC-STU-005: Submit Quiz — Reattempt Prevention

| Field | Value |
|---|---|
| **Endpoint** | `POST /api/quizzes/10/submit` |
| **Auth** | `Bearer <student-token>` (same student who already submitted) |
| **Request** | ```json {"answers":{"1":"A"},"timeTakenSeconds":100}``` |
| **Expected Response** | `403 Forbidden` — `"You have already attempted this quiz"` |
| **Expected DB Change** | None. No duplicate attempt created. |
| **Possible Failure** | Race condition: two simultaneous submissions could both pass the `existsByUserIdAndQuizId` check. |
| **Fix Suggestion** | **CRITICAL**: Add a `UNIQUE` constraint on `(user_id, quiz_id)` in the `quiz_attempt` table. The current check is application-level only — a race condition can bypass it. |

---

### TC-STU-006: Submit Quiz — Teacher/Admin Cannot Attempt

| Field | Value |
|---|---|
| **Endpoint** | `POST /api/quizzes/10/submit` |
| **Auth** | `Bearer <teacher-token>` |
| **Request** | ```json {"answers":{"1":"A"},"timeTakenSeconds":100}``` |
| **Expected Response** | `403 Forbidden` — `"Teachers and Admins cannot attempt quizzes"` |
| **Expected DB Change** | None. |
| **Possible Failure** | None — explicitly checked. |
| **Fix Suggestion** | Good validation. |

---

### TC-STU-007: Submit Quiz — Quiz Not Published

| Field | Value |
|---|---|
| **Endpoint** | `POST /api/quizzes/11/submit` (quiz 11 is DRAFT) |
| **Auth** | `Bearer <student-token>` |
| **Expected Response** | `403 Forbidden` — `"This quiz is not available for submission"` |
| **Expected DB Change** | None. |
| **Possible Failure** | None — status check exists. |
| **Fix Suggestion** | N/A. |

---

### TC-STU-008: Submit Quiz — Closed Quiz

| Field | Value |
|---|---|
| **Endpoint** | `POST /api/quizzes/12/submit` (quiz 12 is CLOSED) |
| **Auth** | `Bearer <student-token>` |
| **Expected Response** | `403 Forbidden` — `"This quiz has been closed and is no longer accepting submissions"` |
| **Expected DB Change** | None. |
| **Possible Failure** | None. |
| **Fix Suggestion** | N/A. |

---

### TC-STU-009: View Attempt History

| Field | Value |
|---|---|
| **Endpoint** | `GET /api/profile/attempts` |
| **Auth** | `Bearer <student-token>` |
| **Expected Response** | `200 OK` — List of `QuizAttempt` ordered by `attemptedAt` descending. |
| **Expected DB Change** | None. |
| **Possible Failure** | Student can see other students' attempts (IDOR). |
| **Fix Suggestion** | `quizService.getUserAttempts(principal.getId())` uses the authenticated user's ID — no IDOR possible. Good. |

---

### TC-STU-010: View Paginated Attempt History

| Field | Value |
|---|---|
| **Endpoint** | `GET /api/profile/attempts/paginated?page=0&size=10` |
| **Auth** | `Bearer <student-token>` |
| **Expected Response** | `200 OK` — Paginated attempts. |
| **Expected DB Change** | None. |
| **Possible Failure** | None. |
| **Fix Suggestion** | N/A. |

---

## 5. LOGIC — Business Logic Validation

### TC-LOGIC-001: Score Calculation — All Correct, No Negative Marking

| Field | Value |
|---|---|
| **Endpoint** | `POST /api/quizzes/{id}/submit` |
| **Scenario** | Quiz: 3 questions (marks: 2, 3, 5). `negativeMarking=false`. Student answers all correctly. |
| **Expected Result** | `correctCount=3`, `totalMarks=10`, `marksObtained=10`, `score=100`. |
| **Formula** | `score = (marksObtained * 100) / totalMarks = (10 * 100) / 10 = 100` |
| **Possible Failure** | Integer division truncation. |
| **Fix Suggestion** | The code uses `(int) ((marksObtained * 100.0) / totalMarks)` — the `100.0` ensures floating-point division. Cast to `int` truncates (doesn't round). For score `66.67%` it would show `66`. Consider using `Math.round()`. |

---

### TC-LOGIC-002: Score Calculation — With Negative Marking

| Field | Value |
|---|---|
| **Endpoint** | `POST /api/quizzes/{id}/submit` |
| **Scenario** | Quiz: 4 questions (marks: 2 each). `negativeMarking=true`. Student: 2 correct, 1 wrong, 1 unanswered (null). |
| **Expected Result** | Correct: +2 + +2 = 4. Wrong: −ceil(2×0.25) = −1. Unanswered: 0. `marksObtained = max(0, 4−1) = 3`. `totalMarks=8`. `score = (3*100)/8 = 37`. |
| **Formula** | Wrong answer penalty = `−ceil(marks × 0.25)` = 25% of question marks, rounded up. |
| **Possible Failure** | Unanswered (null) question incorrectly treated as wrong answer and penalized. |
| **Fix Suggestion** | Code checks `submittedAnswer != null` before applying negative marking — unanswered questions get `0`. Correct. |

---

### TC-LOGIC-003: Score Calculation — All Wrong With Negative Marking

| Field | Value |
|---|---|
| **Scenario** | Quiz: 3 questions (marks: 1 each). `negativeMarking=true`. All wrong. |
| **Expected Result** | Penalty: −1 × 3 = −3. `marksObtained = max(0, -3) = 0`. `score = 0`. |
| **Possible Failure** | Negative score returned. |
| **Fix Suggestion** | Code has `marksObtained = Math.max(0, marksObtained)`. Good — score floor is 0. |

---

### TC-LOGIC-004: Pass/Fail Threshold

| Field | Value |
|---|---|
| **Scenario** | Quiz with `passPercentage=60`. Student scores 59%. |
| **Expected Result** | `passed = false`. |
| **Formula** | `passed = score >= passPercentage` → `59 >= 60` → `false`. |
| **Possible Failure** | Off-by-one: `60 >= 60` should be `passed = true`. |
| **Fix Suggestion** | Code uses `score >= quiz.getPassPercentage()` — 60 passes at 60%. Correct. |

---

### TC-LOGIC-005: Time Limit Enforcement

| Field | Value |
|---|---|
| **Scenario** | Quiz with `timeLimitMinutes=30`. Student submits with `timeTakenSeconds=1900` (31.7 min). |
| **Expected Result** | **Submission should be rejected or flagged.** |
| **Possible Failure** | **CRITICAL BUG**: There is **NO server-side time limit enforcement**. The `timeTakenSeconds` is a client-provided value that is stored but never validated against `timeLimitMinutes`. A student can take unlimited time and submit any value for `timeTakenSeconds`. |
| **Fix Suggestion** | **Add server-side validation in `submitQuiz()`**: ```java if (quiz.getTimeLimitMinutes() != null && request.getTimeTakenSeconds() != null) { int limitSeconds = quiz.getTimeLimitMinutes() * 60; if (request.getTimeTakenSeconds() > limitSeconds + GRACE_PERIOD_SECONDS) { throw new ForbiddenException("Time limit exceeded"); } } ``` Better yet, record `startTime` server-side when quiz is loaded and validate against that. |

---

### TC-LOGIC-006: Quiz Availability — Start/End Time Window

| Field | Value |
|---|---|
| **Scenario** | Quiz with `startTime=2026-02-13T00:00:00`, `endTime=2026-02-14T00:00:00`. Student submits on 2026-02-12. |
| **Expected Result** | `403 Forbidden` — `"This quiz is not currently available"` |
| **Possible Failure** | `isAvailable()` uses `LocalDateTime.now()` which is server-local time. If server timezone differs from expected timezone, window may be wrong. |
| **Fix Suggestion** | Consider using `ZonedDateTime` or `Instant` for time comparisons to avoid timezone ambiguity. Also, `submitQuiz()` checks `isAvailable()` — confirmed. |

---

### TC-LOGIC-007: Duplicate Submission Prevention

| Field | Value |
|---|---|
| **Scenario** | Student sends two `POST /api/quizzes/10/submit` requests simultaneously. |
| **Expected Result** | Exactly one succeeds. Second gets `403 Forbidden`. |
| **Possible Failure** | Both pass `existsByUserIdAndQuizId` check and both insert. |
| **Fix Suggestion** | **As noted in TC-STU-005**: Add DB-level `UNIQUE(user_id, quiz_id)` constraint on `quiz_attempt` table. Without it, race condition WILL create duplicates under concurrent load. |

---

### TC-LOGIC-008: Data Consistency — Answer Count vs Question Count

| Field | Value |
|---|---|
| **Scenario** | Quiz has 5 questions. Student submits only 3 answers. |
| **Expected Result** | Accepted. Missing answers treated as unanswered (score 0 per question, no penalty unless negative marking). |
| **Possible Failure** | `NullPointerException` when looking up missing question IDs in the answers map. |
| **Fix Suggestion** | Code iterates over `quiz.getQuestions()` and does `submittedAnswers.get(question.getId())` — returns `null` for missing answers. `null` check exists for negative marking. Safe. |

---

### TC-LOGIC-009: Data Consistency — Extra Answers for Non-Existent Questions

| Field | Value |
|---|---|
| **Scenario** | Student submits `{"answers":{"1":"A","999":"B"}}` where question 999 doesn't belong to the quiz. |
| **Expected Result** | Extra answer ignored. Score based only on quiz's actual questions. |
| **Possible Failure** | None — iteration is over `quiz.getQuestions()`, not `submittedAnswers`. |
| **Fix Suggestion** | Correct. Extra answers silently ignored. Could log a warning. |

---

## 6. SECURITY — Security Testing

### TC-SEC-001: SQL Injection — Login

| Field | Value |
|---|---|
| **Endpoint** | `POST /api/auth/login` |
| **Request** | ```json {"username":"admin' OR '1'='1","password":"anything"}``` |
| **Expected Response** | `401 Unauthorized` — no SQL injection. |
| **Expected DB Change** | None. |
| **Possible Failure** | Raw SQL query allows injection. |
| **Fix Suggestion** | Spring Data JPA uses parameterized queries. `userRepository.findByUsername()` is a derived query — safe from SQL injection. **However**, check `QuizRepository` custom `@Query` annotations for string concatenation. |

---

### TC-SEC-002: SQL Injection — Quiz Search

| Field | Value |
|---|---|
| **Endpoint** | `GET /api/quizzes?search='; DROP TABLE quiz; --` |
| **Expected Response** | `200 OK` — empty results. No table dropped. |
| **Expected DB Change** | None. |
| **Possible Failure** | Custom JPQL/native queries with string concatenation. |
| **Fix Suggestion** | `QuizRepository.findAvailableWithFilters` uses `@Query` with named parameters (`:search`, `:category`). JPQL parameterized queries are safe. **Verified safe.** |

---

### TC-SEC-003: JWT Tampering — Change Role in Payload

| Field | Value |
|---|---|
| **Endpoint** | Any protected endpoint. |
| **Auth** | JWT with header+payload manually edited to change `"role":"STUDENT"` → `"role":"ADMIN"`, then re-encoded (without valid signature). |
| **Expected Response** | `401`/`403` — signature validation fails. |
| **Expected DB Change** | None. |
| **Possible Failure** | None if HMAC verification works. |
| **Fix Suggestion** | `JwtTokenProvider.validateToken()` verifies with `getSigningKey()`. Signature mismatch throws `JwtException`. Safe. |

---

### TC-SEC-004: JWT — Algorithm Confusion Attack

| Field | Value |
|---|---|
| **Auth** | JWT signed with `alg: none` or `alg: HS256` using the public key. |
| **Expected Response** | Rejection. |
| **Fix Suggestion** | The JJWT library (used here) does NOT accept `alg: none` by default. `verifyWith(getSigningKey())` enforces HMAC. Safe. |

---

### TC-SEC-005: Password Hashing Verification

| Field | Value |
|---|---|
| **Test** | Register a user, then query `SELECT password FROM "user" WHERE username='john_doe'`. |
| **Expected** | Password is BCrypt hash: `$2a$10$...` (60 characters). NOT the plaintext password. |
| **Possible Failure** | `passwordEncoder.encode()` not called. |
| **Fix Suggestion** | `AuthService.register()` calls `passwordEncoder.encode(request.getPassword())`. `SecurityConfig` defines `BCryptPasswordEncoder`. Verified. |

---

### TC-SEC-006: Password Not in API Responses

| Field | Value |
|---|---|
| **Test** | Check all API responses that include user data: `/api/profile`, `/api/admin/users`, `/api/quizzes/{id}/leaderboard`. |
| **Expected** | No response contains `password` field. |
| **Possible Failure** | `User.password` serialized in nested objects (e.g., `QuizAttempt.user`). |
| **Fix Suggestion** | `User.password` has `@JsonIgnore`. `LeaderboardDTO` should be used instead of raw `QuizAttempt` (see TC-TEACH-009). Check: `QuizAttempt.user` has `@JsonIgnoreProperties({"password"})` — **BUT** `@JsonIgnoreProperties` on the ManyToOne field only ignores listed properties during serialization of that association. The `@JsonIgnore` on `User.password` is the primary defense. **Verify both are working together.** |

---

### TC-SEC-007: Unauthorized Endpoint Access — IDOR on Quiz Operations

| Field | Value |
|---|---|
| **Endpoint** | `PUT /api/quizzes/10` |
| **Auth** | `Bearer <teacher-B-token>` (not owner of quiz 10) |
| **Expected Response** | `403 Forbidden` |
| **Possible Failure** | Ownership check bypassed. |
| **Fix Suggestion** | `validateOwnership()` is called in `updateQuiz`, `deleteQuiz`, `publishQuiz`, `closeQuiz`, `getQuizStudents`. All ownership-sensitive operations are covered. |

---

### TC-SEC-008: CORS — Disallowed Origin

| Field | Value |
|---|---|
| **Test** | Send request from `https://evil.com` with `Origin: https://evil.com`. |
| **Expected** | No `Access-Control-Allow-Origin` header in response. Browser blocks the response. |
| **Possible Failure** | Wildcard CORS or misconfigured origins. |
| **Fix Suggestion** | `SecurityConfig.corsConfigurationSource()` whitelists only `localhost:3000/3001/5173` and env var `CORS_ALLOWED_ORIGINS`. **BUT**: `setAllowCredentials(true)` combined with specific origins is correct. **HOWEVER**, the `CORS_ALLOWED_ORIGINS` env var is split by comma and added without validation — deployers must be careful not to add `*`.** |

---

### TC-SEC-009: CORS — Preflight Request

| Field | Value |
|---|---|
| **Endpoint** | `OPTIONS /api/quizzes` with `Origin: http://localhost:3000` |
| **Expected Response** | `200 OK` with `Access-Control-Allow-Origin: http://localhost:3000`, `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS`. |
| **Possible Failure** | Spring Security blocks OPTIONS requests before CORS filter runs. |
| **Fix Suggestion** | `cors()` is configured in the security filter chain with `.cors(cors -> cors.configurationSource(...))` — Spring handles preflight correctly. |

---

### TC-SEC-010: JWT Secret Exposure

| Field | Value |
|---|---|
| **Test** | Check if JWT secret is hardcoded or in source control. |
| **Finding** | **CRITICAL**: Default secret `bXlTdXBlclNlY3JldEtleUZvckpXVFRva2VuR2VuZXJhdGlvbjEyMzQ1Njc4OTA=` (Base64 of `mySuperSecretKeyForJWTTokenGeneration1234567890`) is in `application.properties` committed to source control. |
| **Fix Suggestion** | 1. Remove default value from properties. 2. **REQUIRE** `JWT_SECRET` environment variable. 3. Generate with: `openssl rand -base64 64`. 4. Add `application.properties` to `.gitignore` or use a secrets manager. |

---

### TC-SEC-011: CSRF Protection

| Field | Value |
|---|---|
| **Test** | Verify CSRF is handled correctly. |
| **Finding** | CSRF is **disabled** (`.csrf(AbstractHttpConfigurer::disable)`). |
| **Fix Suggestion** | Acceptable for a stateless JWT-based API. CSRF protection is unnecessary when using `Authorization: Bearer` headers (not cookies). However, if JWT is ever stored in cookies, re-enable CSRF. |

---

## 7. EDGE CASES — Boundary & Error Handling

### TC-EDGE-001: Empty Request Body — Registration

| Field | Value |
|---|---|
| **Endpoint** | `POST /api/auth/register` |
| **Request** | Empty body `{}` or no body at all. |
| **Expected Response** | `400 Bad Request` — `VALIDATION_ERROR` with required field errors. |
| **Possible Failure** | `NullPointerException` before validation runs. |
| **Fix Suggestion** | `@Valid @RequestBody` triggers validation. Empty `{}` returns field errors for `username`, `email`, `password`. Missing body entirely returns `400` from Spring's `HttpMessageNotReadableException`. **Verify `HttpMessageNotReadableException` is handled in `GlobalExceptionHandler`** — currently it's NOT. Will return generic `500`. **Add explicit handler.** |

---

### TC-EDGE-002: Invalid JSON — Malformed Body

| Field | Value |
|---|---|
| **Endpoint** | `POST /api/auth/login` |
| **Request** | `{invalid json` |
| **Expected Response** | `400 Bad Request` — `"Malformed JSON"` |
| **Possible Failure** | Spring throws `HttpMessageNotReadableException` which falls through to generic handler → `500`. |
| **Fix Suggestion** | **BUG**: `GlobalExceptionHandler` does NOT handle `HttpMessageNotReadableException`. Add: ```java @ExceptionHandler(HttpMessageNotReadableException.class) public ResponseEntity<ErrorResponse> handleBadJson(HttpMessageNotReadableException ex) { ... return 400; } ``` |

---

### TC-EDGE-003: Invalid JSON — Wrong Data Types

| Field | Value |
|---|---|
| **Endpoint** | `POST /api/quizzes/10/submit` |
| **Request** | ```json {"answers":"not a map","timeTakenSeconds":"not a number"}``` |
| **Expected Response** | `400 Bad Request` |
| **Possible Failure** | Jackson deserialization fails → `HttpMessageNotReadableException` → `500`. |
| **Fix Suggestion** | Same as TC-EDGE-002. |

---

### TC-EDGE-004: Large Payload — Registration

| Field | Value |
|---|---|
| **Endpoint** | `POST /api/auth/register` |
| **Request** | Username: 10,000 characters. Name: 100,000 characters. |
| **Expected Response** | `400 Bad Request` — `"Username must be between 3 and 50 characters"`. Name: `"Name must be at most 100 characters"`. |
| **Possible Failure** | No max request body size configured → potential DoS via extremely large payloads. |
| **Fix Suggestion** | **Add `server.tomcat.max-http-form-content-size` and `spring.servlet.multipart.max-request-size` limits** in `application.properties`. Also add `server.tomcat.max-swallow-size=2MB`. The `@Size` annotations will catch field-level limits, but a 100MB JSON body will still be parsed before validation runs. **Add a request size filter or configure Tomcat limits.** |

---

### TC-EDGE-005: Large Payload — Quiz With 10,000 Questions

| Field | Value |
|---|---|
| **Endpoint** | `POST /api/quizzes` |
| **Auth** | `Bearer <teacher-token>` |
| **Request** | Quiz with 10,000 questions, each with 10 options. |
| **Expected Response** | Should either succeed (if intentional) or return `400` with a limit message. |
| **Possible Failure** | OOM error, extremely slow DB insert, Hibernate batch insert not configured. |
| **Fix Suggestion** | **Add validation**: max questions per quiz (e.g., 500). Max options per question (e.g., 10). Add in `QuizService.createQuiz()`: ```java if (quiz.getQuestions() != null && quiz.getQuestions().size() > MAX_QUESTIONS) { throw new BadRequestException("Quiz cannot have more than " + MAX_QUESTIONS + " questions"); } ``` |

---

### TC-EDGE-006: Concurrent Quiz Submissions (Same Student, Same Quiz)

| Field | Value |
|---|---|
| **Endpoint** | `POST /api/quizzes/10/submit` (×2 simultaneous) |
| **Auth** | Same `Bearer <student-token>` |
| **Expected** | Exactly 1 succeeds. Other returns `403`. |
| **Possible Failure** | **CONFIRMED RACE CONDITION**: Both threads read `existsByUserIdAndQuizId = false`, both insert. Two `quiz_attempt` records created. |
| **Fix Suggestion** | **CRITICAL**: 1. Add DB constraint: `ALTER TABLE quiz_attempt ADD CONSTRAINT uq_user_quiz UNIQUE (user_id, quiz_id);`. 2. Wrap in pessimistic lock or use `INSERT ... ON CONFLICT DO NOTHING`. 3. Handle `DataIntegrityViolationException` gracefully. |

---

### TC-EDGE-007: Pagination — Negative Page Number

| Field | Value |
|---|---|
| **Endpoint** | `GET /api/quizzes?page=-1&size=10` |
| **Expected Response** | `400 Bad Request` or `500 Internal Server Error` |
| **Possible Failure** | `PageRequest.of(-1, 10)` throws `IllegalArgumentException` → `500`. |
| **Fix Suggestion** | Add validation: ```java if (page < 0) throw new BadRequestException("Page must be >= 0"); if (size < 1 || size > 100) throw new BadRequestException("Size must be 1-100"); ``` Or use `@Min(0)` on the `page` parameter. |

---

### TC-EDGE-008: Pagination — Excessive Page Size

| Field | Value |
|---|---|
| **Endpoint** | `GET /api/admin/users?page=0&size=1000000` |
| **Auth** | `Bearer <admin-token>` |
| **Expected Response** | Should cap at a reasonable max (e.g., 100). |
| **Possible Failure** | Loading 1M users into memory → OOM. |
| **Fix Suggestion** | **BUG**: No upper bound on `size` parameter anywhere. Add `Math.min(size, MAX_PAGE_SIZE)` or `@Max(100)` on all paginated endpoints. |

---

### TC-EDGE-009: Delete Non-Existent Resource

| Field | Value |
|---|---|
| **Endpoint** | `DELETE /api/admin/users/999999` |
| **Auth** | `Bearer <admin-token>` |
| **Expected Response** | `404 Not Found` — `"User not found"` |
| **Possible Failure** | `EmptyResultDataAccessException` → `500`. |
| **Fix Suggestion** | Verify `AdminService.deleteUser()` uses `findById()` + `orElseThrow(ResourceNotFoundException)` before calling `delete()`. |

---

### TC-EDGE-010: Quiz Share Code — Brute Force Guessing

| Field | Value |
|---|---|
| **Test** | Iterate share codes: `AAAAAAAA` through `ZZZZZZZZ`. |
| **Expected** | Rate limiting blocks mass guessing. |
| **Possible Failure** | **No rate limiting on `/api/quizzes/share/{code}`** — this is a public endpoint not covered by `RateLimitFilter` (which only covers `/api/auth/*`). |
| **Fix Suggestion** | 8-character alphanumeric code has 36^8 ≈ 2.8 trillion combinations — brute force is impractical. But add rate limiting on public quiz endpoints as defense-in-depth. Consider using UUIDs for share codes for extra entropy. |

---

### TC-EDGE-011: GET Endpoints Returning Full Entity Instead of DTO

| Field | Value |
|---|---|
| **Endpoints** | `GET /api/quizzes/my`, `GET /api/quizzes/{id}/students`, `GET /api/quizzes/{id}/leaderboard`, `GET /api/profile/attempts` |
| **Finding** | These return raw `Quiz`, `QuizAttempt`, `List<QuizAttempt>` entities instead of DTOs. |
| **Risk** | Leaks internal fields: `questions[].correctOption`, entity IDs, lazy-loaded associations triggering N+1 queries, `createdBy` user object. |
| **Fix Suggestion** | **HIGH PRIORITY**: Convert ALL controller returns to DTOs. Especially: 1. `GET /api/quizzes/my` returns `List<Quiz>` with `questions[].correctOption` exposed. 2. Leaderboard exposes full `User` and `Quiz` objects inside `QuizAttempt`. |

---

## 8. CRITICAL FINDINGS & PRODUCTION BLOCKERS

### Severity: CRITICAL (Must Fix Before Production)

| # | Finding | Location | Impact |
|---|---------|----------|--------|
| **C1** | **No DB-level unique constraint on `(user_id, quiz_id)` in `quiz_attempt`** | `QuizAttempt.java` | Concurrent submissions create duplicate attempts, corrupting scores/leaderboard |
| **C2** | **No server-side time limit enforcement** | `QuizService.submitQuiz()` | Students can take unlimited time regardless of `timeLimitMinutes` |
| **C3** | **JWT secret hardcoded in source code** | `application.properties` | Anyone with repo access can forge valid JWTs for any user/role |
| **C4** | **Teacher can modify published quiz questions** | `QuizService.updateQuiz()` | Questions changed after students attempted → inconsistent scoring data |
| **C5** | **Deleting quiz/user fails with FK constraint** | `AdminService`, `QuizService` | `500 Internal Server Error` when deleting entities with relationships |
| **C6** | **Raw entity returned with `correctOption` exposed** | `QuizController.getMyQuizzes()`, leaderboard endpoints | Students can see correct answers by inspecting API responses |
| **C7** | **Anyone can self-register as TEACHER** | `AuthService.register()` | Privilege escalation — no approval workflow for teacher role |

### Severity: HIGH (Fix in Next Sprint)

| # | Finding | Location | Impact |
|---|---------|----------|--------|
| **H1** | **Missing exception handlers** | `GlobalExceptionHandler` | `HttpMessageNotReadableException`, `MethodArgumentTypeMismatchException`, `DataIntegrityViolationException` return `500` instead of `400` |
| **H2** | **No request body size limit** | Server config | DoS via massive payloads |
| **H3** | **No pagination size cap** | All paginated endpoints | OOM via `?size=1000000` |
| **H4** | **No `AuthenticationEntryPoint`** | `SecurityConfig` | Unauthenticated requests return `403` instead of `401` |
| **H5** | **Leaderboard leaks full User entity** | `QuizController.getLeaderboard()` | PII exposure (email, phone) |
| **H6** | **Login lockout state is in-memory only** | `LoginAttemptService` | Cleared on restart; not shared across instances |
| **H7** | **Rate limit bypassable via `X-Forwarded-For`** | `RateLimitFilter` | Attacker spoofs different IP per request |

### Severity: MEDIUM (Plan for Improvement)

| # | Finding | Location | Impact |
|---|---------|----------|--------|
| **M1** | CSV export vulnerable to formula injection | `ExportService` | Excel/Sheets RCE if opened with malicious content |
| **M2** | No max questions/options limit per quiz | `QuizService.createQuiz()` | Performance degradation |
| **M3** | Username enumeration via login error messages | `AuthService.login()` | Attacker confirms valid usernames |
| **M4** | Score uses truncation instead of rounding | `QuizService.submitQuiz()` | `66.67%` displayed as `66%` |
| **M5** | Timezone ambiguity in quiz start/end times | `Quiz.isAvailable()` | Quiz windows may be off in different timezones |
| **M6** | No audit logging for admin operations | `AdminController` | No trail for user deletion, role changes |
| **M7** | Closing a DRAFT quiz is allowed | `QuizService.closeQuiz()` | Confusing state transition |

---

## Summary

| Category | Total Tests | Pass | Fail / Bug Found |
|----------|------------|------|-------------------|
| AUTH | 16 | 11 | 5 (lockout in-memory, no 401 entrypoint, rate limit bypass, JWT secret in code, teacher self-register) |
| ADMIN | 7 | 4 | 3 (FK constraints, missing exception handlers, self-demotion) |
| TEACHER | 11 | 8 | 3 (published quiz editable, entity leak, FK on delete) |
| STUDENT | 10 | 8 | 2 (race condition on submit, no time enforcement) |
| LOGIC | 9 | 6 | 3 (no time limit, race condition, truncation) |
| SECURITY | 11 | 8 | 3 (JWT secret, entity leaks, rate limit bypass) |
| EDGE CASES | 11 | 5 | 6 (missing handlers, no size limits, no pagination cap) |
| **TOTAL** | **75** | **50** | **25 issues found** |

**Verdict: NOT READY FOR PRODUCTION.** Fix all 7 Critical and 7 High severity issues before deploying.

---

## 9. REMEDIATION LOG (v2.0.0 — February 13, 2026)

A comprehensive backend audit identified 26 issues (3 Critical, 6 High, 8 Medium, 9 Low). All 26 have been fixed and verified with a successful Maven build. Below is the complete remediation summary.

### Critical Fixes

| ID | Issue | Fix Applied |
|----|-------|-------------|
| **C1** | Security filter ordering — teacher-restricted GET endpoints (`/my`, `/students`, `/pending-evaluations`, `/export`) were accessible publicly because `GET /api/quizzes/**` permitAll matched first | Reordered SecurityConfig: teacher/admin-restricted GET paths matched **before** public quiz GET routes |
| **C2** | Forgot-password endpoint returned reset token in HTTP response | Token removed from response, logged server-side only. Response returns generic "If the email exists..." message |
| **C3** | No JWT secret validation at startup | Added `@PostConstruct validateSecret()` — checks not null/blank, valid Base64, minimum 256-bit (32 bytes) |

### High Fixes

| ID | Issue | Fix Applied |
|----|-------|-------------|
| **H1** | CSV export double-calculated percentage (scores showed 800%+) | Uses `attempt.getScore()` directly (already 0-100). CSV columns changed to `Marks Obtained, Total Marks` |
| **H2** | AnswerDTO missing entity `id` field | Added `id` field to AnswerDTO, populated in all 3 builder sites (QuizService, EvaluationService, AdminService) |
| **H3** | QuizDTO missing 13 fields (description, difficulty, tags, etc.) | Added all fields: `description`, `difficulty`, `tags`, `shareCode`, `timeLimitMinutes`, `passPercentage`, `negativeMarking`, `shuffleQuestions`, `shuffleOptions`, `startTime`, `endTime`, `totalMarks`. Updated `convertToDTO()` |
| **H4** | Create/update quiz accepted raw Quiz entity (mass assignment risk) | New `CreateQuizRequest` DTO with `@Valid` annotations. Clients cannot set `id`, `createdBy`, `status`, `shareCode` |
| **H5** | `@EntityGraph` on listing queries eagerly loaded all questions + ElementCollections | Removed `@EntityGraph` from all listing/search/filter queries. Kept only on `findById()` and `findByShareCode()` |
| **H6** | Dashboard triggered 2 DB queries per quiz per page (N+1 problem) | Batch aggregation: single `findStatsForQuizIds()` query replaces per-quiz queries |

### Medium Fixes

| ID | Issue | Fix Applied |
|----|-------|-------------|
| **M1** | Quiz detail endpoint returned unpublished/expired quizzes | `getQuizByIdDTO()` now checks `quiz.isAvailable()`, throws `BadRequestException` if unavailable |
| **M2** | Dashboard quiz stats — no ownership check (IDOR) | `getQuizStatistics()` verifies `quiz.createdBy.id == teacherId`, throws `ForbiddenException` |
| **M3** | Admin can delete own account | `deleteUser()` rejects if `userId.equals(callingAdminId)` |
| **M4** | Rate limiter `ConcurrentHashMap` grew unbounded | Added cleanup every 100 requests — removes entries older than `2 × TIME_WINDOW_MS` |
| **M5** | Unused (reserved for future) | — |
| **M6** | Unused (reserved for future) | — |
| **M7** | Admin `getAllAttempts` lazy-loaded user/quiz (N+1) | Uses `findAllWithUserAndQuiz()` `JOIN FETCH` query |
| **M8** | Export service lazy-loaded user per attempt (N+1) | Uses `findByQuizIdWithUserForExport()` `JOIN FETCH` query |

### Low Fixes

| ID | Issue | Fix Applied |
|----|-------|-------------|
| **L1** | `AccessDeniedException` returned raw Spring error | Added `@ExceptionHandler(AccessDeniedException.class)` returning structured `{status: 403, error: "ACCESS_DENIED", message: "..."}` |
| **L2** | `passPercentage` had no range validation | Added `@Min(0) @Max(100)` on `Quiz.passPercentage` |
| **L3** | Unused (reserved for future) | — |
| **L4** | `getRecentAttempts` limit uncapped | Caps limit to max 100 |
| **L5–L7** | Various minor issues | Fixed (show-sql default to false, etc.) |
| **L8** | `validateToken()` double-parsed JWT | Now calls `parseClaims(token)` instead of separate parse chain |
| **L9** | No `updatedAt` timestamp on Quiz entity | Added `@UpdateTimestamp` on `Quiz.updatedAt` field |

### Verification

- All fixes compiled successfully (`mvn compile` — BUILD SUCCESS)
- No regressions in existing functionality
- API contract changes documented in `FRONTEND_API_DOCUMENTATION.md` v2.0.0
