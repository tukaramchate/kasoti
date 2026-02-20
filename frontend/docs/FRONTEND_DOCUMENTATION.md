# Kasoti — Frontend Documentation

> **Version:** 0.2.0  
> **Stack:** React 18 · React Router 6 · Axios · Tailwind CSS 3 · react-toastify · react-icons  
> **Build Tool:** Create React App (`react-scripts 5.0.1`)  
> **Proxy:** `http://localhost:8080` (Spring Boot backend)

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Project Structure](#2-project-structure)
3. [Getting Started](#3-getting-started)
4. [Theming System](#4-theming-system)
5. [Authentication & Authorization](#5-authentication--authorization)
6. [API Layer](#6-api-layer)
7. [Routing](#7-routing)
8. [Pages](#8-pages)
9. [Reusable Components](#9-reusable-components)
10. [State Management](#10-state-management)
11. [Styling Guide](#11-styling-guide)
12. [Environment Variables](#12-environment-variables)

---

## 1. Architecture Overview

```
index.js
  └─ ThemeProvider          (dark/light mode)
      └─ UserProvider       (auth state + JWT)
          └─ App.js         (React Router)
              ├─ Landing    (public)
              ├─ Login / Register (guest-only)
              ├─ Home       (authenticated)
              ├─ QuizData   (quiz taking)
              ├─ AddQuiz / EditQuiz (teacher)
              ├─ QuizStudents / Dashboard (teacher)
              ├─ Profile / Leaderboard (authenticated)
              ├─ ShareQuiz  (public, share code)
              ├─ Admin      (admin-only)
              └─ NotFound   (catch-all)
```

**Data flow:** Pages → `api/index.js` (Axios) → Spring Boot REST API → PostgreSQL

**Key patterns:**
- All pages are **lazy-loaded** via `React.lazy()` + `<Suspense>`
- Auth token stored in `localStorage` as `{ token, user }`, auto-injected via Axios interceptor
- 401 responses trigger `auth:expired` event → `UserContext` clears state → redirect to `/login`
- Theming via CSS custom properties on `:root` / `[data-theme="dark"]`, toggled by `ThemeContext`

---

## 2. Project Structure

```
frontend/
├── public/
│   ├── index.html              # SPA shell
│   └── assets/                 # Static images
├── src/
│   ├── index.js                # React root (ThemeProvider → UserProvider → App)
│   ├── App.js                  # Router + all routes
│   ├── api/
│   │   └── index.js            # Axios instance + all API modules
│   ├── components/
│   │   ├── ConfirmDialog.js    # Modal confirmation dialog
│   │   ├── LoadingSpinner.js   # Centered spinner
│   │   ├── PageHeader.js       # Back button + title
│   │   ├── PasswordInput.js    # Password with show/hide toggle
│   │   ├── QuizCard.js         # Quiz display card (189 lines)
│   │   ├── QuizForm.js         # Quiz create/edit form (287 lines)
│   │   ├── QuizSkeleton.js     # Loading skeleton for quiz cards
│   │   ├── RouteGuards.js      # ProtectedRoute, RoleGuard, GuestRoute
│   │   └── StatsCard.js        # Simple stat card
│   ├── context/
│   │   ├── ThemeContext.js      # Dark/light theme provider
│   │   └── UserContext.js       # Auth state provider
│   ├── pages/
│   │   ├── AddQuiz/            # Create quiz (teacher)
│   │   ├── Admin/              # Admin panel (598 lines)
│   │   ├── Dashboard/          # Teacher analytics
│   │   ├── EditQuiz/           # Edit quiz (teacher)
│   │   ├── Home/               # Main quiz browser
│   │   ├── Landing/            # Marketing landing page
│   │   ├── Leaderboard/        # Quiz leaderboard
│   │   ├── Login/              # Login + forgot/reset password
│   │   ├── NotFound/           # 404 page
│   │   ├── Profile/            # User profile + history
│   │   ├── QuizData/           # Quiz-taking page (303 lines)
│   │   ├── QuizStudents/       # Student attempts viewer
│   │   ├── Register/           # User registration
│   │   └── ShareQuiz/          # Public quiz preview via share code
│   └── styles/
│       └── index.css           # Tailwind imports + CSS variables + components
├── package.json
├── tailwind.config.js          # Extended Tailwind config
└── postcss.config.js           # PostCSS for Tailwind
```

---

## 3. Getting Started

### Prerequisites
- Node.js 16+
- Backend running on `http://localhost:8080`

### Install & Run
```bash
cd frontend
npm install
npm start          # Starts on http://localhost:3000
```

### Build for Production
```bash
npm run build      # Outputs to frontend/build/
```

The production build is a static SPA. Serve it from any web server and point API calls to the backend. The `proxy` field in `package.json` only applies during development.

---

## 4. Theming System

### How It Works

Theme state is managed by `ThemeContext` and persisted in `localStorage` under the key `"theme"`.

```
ThemeProvider
  ├─ State: darkMode (boolean)
  ├─ Effect: sets data-theme="dark"|"light" on <html>
  ├─ Persists: localStorage.setItem("theme", ...)
  └─ Exposes: { darkMode, toggleTheme }
```

### CSS Variables

All colors are defined as CSS custom properties on `:root` (light) and `[data-theme="dark"]` (dark):

| Variable | Light | Dark | Usage |
|----------|-------|------|-------|
| `--bg-primary` | `#f8f9fb` | `#0f1117` | Page background |
| `--bg-secondary` | `#ffffff` | `#1a1d27` | Section backgrounds |
| `--bg-card` | `#ffffff` | `#1e2130` | Card backgrounds |
| `--bg-hover` | `#f1f3f5` | `#252838` | Hover states |
| `--bg-input` | `#f8f9fb` | `#1a1d27` | Input backgrounds |
| `--text-primary` | `#111827` | `#f1f3f5` | Headings, main text |
| `--text-secondary` | `#6b7280` | `#9ca3af` | Body text |
| `--text-muted` | `#9ca3af` | `#6b7280` | Hints, metadata |
| `--border` | `#e5e7eb` | `#2d3142` | Card borders |
| `--border-light` | `#f3f4f6` | `#252838` | Subtle dividers |
| `--accent` | `#6366f1` | `#818cf8` | Primary accent (indigo) |
| `--accent-hover` | `#4f46e5` | `#6366f1` | Accent hover |
| `--accent-light` | `#eef2ff` | `#1e1b4b` | Accent background |
| `--accent-subtle` | `#c7d2fe` | `#3730a3` | Accent subtle |
| `--success` | `#10b981` | `#10b981` | Green (pass) |
| `--warning` | `#f59e0b` | `#f59e0b` | Yellow (caution) |
| `--danger` | `#ef4444` | `#ef4444` | Red (errors, delete) |

### Using Theme in Components

```jsx
// Access theme context
import { useTheme } from '../context/ThemeContext';

const MyComponent = () => {
  const { darkMode, toggleTheme } = useTheme();
  return <button onClick={toggleTheme}>{darkMode ? '☀️' : '🌙'}</button>;
};
```

### Inline Styling with Variables

The codebase uses Tailwind's `[color:var(--name)]` syntax:

```jsx
<div className="bg-[color:var(--bg-card)] text-[color:var(--text-primary)] border-[color:var(--border)]">
```

---

## 5. Authentication & Authorization

### Auth Flow

```
Login/Register → API returns { token, user } → stored in UserContext + localStorage
                                                  ↓
Every API call → Axios interceptor reads token → injects Authorization: Bearer <token>
                                                  ↓
On 401 → interceptor fires auth:expired event → UserContext clears state → redirect to /login
```

### UserContext (`context/UserContext.js`)

**Provider:** `<UserProvider>` wraps the entire app.

**Exported hook:** `useAuth()` → `{ user, setUser, logout }`

| Field | Type | Description |
|-------|------|-------------|
| `user` | `object \| null` | `{ token: string, user: { id, username, name, email, role, is_teacher } }` |
| `setUser(obj)` | `function` | Sets user state + persists to localStorage |
| `logout()` | `function` | Clears state + localStorage |

### Route Guards (`components/RouteGuards.js`)

| Guard | Purpose | Redirect |
|-------|---------|----------|
| `<ProtectedRoute>` | Requires authenticated user | → `/login` (preserves location) |
| `<GuestRoute>` | Only for unauthenticated users | → `/home` |
| `<RoleGuard roles={["TEACHER","ADMIN"]}>` | Role-based access | → `/home` |

**Role resolution in `RoleGuard`:**
- `"ADMIN"` → checks `user.user.role === "ADMIN"`
- `"TEACHER"` → checks `user.user.role === "TEACHER"` OR `user.user.is_teacher === true`

### Roles

| Role | Access |
|------|--------|
| `STUDENT` | Home, QuizData, Profile, Leaderboard, ShareQuiz |
| `TEACHER` | All student routes + AddQuiz, EditQuiz, QuizStudents, Dashboard |
| `ADMIN` | All teacher routes + Admin panel |

---

## 6. API Layer

### Axios Configuration (`api/index.js`)

- **Base URL:** `process.env.REACT_APP_API_URL || 'http://localhost:8080'`
- **Request Interceptor:** Reads `localStorage.user → token` → sets `Authorization: Bearer <token>`
- **Response Interceptor:** On 401 → removes user from localStorage → fires `auth:expired` window event

### API Modules

#### `authAPI` — Authentication

| Method | Endpoint | Params |
|--------|----------|--------|
| `login(username, password)` | `POST /api/auth/login` | `{ username, password }` |
| `register(userData)` | `POST /api/auth/register` | `{ fullName, username, email, phone, password, role }` |
| `forgotPassword(email)` | `POST /api/auth/forgot-password` | `{ email }` — Response: generic "If the email exists..." message (token not exposed) |
| `resetPassword(token, newPassword)` | `POST /api/auth/reset-password` | `{ token, newPassword }` |

#### `quizAPI` — Quiz Operations

| Method | Endpoint | Params |
|--------|----------|--------|
| `getAllQuizzes(page, size, search, category, difficulty, tags)` | `GET /api/quizzes` | Query params |
| `getQuizById(id)` | `GET /api/quizzes/:id` | — |
| `getMyQuizzes()` | `GET /api/quizzes/my` | — |
| `createQuiz(quiz)` | `POST /api/quizzes` | `CreateQuizRequest` DTO (see API docs) |
| `updateQuiz(id, quiz)` | `PUT /api/quizzes/:id` | `CreateQuizRequest` DTO (see API docs) |
| `deleteQuiz(id)` | `DELETE /api/quizzes/:id` | — |
| `publishQuiz(id)` | `POST /api/quizzes/:id/publish` | — |
| `closeQuiz(id)` | `POST /api/quizzes/:id/close` | — |
| `submitQuiz(id, answers, timeTakenSeconds, multiAnswers?, textAnswers?)` | `POST /api/quizzes/:id/submit` | `{ answers, timeTakenSeconds, multiAnswers?, textAnswers? }` — supports MCQ, MSQ, TRUE_FALSE, DESCRIPTIVE |
| `hasAttempted(id)` | `GET /api/quizzes/:id/attempted` | — |
| `getLeaderboard(id)` | `GET /api/quizzes/:id/leaderboard` | — |
| `getQuizStudents(id, sort)` | `GET /api/quizzes/:id/students` | `?sort=score_desc` |
| `getByShareCode(shareCode)` | `GET /api/public/quizzes/share/:shareCode` | — |
| `getCategories()` | `GET /api/categories` | — |
| `getTags()` | `GET /api/categories/tags` | — |
| `exportQuiz(id)` | `GET /api/quizzes/:id/export` | blob response |
| `exportAttempts(id)` | `GET /api/quizzes/:id/attempts/export` | blob response |
| `getPendingEvaluations(id)` | `GET /api/quizzes/:id/pending-evaluations` | — |
| `evaluateAnswer(answerId, marks, comment)` | `PUT /api/quizzes/answers/:answerId/evaluate` | `{ marks, comment }` |

#### `profileAPI` — User Profile

| Method | Endpoint | Params |
|--------|----------|--------|
| `getProfile()` | `GET /api/profile` | — |
| `updateProfile(data)` | `PUT /api/profile` | `{ name, email, phone }` |
| `changePassword(currentPassword, newPassword)` | `POST /api/profile/change-password` | `{ currentPassword, newPassword }` |
| `getAttempts()` | `GET /api/profile/attempts` | — |
| `getAttemptsPaginated(page, size)` | `GET /api/profile/attempts/paginated` | `?page=&size=` |

#### `dashboardAPI` — Teacher Dashboard

| Method | Endpoint | Params |
|--------|----------|--------|
| `getStats()` | `GET /api/dashboard/stats` | — |
| `getQuizzes(page, size)` | `GET /api/dashboard/quizzes` | `?page=&size=` |
| `getQuizStats(id)` | `GET /api/dashboard/quizzes/:id/stats` | — (ownership enforced server-side) |
| `getRecentAttempts(limit)` | `GET /api/dashboard/recent-attempts` | `?limit=10` |

#### `adminAPI` — Admin Panel

| Method | Endpoint | Params |
|--------|----------|--------|
| `getUsers(page, size)` | `GET /api/admin/users` | `?page=&size=` |
| `getUsersByRole(role, page, size)` | `GET /api/admin/users/role/:role` | `?page=&size=` |
| `getUserById(id)` | `GET /api/admin/users/:id` | — |
| `updateUserRole(id, role)` | `PUT /api/admin/users/:id/role` | `{ role }` |
| `deleteUser(id)` | `DELETE /api/admin/users/:id` | — (self-deletion prevented server-side) |
| `getQuizzes(page, size)` | `GET /api/admin/quizzes` | `?page=&size=` |
| `deleteQuiz(id)` | `DELETE /api/admin/quizzes/:id` | — |
| `getStats()` | `GET /api/admin/stats` | — |
| `getAttempts(page, size)` | `GET /api/admin/attempts` | `?page=&size=` |
| `getAttemptById(id)` | `GET /api/admin/attempts/:id` | — |

---

## 7. Routing

All routes are defined in `App.js`. Pages are lazy-loaded.

| Route | Page | Guard | Role |
|-------|------|-------|------|
| `/` | Landing | — | Public |
| `/share/:shareCode` | ShareQuiz | — | Public |
| `/login` | Login | GuestRoute | Guest only |
| `/register` | Register | GuestRoute | Guest only |
| `/home` | Home | ProtectedRoute | Any authenticated |
| `/quiz/:id` | QuizData | ProtectedRoute | Any authenticated |
| `/profile` | Profile | ProtectedRoute | Any authenticated |
| `/leaderboard/:id` | Leaderboard | ProtectedRoute | Any authenticated |
| `/addQuiz` | AddQuiz | ProtectedRoute + RoleGuard | TEACHER, ADMIN |
| `/editQuiz/:id` | EditQuiz | ProtectedRoute + RoleGuard | TEACHER, ADMIN |
| `/quiz/:id/students` | QuizStudents | ProtectedRoute + RoleGuard | TEACHER, ADMIN |
| `/dashboard` | Dashboard | ProtectedRoute + RoleGuard | TEACHER, ADMIN |
| `/admin` | Admin | ProtectedRoute + RoleGuard | ADMIN |
| `*` | NotFound | — | Catch-all |

---

## 8. Pages

### 8.1 Landing (`/`)

**Purpose:** Marketing page for unauthenticated users. Auto-redirects to `/home` if logged in.

**Sections:** Navbar (theme toggle, Login/Register links) → Hero with CTA → Features grid (3 cards) → How It Works (3 steps) → CTA section → Footer

**API calls:** None

---

### 8.2 Login (`/login`)

**Purpose:** User authentication with 3 sub-flows:
1. **Login** — username + password → stores `{ token, user }` → `/home`
2. **Forgot Password** — email → sends reset link
3. **Reset Password** — token + new password → back to login

**API calls:** `authAPI.login`, `authAPI.forgotPassword`, `authAPI.resetPassword`

---

### 8.3 Register (`/register`)

**Purpose:** New user registration (always as STUDENT role).

**Fields:** Full name*, username*, email*, phone (optional), password* (min 8 chars)

**API calls:** `authAPI.register` → redirects to `/login`

---

### 8.4 Home (`/home`)

**Purpose:** Main authenticated hub — browse quizzes, search, filter, manage.

**Features:**
- Debounced search (400ms) with server-side pagination (12 per page)
- Category pill filters (fetched from API)
- Difficulty filter (All / Easy / Medium / Hard)
- Stats cards: total quizzes, categories count, teacher-specific (my quizzes, create link)
- Theme toggle + logout in nav

**API calls:** `quizAPI.getCategories`, `quizAPI.getAllQuizzes`, `quizAPI.getMyQuizzes`, `quizAPI.deleteQuiz`

**Role behavior:**
- **Teachers:** "My Quizzes" section, "+" create button, Dashboard nav link
- **Admins:** Dashboard + Admin nav links
- **Students:** "Learn & Explore" stat card

---

### 8.5 QuizData (`/quiz/:id`) — Quiz Taking

**Purpose:** Full quiz attempt experience with timer, navigation, results, and review.

**State:**
| Variable | Type | Purpose |
|----------|------|---------|
| `quizDetails` | object | Quiz data with questions |
| `selectedAnswers` | `{ qId: option }` | Current answer selections |
| `currentQuestionIndex` | number | Active question position |
| `timeLeft` | seconds | Countdown timer |
| `showResults` | boolean | Shows results card after submit |
| `resultData` | object | Score, marks, pass/fail data |
| `showReview` | boolean | Shows answer review section |
| `reviewFilter` | string | `'all' \| 'correct' \| 'wrong'` |

**User Flow:**
1. Check if already attempted → show "Already Completed" with links
2. Load quiz → start countdown timer
3. Navigate questions (Prev/Next + clickable question grid)
4. Select answers (single-select per question)
5. "Finish Quiz" on last question → submit
6. Timer expires → auto-submit
7. Results: score emoji, pass/fail badge, marks breakdown
8. "Review Answers" → per-question review with correct/wrong filtering

**Inline components:** `QuestionGrid` (navigation sidebar), `ReviewCard` (answer review display)

**API calls:** `quizAPI.hasAttempted`, `quizAPI.getQuizById`, `quizAPI.submitQuiz`

---

### 8.6 AddQuiz (`/addQuiz`)

**Purpose:** Creates a new quiz. Thin wrapper around `QuizForm`.

**API calls:** `quizAPI.createQuiz` → toast → navigate to `/home`

---

### 8.7 EditQuiz (`/editQuiz/:id`)

**Purpose:** Edit an existing quiz. Fetches quiz data, maps it to `QuizForm` format.

**Data mapping:** Backend `{ options[], correctOption }` → Form `{ optionA, optionB, optionC, optionD, correctAnswer }`

**API calls:** `quizAPI.getQuizById` (load), `quizAPI.updateQuiz` (save)

---

### 8.8 QuizStudents (`/quiz/:id/students`)

**Purpose:** Teacher view of all student attempts for a quiz.

**Features:**
- Sort by: score ↓, score ↑, time ↑, date ↓
- Export: "Quiz JSON" download + "Attempts CSV" download
- Table: rank, student avatar+name, score (color-coded), marks, time, date

**API calls:** `quizAPI.getQuizById`, `quizAPI.getQuizStudents`, `quizAPI.exportQuiz`, `quizAPI.exportAttempts`

---

### 8.9 Profile (`/profile`)

**Purpose:** User profile with inline editing, password change, and activity history.

**Features:**
- View/edit name, email, phone
- Change password (current + new + confirm)
- **Teachers:** Created quizzes list with "View Students →" links, stats (quizzes, questions)
- **Students:** Paginated attempt history with scores, stats (quizzes taken, avg score, distinctions ≥80%)

**API calls:** `profileAPI.getProfile`, `profileAPI.updateProfile`, `profileAPI.changePassword`, `quizAPI.getMyQuizzes`, `profileAPI.getAttemptsPaginated`

---

### 8.10 Leaderboard (`/leaderboard/:id`)

**Purpose:** Ranked leaderboard for a specific quiz.

**Features:**
- Client-side sort: score desc, then time asc (tiebreaker)
- Top 3 get medal-style circles (gold, silver, bronze)
- Current user's row highlighted with accent background + "(You)" label
- Table: rank, player avatar+name, score %, time, date

**API calls:** `quizAPI.getLeaderboard`, `quizAPI.getQuizById`

---

### 8.11 ShareQuiz (`/share/:shareCode`)

**Purpose:** Public quiz preview page accessed via share link.

**Features:**
- Shows quiz info: title, description, question count, time limit, category, creator
- Auth-aware CTA: "Start Quiz" (logged in → `/quiz/:id`) or "Sign In to Start" (→ `/login`)

**API calls:** `quizAPI.getByShareCode`

---

### 8.12 Dashboard (`/dashboard`)

**Purpose:** Teacher analytics dashboard.

**Features:**
- 6 stat cards: Total Quizzes, Published, Total Attempts, Avg Score, Drafts, Closed
- "My Quizzes" table (top 5): name, category, status badge, student count, "View" link
- "Recent Activity" feed: student name, quiz title, time, score badge
- All API calls fire in parallel on mount

**API calls:** `dashboardAPI.getStats`, `dashboardAPI.getRecentAttempts`, `dashboardAPI.getQuizzes`

---

### 8.13 Admin (`/admin`)

**Purpose:** Admin platform management panel. 598 lines — the largest page.

**4 Tabs:**

| Tab | Content |
|-----|---------|
| **Overview** | 9 stat cards (users by role, quizzes by status, total attempts) |
| **Users** | Role filter tabs, paginated table, role dropdown change, delete with confirm |
| **Quizzes** | Paginated table, status badges, delete with confirm |
| **Attempts** | Paginated table, expandable rows with per-question answer details |

**API calls:** `adminAPI.getStats`, `adminAPI.getUsers`, `adminAPI.getUsersByRole`, `adminAPI.getQuizzes`, `adminAPI.getAttempts`, `adminAPI.getAttemptById`, `adminAPI.updateUserRole`, `adminAPI.deleteUser`, `adminAPI.deleteQuiz`

---

### 8.14 NotFound (`*`)

**Purpose:** 404 page. Auth-aware redirect: → `/home` (logged in) or → `/` (not logged in).

---

## 9. Reusable Components

### `QuizCard` — Quiz Display Card
**File:** `components/QuizCard.js` (189 lines)

| Prop | Type | Description |
|------|------|-------------|
| `quiz` | object | Quiz data |
| `onClick` | function | Card click handler |
| `onDelete(quizId)` | function | Delete callback |
| `onPublish(quizId)` | function | Publish callback |
| `onClose(quizId)` | function | Close callback |

**Features:** Title, status badge (DRAFT/PUBLISHED/CLOSED), difficulty, category, question count, time limit, tags, creator avatar, leaderboard link. Owner-only actions: publish (copies share URL), share code copy, view students, close, edit, delete. Uses `ConfirmDialog` for destructive actions.

---

### `QuizForm` — Quiz Create/Edit Form
**File:** `components/QuizForm.js` (287 lines)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `initialData` | object | `{}` | Pre-populated form data for editing |
| `onSubmit(quizData)` | async function | required | Submit handler |
| `submitLabel` | string | `"Create Quiz"` | Submit button text |
| `submittingLabel` | string | `"Creating..."` | Submit button text while loading |
| `showStatus` | boolean | `false` | Show status field (edit mode) |

**Exported constants:**
- `CATEGORIES` — `["General", "Science", "Mathematics", "History", "Technology", "Languages", "Arts", "Programming"]`
- `DIFFICULTIES` — `["EASY", "MEDIUM", "HARD"]`

**4 Form Sections:**
1. **Quiz Details** — title, description, category dropdown, difficulty, tags (comma-separated)
2. **Quiz Settings** — time limit (min), pass percentage, toggle switches (shuffle questions, shuffle options, negative marking)
3. **Schedule** — optional start/end datetime pickers
4. **Questions** — dynamic list with add/remove; each has text, 4 options (A-D), correct answer dropdown, marks

**Internal components:** `ToggleSwitch`, `QuestionCard`

**Payload format (onSubmit):**

> ⚠️ **Backend expects `CreateQuizRequest` DTO.** The frontend `QuizForm` currently sends the legacy format below. The backend's `CreateQuizRequest` accepts `questions[].questionType` (MCQ, MSQ, TRUE_FALSE, DESCRIPTIVE), `questions[].options[]` (list), `questions[].correctOption`, `questions[].correctOptions[]`, `questions[].modelAnswer`, and `questions[].keywords`. The frontend form needs updating to support multi-type questions.

```json
{
  "title": "string",
  "description": "string",
  "category": "string",
  "difficulty": "EASY|MEDIUM|HARD",
  "tags": "comma,separated",
  "timeLimitMinutes": 10,
  "passPercentage": 50,
  "shuffleQuestions": true,
  "shuffleOptions": true,
  "negativeMarking": false,
  "startTime": "ISO datetime | null",
  "endTime": "ISO datetime | null",
  "status": "DRAFT|PUBLISHED",
  "questions": [
    {
      "text": "Question text",
      "options": ["A text", "B text", "C text", "D text"],
      "correctOption": "A text",
      "marks": 1
    }
  ]
}
```

---

### `ConfirmDialog` — Confirmation Modal

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `open` | boolean | — | Visibility |
| `title` | string | — | Dialog title |
| `message` | string | — | Dialog body |
| `confirmText` | string | `"Confirm"` | Confirm button label |
| `cancelText` | string | `"Cancel"` | Cancel button label |
| `variant` | string | `"danger"` | `"danger"` = red button, else accent |
| `onConfirm` | function | — | Confirm handler |
| `onCancel` | function | — | Cancel handler |

---

### `PageHeader` — Page Title with Back Button

| Prop | Type | Description |
|------|------|-------------|
| `title` | string | Page heading text |

Renders a "← Back" button (`navigate(-1)`) + heading.

---

### `PasswordInput` — Password Field with Toggle

| Prop | Type | Description |
|------|------|-------------|
| `className` | string | CSS classes for the input |
| `...props` | any | Spread onto `<input>` (value, onChange, placeholder, etc.) |

Renders a password input with eye icon toggle (show/hide).

---

### `LoadingSpinner` — Centered Loading State

No props. Renders a spinner animation with "Loading..." text, min-height 300px.

---

### `QuizSkeleton` — Card Loading Placeholder

No props. Shimmer-animated skeleton matching `QuizCard` layout.

---

### `StatsCard` — Dashboard Stat Display

| Prop | Type | Description |
|------|------|-------------|
| `value` | string/number | Large accent-colored value |
| `label` | string | Muted label below |

---

### `RouteGuards` — Auth Route Wrappers

| Component | Props | Behavior |
|-----------|-------|----------|
| `ProtectedRoute` | `children` | Redirects to `/login` if not authenticated |
| `GuestRoute` | `children` | Redirects to `/home` if authenticated |
| `RoleGuard` | `children`, `roles[]` | Redirects to `/home` if role not in list |

---

## 10. State Management

The app uses **React Context** for global state (no Redux/Zustand):

### UserContext
- **Provider:** `<UserProvider>` in `index.js`
- **Hook:** `useAuth()` → `{ user, setUser, logout }`
- **Persistence:** `localStorage` key `"user"` (JSON: `{ token, user }`)
- **Auto-clear:** Listens for `window` event `auth:expired` (fired by Axios 401 interceptor)

### ThemeContext
- **Provider:** `<ThemeProvider>` in `index.js`
- **Hook:** `useTheme()` → `{ darkMode, toggleTheme }`
- **Persistence:** `localStorage` key `"theme"` (`"dark"` or `"light"`)
- **Effect:** Sets `data-theme` attribute on `<html>` element

### Page-Level State
All page-specific state uses `useState` hooks. No global quiz/form state — each page fetches fresh data on mount.

---

## 11. Styling Guide

### Stack
- **Tailwind CSS 3** — utility-first, configured in `tailwind.config.js`
- **CSS Variables** — for dark/light theming (see [Theming System](#4-theming-system))
- **Inter font** — loaded from Google Fonts CDN

### Tailwind Config Highlights

| Feature | Config |
|---------|--------|
| Dark mode | `['class', '[data-theme="dark"]']` |
| Font | `Inter` with system fallbacks |
| Border radius | `sm: 6px`, `DEFAULT: 8px`, `lg: 12px`, `xl: 16px` |
| Shadows | 5 levels: `xs`, `sm`, `DEFAULT`, `md`, `lg` |
| Animations | `shimmer` (skeleton), `spin` (spinner), `pulse-timer` (timer) |

### Custom CSS Components (in `index.css`)

| Class | Purpose |
|-------|---------|
| `.skeleton` | Shimmer loading animation (gradient sweep) |
| `.spinner` | Spinning circle loader (border animation) |
| `.toggle-switch` | Custom toggle switch (active state via `.active` class) |

### Conventions
- Use `[color:var(--name)]` syntax for theme-aware colors: `bg-[color:var(--bg-card)]`
- Prefer Tailwind utilities over custom CSS
- Use `transition-all duration-150` for interactive elements
- Custom scrollbar styling (thin, rounded, theme-aware)

---

## 12. Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `REACT_APP_API_URL` | `http://localhost:8080` | Backend API base URL |

Set via `.env` file in `frontend/`:
```
REACT_APP_API_URL=https://api.yourserver.com
```

The `proxy` field in `package.json` (`http://localhost:8080`) is used during development only to avoid CORS issues with `npm start`.

---

## Appendix: Page Summary Table

| # | Page | Route | Lines | API Module | API Calls | Role |
|---|------|-------|------:|------------|-----------|------|
| 1 | Landing | `/` | 163 | — | 0 | Public |
| 2 | Login | `/login` | 187 | `authAPI` | 3 | Guest |
| 3 | Register | `/register` | 126 | `authAPI` | 1 | Guest |
| 4 | Home | `/home` | 241 | `quizAPI` | 4 | Auth |
| 5 | QuizData | `/quiz/:id` | 303 | `quizAPI` | 3 | Auth |
| 6 | AddQuiz | `/addQuiz` | 30 | `quizAPI` | 1 | Teacher |
| 7 | EditQuiz | `/editQuiz/:id` | 76 | `quizAPI` | 2 | Teacher |
| 8 | QuizStudents | `/quiz/:id/students` | 176 | `quizAPI` | 4 | Teacher |
| 9 | Profile | `/profile` | 278 | `profileAPI`+`quizAPI` | 5 | Auth |
| 10 | Leaderboard | `/leaderboard/:id` | 131 | `quizAPI` | 2 | Auth |
| 11 | ShareQuiz | `/share/:shareCode` | 96 | `quizAPI` | 1 | Public |
| 12 | Dashboard | `/dashboard` | 202 | `dashboardAPI` | 3 | Teacher |
| 13 | Admin | `/admin` | 598 | `adminAPI` | 9 | Admin |
| 14 | NotFound | `*` | 26 | — | 0 | Public |

**Total:** ~2,633 lines across 14 pages, 9 components, 2 contexts, 1 API module (210 lines).

---

## Changelog (v0.2.0)

### Backend API Changes Affecting Frontend

1. **`POST /api/auth/forgot-password`** — Response no longer returns reset token. Returns generic `"If the email exists, a password reset link has been sent."` message.

2. **`POST /api/quizzes` and `PUT /api/quizzes/{id}`** — Now accept `CreateQuizRequest` DTO instead of raw `Quiz` entity. Clients cannot set `id`, `createdBy`, `status`, or `shareCode`. Questions use `options[]` (list) instead of `optionA/B/C/D`, and `correctOption` (text) instead of `correctAnswer` (letter).

3. **Multi-Type Questions** — Backend supports 4 question types: `MCQ`, `MSQ`, `TRUE_FALSE`, `DESCRIPTIVE`. Frontend `QuizForm` currently only supports MCQ — needs updating.

4. **`QuizDTO` expanded** — Now includes: `description`, `difficulty`, `tags`, `shareCode`, `timeLimitMinutes`, `passPercentage`, `negativeMarking`, `shuffleQuestions`, `shuffleOptions`, `startTime`, `endTime`, `totalMarks`.

5. **`AnswerDTO` now includes `id`** — Needed for the `PUT /api/quizzes/answers/{answerId}/evaluate` endpoint.

6. **`GET /api/dashboard/quizzes/{id}/stats`** — Now enforces ownership. Teachers can only view stats for their own quizzes.

7. **`DELETE /api/admin/users/{id}`** — Prevents self-deletion. Returns 400 if admin tries to delete their own account.

8. **403 Error Response** — New structured format: `{ status: 403, error: "ACCESS_DENIED", message: "..." }`.

9. **CSV Export** — Columns changed from `Score, Total Questions` to `Marks Obtained, Total Marks`.

10. **Quiz Availability** — `GET /api/quizzes/{id}` now validates quiz is published and within time window before returning.
