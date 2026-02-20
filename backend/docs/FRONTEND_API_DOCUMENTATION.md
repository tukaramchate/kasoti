# Quiz Application - Frontend API Documentation

**Base URL:** `http://localhost:8080`  
**Content-Type:** `application/json`

---

## Table of Contents

1. [Authentication](#authentication)
2. [Quizzes](#quizzes)
3. [Profile](#profile)
4. [Dashboard (Teacher/Admin)](#dashboard-teacheradmin)
5. [Admin](#admin)
6. [Health Check](#health-check)
7. [Data Models](#data-models)
8. [Error Handling](#error-handling)

---

## Authentication

All authenticated endpoints require a JWT token in the `Authorization` header:
```
Authorization: Bearer <token>
```

### Register User
```
POST /api/auth/register
```

**Request Body:**
```json
{
  "name": "John Doe",
  "username": "johndoe",
  "email": "john@example.com",
  "password": "Password@123",
  "phone": 1234567890,
  "role": "STUDENT"
}
```

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one digit
- At least one special character (@$!%*?&#)

**Roles:** `STUDENT` (default), `TEACHER`  
> ⚠️ Note: `ADMIN` role cannot be created through registration

**Response (201 Created):**
```json
{
  "token": "eyJhbGciOiJIUzM4NCJ9...",
  "type": "Bearer",
  "user": {
    "id": 1,
    "name": "John Doe",
    "username": "johndoe",
    "email": "john@example.com",
    "phone": 1234567890,
    "role": "STUDENT"
  },
  "message": "Registration successful"
}
```

---

### Login
```
POST /api/auth/login
```

**Request Body:**
```json
{
  "username": "johndoe",
  "password": "Password@123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzM4NCJ9...",
  "type": "Bearer",
  "user": {
    "id": 1,
    "name": "John Doe",
    "username": "johndoe",
    "email": "john@example.com",
    "phone": 1234567890,
    "role": "STUDENT"
  },
  "message": "Login successful"
}
```

**Security Features:**
- Account lockout after 5 failed attempts (30 minutes)
- Provides remaining attempts on failure

---

### Forgot Password
```
POST /api/auth/forgot-password
```

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "message": "If the email exists, a password reset link has been sent."
}
```

> 🔒 **Security:** The response is intentionally vague to prevent email enumeration. The reset token is logged server-side only and is never exposed in the HTTP response.

---

### Reset Password
```
POST /api/auth/reset-password
```

**Request Body:**
```json
{
  "token": "abc123xyz",
  "newPassword": "NewPassword@123"
}
```

**Response:**
```json
{
  "message": "Password reset successful"
}
```

---

##Quizzes

### Get Quizzes (Paginated)
```
GET /api/quizzes?page=0&size=10&search=java&category=Programming
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | Integer | 0 | Page number (0-indexed) |
| `size` | Integer | 10 | Items per page |
| `search` | String | null | Search by title |
| `category` | String | null | Filter by category |

**Response:** Returns `QuizSummaryDTO` (lightweight, no questions)
```json
{
  "content": [
    {
      "id": 1,
      "title": "Java Basics",
      "description": "Test your Java knowledge",
      "category": "Programming",
      "status": "PUBLISHED",
      "creatorUsername": "teacher1",
      "questionCount": 10,
      "totalMarks": 50,
      "shareCode": "ABC12345"
    }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 10
  },
  "totalElements": 1,
  "totalPages": 1
}
```

> 📝 **Note:** List endpoints return `QuizSummaryDTO` without questions for performance optimization. Use individual quiz endpoints to get full question details.

---

### Get Quiz by ID
```
GET /api/quizzes/{id}
```

> ⚠️ **Availability check:** Quiz must be published and within its time window (if `startTime`/`endTime` are set). Returns `400 Bad Request` if the quiz is not currently available.

**Response:** Full `QuizDTO` with questions array (see [QuizDTO model](#quizdto-detail-endpoints))

---

### Get Quiz by Share Code (Public)
```
GET /api/quizzes/share/{shareCode}
```

**Alternative:**
```
GET /api/public/quizzes/share/{shareCode}
```

> 🌍 **No Authentication Required!** Users can preview quizzes without logging in. Login only required to submit.

**Response:** Full quiz object with `questions` array.

---

### Get Quiz Leaderboard
```
GET /api/quizzes/{id}/leaderboard
```

**Response:**
```json
[
  {
    "id": 1,
    "score": 90,
    "marksObtained": 45,
    "totalMarks": 50,
    "correctAnswers": 9,
    "totalQuestions": 10,
    "timeTakenSeconds": 300,
    "attemptedAt": "2026-02-09T10:30:00",
    "user": {
      "id": 1,
      "name": "John Doe",
      "username": "johndoe"
    }
  }
]
```

---

### Check If User Attempted Quiz 🔒
```
GET /api/quizzes/{id}/attempted
```

**Response:**
```json
{
  "attempted": true
}
```

---

### Submit Quiz 🔒
```
POST /api/quizzes/{id}/submit
```

**Request Body:**
```json
{
  "answers": {
    "1": "Language",
    "3": "TRUE"
  },
  "multiAnswers": {
    "2": ["Encapsulation", "Inheritance"]
  },
  "textAnswers": {
    "4": "The JVM consists of class loader, runtime data areas, and execution engine."
  },
  "timeTakenSeconds": 300
}
```

> **Multi-type submission:**
> - `answers` — Map of `questionId` → `selectedOption` (for MCQ and TRUE_FALSE questions)
> - `multiAnswers` — Map of `questionId` → `selectedOptions[]` (for MSQ questions)
> - `textAnswers` — Map of `questionId` → `textAnswer` (for DESCRIPTIVE questions)

**Response:**
```json
{
  "quizId": 1,
  "quizTitle": "Java Basics",
  "score": 80,
  "marksObtained": 40,
  "totalMarks": 50,
  "correctAnswers": 8,
  "totalQuestions": 10,
  "timeTakenSeconds": 300,
  "passed": true,
  "message": "Quiz completed successfully!"
}
```

> 📝 **Descriptive Questions:** When a quiz contains DESCRIPTIVE questions, the `passed` field may be `null` until all descriptive answers are evaluated by the teacher. The `message` will indicate "Results pending evaluation".
```

#### ⚠️ Attempt Constraints

The following rules apply to quiz submissions:

| Rule | Description | Error Code |
|------|-------------|------------|
| **Students Only** | Teachers and Admins cannot attempt quizzes | 403 |
| **Single Attempt** | Each student can attempt a quiz only ONCE | 403 |
| **Published Only** | Quiz must have status = `PUBLISHED` | 403 |
| **Not Closed** | Cannot submit after quiz is `CLOSED` | 403 |
| **Time Window** | Must be within start/end time (if set) | 403 |

**Example 403 Errors:**
```json
{
  "timestamp": "2026-02-09T10:30:00",
  "status": 403,
  "error": "Forbidden",
  "message": "You have already attempted this quiz"
}
```

---

### Get My Quizzes 🔒 (Teacher/Admin)
```
GET /api/quizzes/my
```

**Response:** Array of all quizzes created by the authenticated teacher

---

### Create Quiz 🔒 (Teacher/Admin)
```
POST /api/quizzes
```

> 🔒 **Security:** Uses `CreateQuizRequest` DTO — clients cannot set `id`, `createdBy`, `status`, or `shareCode`. These are controlled server-side.

**Request Body (`CreateQuizRequest`):**
```json
{
  "title": "Java Advanced",
  "description": "Advanced Java concepts",
  "category": "Programming",
  "difficulty": "HARD",
  "tags": "java,oop,advanced",
  "timeLimitMinutes": 30,
  "negativeMarking": false,
  "shuffleQuestions": true,
  "shuffleOptions": true,
  "passPercentage": 60,
  "startTime": "2026-02-10T10:00:00",
  "endTime": "2026-02-10T12:00:00",
  "questions": [
    {
      "text": "What is polymorphism?",
      "questionType": "MCQ",
      "options": ["Many forms", "Single form", "No form", "All forms"],
      "correctOption": "Many forms",
      "marks": 10
    },
    {
      "text": "Which are OOP principles? (select all)",
      "questionType": "MSQ",
      "options": ["Encapsulation", "Recursion", "Inheritance", "Polymorphism"],
      "correctOptions": ["Encapsulation", "Inheritance", "Polymorphism"],
      "marks": 15
    },
    {
      "text": "Java is a compiled language.",
      "questionType": "TRUE_FALSE",
      "correctOption": "TRUE",
      "marks": 5
    },
    {
      "text": "Explain the SOLID principles.",
      "questionType": "DESCRIPTIVE",
      "modelAnswer": "SOLID stands for...",
      "keywords": "single responsibility,open closed,liskov,interface segregation,dependency inversion",
      "marks": 20
    }
  ]
}
```

#### Request Fields

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `title` | String | ✅ | `@NotBlank`, max 255 chars | Quiz title |
| `description` | String | No | max 2000 chars | Quiz description |
| `category` | String | No | — | Quiz category |
| `difficulty` | String | No | max 10 chars | `EASY`, `MEDIUM`, or `HARD` |
| `tags` | String | No | max 500 chars | Comma-separated tags |
| `timeLimitMinutes` | Integer | No | min 1 | Time limit in minutes (null = no limit) |
| `negativeMarking` | Boolean | No | — | Penalty for wrong answers (default: false) |
| `shuffleQuestions` | Boolean | No | — | Randomize question order (default: false) |
| `shuffleOptions` | Boolean | No | — | Randomize answer options (default: false) |
| `passPercentage` | Integer | No | 0–100 | Min % to pass (null = no threshold) |
| `startTime` | DateTime | No | — | When quiz becomes available |
| `endTime` | DateTime | No | — | When quiz closes |
| `questions` | Array | No | `@Valid` | List of question objects |

#### Question Fields (`QuestionRequest`)

| Field | Type | Required | Validation | Used By |
|-------|------|----------|------------|----------|
| `text` | String | ✅ | `@NotBlank` | All types |
| `questionType` | String | No | — | MCQ (default), MSQ, TRUE_FALSE, DESCRIPTIVE |
| `options` | List\<String\> | No | — | MCQ, MSQ |
| `correctOption` | String | No | — | MCQ, TRUE_FALSE |
| `correctOptions` | List\<String\> | No | — | MSQ |
| `modelAnswer` | String | No | — | DESCRIPTIVE |
| `keywords` | String | No | max 1000 chars | DESCRIPTIVE (comma-separated) |
| `marks` | Integer | No | min 1 | All types (default: 1) |

**Response (201 Created):** Full quiz object with generated ID, `status: DRAFT`, and `shareCode: null`

---

### Update Quiz 🔒 (Teacher/Admin)
```
PUT /api/quizzes/{id}
```

**Request Body:** Same `CreateQuizRequest` structure as create quiz.

> ⚠️ Teachers can only update their own quizzes. Admins can update any quiz.
> 
> 🔒 Fields `id`, `createdBy`, `status`, and `shareCode` cannot be modified through this endpoint.

---

### Delete Quiz 🔒 (Teacher/Admin)
```
DELETE /api/quizzes/{id}
```

**Response:** 204 No Content

---

### Publish Quiz 🔒 (Teacher/Admin)
```
POST /api/quizzes/{id}/publish
```

Changes quiz status from `DRAFT` to `PUBLISHED` and generates a share code.

**Response:**
```json
{
  "quizId": 1,
  "title": "Java Basics",
  "shareCode": "ABC12345",
  "shareUrl": "/api/quizzes/share/ABC12345"
}
```

---

### Close Quiz 🔒 (Teacher/Admin)
```
POST /api/quizzes/{id}/close
```

Changes quiz status to `CLOSED`. No more submissions will be accepted.

**Response:** Updated quiz object with `status: "CLOSED"`

---

### Get Quiz Students/Attempts 🔒 (Teacher/Admin)
```
GET /api/quizzes/{id}/students?sort=score_desc
```

**Query Parameters:**

| Parameter | Values | Default | Description |
|-----------|--------|---------|-------------|
| `sort` | `score_desc`, `score_asc`, `time_asc`, `attemptedAt_desc` | `score_desc` | Sort order |

**Sort Options:**
- `score_desc` - Highest scores first (leaderboard style)
- `score_asc` - Lowest scores first (students needing help)
- `time_asc` - Fastest completions first
- `attemptedAt_desc` - Most recent attempts first

**Response:** Array of quiz attempt objects with user info.

---

### Get Pending Evaluations 🔒 (Teacher/Admin)
```
GET /api/quizzes/{id}/pending-evaluations
```

Returns all quiz attempts containing DESCRIPTIVE questions that have not yet been evaluated.

**Response:** Array of attempt objects with answers that need evaluation. Each answer includes `id`, `questionText`, `textAnswer`, `evaluationStatus`.

---

### Evaluate Answer 🔒 (Teacher/Admin)
```
PUT /api/quizzes/answers/{answerId}/evaluate
```

**Request Body:**
```json
{
  "marks": 15,
  "comment": "Good explanation but missed key points"
}
```

> 📝 **Note:** The `answerId` is the `id` field from the `AnswerDTO` object. `marks` must be between 0 and the question's `maxMarks`.

**Response:** Updated answer object with evaluation details.

---

### Export Quiz 🔒 (Teacher/Admin)
```
GET /api/quizzes/{id}/export
```

**Response:** JSON file download (blob) containing the full quiz with questions.

---

### Export Attempts 🔒 (Teacher/Admin)
```
GET /api/quizzes/{id}/attempts/export
```

**Response:** CSV file download (blob) with columns:
```
Student Name, Student Email, Marks Obtained, Total Marks, Percentage, Submitted At, Time Taken (minutes)
```

> 🔒 **Security:** CSV values are protected against formula injection attacks.

---

## Profile 🔒

All profile endpoints require authentication.

### Get Profile
```
GET /api/profile
```

**Response:**
```json
{
  "id": 1,
  "name": "John Doe",
  "username": "johndoe",
  "email": "john@example.com",
  "phone": 1234567890,
  "role": "STUDENT"
}
```

---

### Update Profile
```
PUT /api/profile
```

**Request Body:**
```json
{
  "name": "John Updated",
  "email": "johnupdated@example.com",
  "phone": 9876543210
}
```

**Response:** Updated user object

---

### Change Password
```
POST /api/profile/change-password
```

**Request Body:**
```json
{
  "currentPassword": "OldPassword@123",
  "newPassword": "NewPassword@123"
}
```

**Response:**
```json
{
  "message": "Password changed successfully"
}
```

---

### Get My Attempts
```
GET /api/profile/attempts
```

**Response:** Array of all quiz attempts by the authenticated user

---

### Get My Attempts (Paginated)
```
GET /api/profile/attempts/paginated?page=0&size=10
```

**Query Parameters:**
| Parameter | Type | Default |
|-----------|------|---------|
| `page` | Integer | 0 |
| `size` | Integer | 10 |

**Response:** Paginated quiz attempts

---

## Dashboard (Teacher/Admin)

### Get Dashboard Stats 🔒
```
GET /api/dashboard/stats
```

**Response:**
```json
{
  "totalQuizzes": 10,
  "totalPublished": 7,
  "totalDrafts": 3,
  "totalAttempts": 150,
  "averageScore": 78.5,
  "totalStudents": 25
}
```

---

### Get My Quizzes with Stats 🔒
```
GET /api/dashboard/quizzes?page=0&size=10
```

**Response:** Paginated quizzes with attempt statistics

---

### Get Quiz Statistics 🔒
```
GET /api/dashboard/quizzes/{id}/stats
```

> 🔒 **Ownership check:** Teachers can only view statistics for their own quizzes. Admins can view stats for any quiz.

**Response:**
```json
{
  "quizId": 1,
  "quizTitle": "Java Basics",
  "totalAttempts": 30,
  "averageScore": 75.5,
  "highestScore": 100,
  "lowestScore": 45,
  "averageTimeTaken": 450,
  "passRate": 80.0
}
```

---

### Get Recent Attempts 🔒
```
GET /api/dashboard/recent-attempts?limit=10
```

**Response:** Most recent quiz attempts across all teacher's quizzes

---

## Admin

All admin endpoints require `ADMIN` role.

### User Management

#### Get All Users 🔒
```
GET /api/admin/users?page=0&size=20
```

**Response:** Paginated users with admin details

---

#### Get Users by Role 🔒
```
GET /api/admin/users/role/{role}?page=0&size=20
```

**Roles:** `STUDENT`, `TEACHER`, `ADMIN`

---

#### Get User by ID 🔒
```
GET /api/admin/users/{id}
```

---

#### Update User Role 🔒
```
PUT /api/admin/users/{id}/role
```

**Request Body:**
```json
{
  "role": "TEACHER"
}
```

---

#### Delete User 🔒
```
DELETE /api/admin/users/{id}
```

**Response:** 204 No Content

> ⚠️ **Self-deletion prevention:** Admins cannot delete their own account. Attempting to do so returns a 400 error.

---

### Quiz Management

#### Get All Quizzes 🔒
```
GET /api/admin/quizzes?page=0&size=20
```

**Response:** Paginated all quizzes (all users, all statuses)

---

#### Delete Quiz 🔒
```
DELETE /api/admin/quizzes/{id}
```

---

### System Statistics

#### Get System Stats 🔒
```
GET /api/admin/stats
```

**Response:**
```json
{
  "totalUsers": 100,
  "totalStudents": 80,
  "totalTeachers": 18,
  "totalAdmins": 2,
  "totalQuizzes": 50,
  "totalDrafts": 10,
  "totalPublished": 35,
  "totalClosed": 5,
  "totalAttempts": 500,
  "averageScore": 75.5
}
```

---

### Attempt Management

#### Get All Attempts 🔒
```
GET /api/admin/attempts?page=0&size=20
```

**Response:** Paginated all quiz attempts system-wide

---

#### Get Attempt by ID 🔒
```
GET /api/admin/attempts/{id}
```

**Response:** Detailed attempt with answers

---

## Health Check

### Basic Health Check
```
GET /api/health
```

**Response:**
```json
{
  "status": "UP",
  "timestamp": "2026-02-09T10:30:00",
  "service": "Java Quiz Server"
}
```

---

### Detailed Health Check
```
GET /api/health/detailed
```

**Response:**
```json
{
  "status": "UP",
  "timestamp": "2026-02-09T10:30:00",
  "components": {
    "database": "UP",
    "authentication": "UP",
    "quizService": "UP"
  },
  "info": {
    "version": "1.0.0",
    "environment": "development"
  }
}
```

---

## Data Models

### QuizStatus Enum
- `DRAFT` - Quiz is being created/edited
- `PUBLISHED` - Quiz is live and accepting submissions
- `CLOSED` - Quiz is closed, no more submissions

### Role Enum
- `STUDENT` - Can attempt quizzes
- `TEACHER` - Can create and manage quizzes
- `ADMIN` - Full system access

### QuizSummaryDTO (List Endpoints)
Lightweight DTO returned for quiz lists (no questions):
```json
{
  "id": 1,
  "title": "Java Basics",
  "description": "Test your Java knowledge",
  "category": "Programming",
  "status": "PUBLISHED",
  "creatorUsername": "teacher1",
  "questionCount": 10,
  "totalMarks": 50,
  "shareCode": "ABC12345"
}
```

### QuizDTO (Detail Endpoints)
Full DTO with questions array:
```json
{
  "id": 1,
  "title": "Java Basics",
  "description": "Test your Java knowledge",
  "username": "teacher1",
  "category": "Programming",
  "difficulty": "MEDIUM",
  "tags": "java,basics,programming",
  "shareCode": "ABC12345",
  "timeLimitMinutes": 30,
  "passPercentage": 60,
  "negativeMarking": false,
  "shuffleQuestions": true,
  "shuffleOptions": true,
  "startTime": "2026-02-10T10:00:00",
  "endTime": "2026-02-10T12:00:00",
  "totalMarks": 50,
  "questions": [
    {
      "id": 1,
      "text": "What is Java?",
      "questionType": "MCQ",
      "options": ["Language", "Framework", "Database", "OS"],
      "correctOption": "Language",
      "marks": 5
    },
    {
      "id": 2,
      "text": "Select all OOP concepts",
      "questionType": "MSQ",
      "options": ["Encapsulation", "Recursion", "Inheritance"],
      "correctOptions": ["Encapsulation", "Inheritance"],
      "marks": 10
    },
    {
      "id": 3,
      "text": "Java is platform-independent.",
      "questionType": "TRUE_FALSE",
      "correctOption": "TRUE",
      "marks": 5
    },
    {
      "id": 4,
      "text": "Explain JVM architecture.",
      "questionType": "DESCRIPTIVE",
      "modelAnswer": "The JVM consists of...",
      "marks": 20
    }
  ]
}
```

> 📝 **Question Types:** Questions can be `MCQ` (single-choice), `MSQ` (multi-select), `TRUE_FALSE`, or `DESCRIPTIVE` (free-text, requires manual evaluation).

---

## Error Handling

### Standard Error Response
```json
{
  "timestamp": "2026-02-09T10:30:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Username already exists",
  "path": "/api/auth/register"
}
```

### HTTP Status Codes

| Code | Meaning | Common Scenarios |
|------|---------|------------------|
| 200 | OK | Successful GET, PUT requests |
| 201 | Created | Successful POST (create) |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Validation errors, duplicate username/email |
| 401 | Unauthorized | Invalid/missing JWT token |
| 403 | Forbidden | Insufficient permissions, quiz constraints |
| 404 | Not Found | Resource doesn't exist |
| 423 | Locked | Account locked (too many failed logins) |
| 500 | Server Error | Unexpected server errors |

### Common Error Scenarios

**401 Unauthorized:**
```json
{
  "status": 401,
  "error": "Unauthorized",
  "message": "Invalid username or password"
}
```

**403 Forbidden:**
```json
{
  "status": 403,
  "error": "ACCESS_DENIED",
  "message": "You do not have permission to perform this action"
}
```
```

**423 Locked (Account Lockout):**
```json
{
  "status": 423,
  "error": "Locked",
  "message": "Account locked due to too many failed login attempts. Try again in 25 minutes."
}
```

---

## Notes

- **Authentication:** Most endpoints require JWT token except `/api/auth/**`, `/api/health/**`, `/api/public/**`, and public GET routes (`/api/quizzes`, `/api/quizzes/{id}`, `/api/quizzes/share/**`, `/api/quizzes/{id}/leaderboard`)
- **Security Rule Ordering:** Teacher/admin-restricted GET routes (`/my`, `/students`, `/pending-evaluations`, `/export`) are matched BEFORE the public `GET /api/quizzes/**` permitAll routes
- **Pagination:** Default page size is 10–20 depending on endpoint
- **Quiz Visibility:** Students only see `PUBLISHED` quizzes within time window. Unpublished/expired quizzes return 400
- **Performance:** Quiz list endpoints use lightweight `QuizSummaryDTO` without questions. Individual quiz fetch uses `@EntityGraph` for eager loading
- **Security:** Rate limiting on auth endpoints, account lockout after 5 failed login attempts, JWT secret validated at startup (minimum 256-bit key)
- **Question Types:** `MCQ` (single-choice), `MSQ` (multi-select), `TRUE_FALSE`, `DESCRIPTIVE` (requires manual teacher evaluation)
- **CSV Export:** Columns are `Student Name, Student Email, Marks Obtained, Total Marks, Percentage, Submitted At, Time Taken (minutes)`. Values are protected against CSV formula injection
- **IDOR Protection:** Dashboard quiz stats enforce ownership check. Admin self-deletion is prevented
- **Memory Management:** Rate limiter auto-cleans stale entries every 100 requests

---

**Version:** 2.0.0  
**Last Updated:** February 13, 2026
