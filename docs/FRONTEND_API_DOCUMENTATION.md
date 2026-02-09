# Quiz Application - Frontend API Documentation

**Base URL:** `http://localhost:8080`  
**Content-Type:** `application/json`

---

## Table of Contents

1. [Authentication](#authentication)
2. [Quizzes](#quizzes)
3. [Profile](#profile)
4. [Dashboard (Teacher)](#dashboard-teacher)
5. [Admin](#admin)
6. [Data Models](#data-models)
7. [Error Handling](#error-handling)

---

## Authentication

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
  "message": "Login successful"
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

> **Note:** Store the token and include it in all authenticated requests as: `Authorization: Bearer <token>`

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
  "message": "Password reset token generated...",
  "token": "abc123..."
}
```

---

### Reset Password
```
POST /api/auth/reset-password
```

**Request Body:**
```json
{
  "token": "abc123...",
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

## Quizzes

> All quiz endpoints require authentication unless marked as public.

### Get All Quizzes (Paginated)
```
GET /api/quizzes?page=0&size=10&search=java&category=Programming
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | int | No | Page number (default: 0) |
| size | int | No | Items per page (default: 10) |
| search | string | No | Search by title |
| category | string | No | Filter by category |

**Response:**
```json
{
  "content": [
    {
      "id": 1,
      "title": "Java Basics",
      "description": "Introduction to Java",
      "category": "Programming",
      "status": "PUBLISHED",
      "totalMarks": 50,
      "questionCount": 10,
      "shareCode": "ABC12345",
      "questions": [
        {
          "id": 1,
          "text": "What is Java?",
          "optionA": "A programming language",
          "optionB": "A coffee brand",
          "optionC": "An island",
          "optionD": "None",
          "marks": 5
        }
      ]
    }
  ],
  "totalPages": 5,
  "totalElements": 50,
  "number": 0,
  "size": 10
}
```

> **Note:** Correct answers are NOT included in student-facing responses.

---

### Get Quiz by ID
```
GET /api/quizzes/{id}
```

**Response:** Same as quiz object above.

---

### Get Quiz by Share Code
```
GET /api/quizzes/share/{shareCode}
```

**Response:** Same as quiz object above.

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
    "1": "A",
    "2": "B",
    "3": "C"
  },
  "timeTakenSeconds": 300
}
```

> `answers` is a map of `questionId` → `selectedOption` (A/B/C/D)

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

---

## Teacher Quiz Management 🔒 (TEACHER only)

### Get My Quizzes
```
GET /api/quizzes/my
```

**Response:** Array of quiz objects.

---

### Create Quiz
```
POST /api/quizzes
```

**Request Body:**
```json
{
  "title": "Java Advanced",
  "description": "Advanced Java concepts",
  "category": "Programming",
  "totalMarks": 100,
  "questions": [
    {
      "text": "What is polymorphism?",
      "optionA": "Many forms",
      "optionB": "Single form",
      "optionC": "No form",
      "optionD": "All forms",
      "correctAnswer": "A",
      "marks": 10
    }
  ]
}
```

**Response (201 Created):** Full quiz object with generated ID.

---

### Update Quiz
```
PUT /api/quizzes/{id}
```

**Request Body:** Same as create quiz.

---

### Delete Quiz
```
DELETE /api/quizzes/{id}
```

**Response:** 204 No Content

---

### Publish Quiz
```
POST /api/quizzes/{id}/publish
```

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

### Close Quiz
```
POST /api/quizzes/{id}/close
```

**Response:** Updated quiz object with `status: "CLOSED"`.

---

### Get Quiz Students/Attempts
```
GET /api/quizzes/{id}/students
```

**Response:** Array of quiz attempt objects with user info.

---

## Profile 🔒

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
  "name": "John Smith",
  "email": "john.smith@example.com",
  "phone": 9876543210
}
```

---

### Change Password
```
POST /api/profile/change-password
```

**Request Body:**
```json
{
  "currentPassword": "OldPassword@123",
  "newPassword": "NewPassword@456"
}
```

**Response:**
```json
{
  "message": "Password changed successfully"
}
```

---

### Get My Quiz Attempts
```
GET /api/profile/attempts
```

**Paginated:**
```
GET /api/profile/attempts/paginated?page=0&size=10
```

---

## Dashboard (Teacher) 🔒

### Get Dashboard Stats
```
GET /api/dashboard/stats
```

**Response:**
```json
{
  "totalQuizzes": 15,
  "publishedQuizzes": 10,
  "draftQuizzes": 3,
  "closedQuizzes": 2,
  "totalAttempts": 150,
  "averageScore": 75.5
}
```

---

### Get Quizzes with Statistics
```
GET /api/dashboard/quizzes?page=0&size=10
```

**Response:**
```json
{
  "content": [
    {
      "id": 1,
      "title": "Java Basics",
      "description": "Introduction",
      "category": "Programming",
      "status": "PUBLISHED",
      "shareCode": "ABC12345",
      "questionCount": 10,
      "totalMarks": 50,
      "attemptCount": 25,
      "averageScore": 72.5
    }
  ],
  "totalPages": 2,
  "totalElements": 15
}
```

---

### Get Single Quiz Stats
```
GET /api/dashboard/quizzes/{id}/stats
```

---

### Get Recent Attempts
```
GET /api/dashboard/recent-attempts?limit=10
```

---

## Admin 🔒 (ADMIN only)

### Get All Users
```
GET /api/admin/users?page=0&size=20
```

### Get Users by Role
```
GET /api/admin/users/role/{ADMIN|TEACHER|STUDENT}
```

### Get User by ID
```
GET /api/admin/users/{id}
```

### Update User Role
```
PUT /api/admin/users/{id}/role
```

**Request Body:**
```json
{
  "role": "TEACHER"
}
```

### Delete User
```
DELETE /api/admin/users/{id}
```

### Get All Quizzes (Admin)
```
GET /api/admin/quizzes?page=0&size=20
```

### Delete Quiz (Admin)
```
DELETE /api/admin/quizzes/{id}
```

### Get System Stats
```
GET /api/admin/stats
```

**Response:**
```json
{
  "totalUsers": 100,
  "totalAdmins": 2,
  "totalTeachers": 15,
  "totalStudents": 83,
  "totalQuizzes": 50,
  "publishedQuizzes": 40,
  "draftQuizzes": 5,
  "closedQuizzes": 5,
  "totalAttempts": 500
}
```

### Get All Attempts
```
GET /api/admin/attempts?page=0&size=20
```

### Get Attempt by ID
```
GET /api/admin/attempts/{id}
```

---

## Data Models

### User Roles
```typescript
type Role = "ADMIN" | "TEACHER" | "STUDENT";
```

### Quiz Status
```typescript
type QuizStatus = "DRAFT" | "PUBLISHED" | "CLOSED";
```

### Answer Options
```typescript
type AnswerOption = "A" | "B" | "C" | "D";
```

---

## Error Handling

All errors follow this format:

```json
{
  "timestamp": "2026-02-09T10:30:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Username already exists",
  "path": "/api/auth/register"
}
```

### Common HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 204 | No Content (successful delete) |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (no/invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 409 | Conflict (duplicate resource) |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error |

---

## Using the Token in Requests

After login/register, store the JWT token and include it in all authenticated requests:

```javascript
// JavaScript/TypeScript example
const response = await fetch('/api/profile', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

```javascript
// Axios example
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
```

---

## CORS

The API allows requests from:
- `http://localhost:3000`
- `http://127.0.0.1:3000`

For production, configure `CORS_ALLOWED_ORIGINS` environment variable.

---

## Rate Limiting

Authentication endpoints (`/api/auth/*`) are rate-limited.
After 5 failed login attempts, account is temporarily locked.
