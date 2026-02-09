# 📚 Java Quiz Application

A full-stack quiz management platform built with **Spring Boot** and **React**. Teachers can create, publish, and manage quizzes while students take quizzes, view scores, and compete on leaderboards.

![Java](https://img.shields.io/badge/Java-21-orange)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2-green)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue)
![React](https://img.shields.io/badge/React-18-61DAFB)

---

## ✨ Features

### Authentication & Security
- 🔐 JWT-based authentication
- 👤 Role-based access (Admin, Teacher, Student)
- 🔒 Password hashing with BCrypt
- 🚫 Login attempt rate limiting & account lockout
- 🔑 Password reset functionality

### Quiz Management (Teachers)
- ➕ Create quizzes with multiple-choice questions
- ✏️ Edit and delete quizzes
- 📤 Publish quizzes with shareable links
- 📊 View student attempts and scores
- 🔒 Close quizzes to prevent new attempts

### Taking Quizzes (Students)
- 📝 Attempt published quizzes
- ⏱️ Time tracking for attempts
- 📈 View scores and results immediately
- 📜 Quiz history on profile page
- 🏆 Leaderboard per quiz

### Admin Dashboard
- 👥 User management (view, update roles, delete)
- 📊 System-wide statistics
- 🗑️ Quiz and attempt management

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Java 21, Spring Boot 3.2, Spring Security, Spring Data JPA |
| **Database** | PostgreSQL |
| **Authentication** | JWT (JSON Web Tokens) |
| **Frontend** | React 18, Axios |
| **Build Tool** | Maven |

---

## 🚀 Getting Started

### Prerequisites

- Java 21+
- Maven 3.8+
- PostgreSQL 15+
- Node.js 18+ (for frontend)

### Backend Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/tukaramchate/quiz--app.git
   cd Java-Quiz
   ```

2. **Configure the database:**
   
   Create a PostgreSQL database and update `src/main/resources/application.properties`:
   ```properties
   spring.datasource.url=jdbc:postgresql://localhost:5432/quiz_db
   spring.datasource.username=your_username
   spring.datasource.password=your_password
   ```

3. **Run the backend:**
   ```bash
   ./mvnw spring-boot:run
   ```
   
   The API will be available at `http://localhost:8080`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd user_interface
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```
   
   The app will open at `http://localhost:3000`

---

## 📖 API Documentation

Full API documentation is available at: [`docs/FRONTEND_API_DOCUMENTATION.md`](docs/FRONTEND_API_DOCUMENTATION.md)

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | Login and get JWT |
| `GET` | `/api/quizzes` | Get all quizzes (paginated) |
| `POST` | `/api/quizzes/{id}/submit` | Submit quiz answers |
| `GET` | `/api/quizzes/{id}/leaderboard` | Get quiz leaderboard |
| `GET` | `/api/profile` | Get user profile |
| `GET` | `/api/dashboard/stats` | Teacher dashboard stats |
| `GET` | `/api/admin/stats` | System statistics (Admin) |

---

## 🏗️ Project Structure

```
Java-Quiz/
├── src/main/java/isil/java_quiz_server/
│   ├── controller/       # REST API controllers
│   ├── dto/              # Data Transfer Objects
│   ├── exception/        # Custom exceptions & handlers
│   ├── model/            # JPA entities
│   ├── repository/       # Spring Data repositories
│   ├── security/         # JWT & authentication
│   └── service/          # Business logic
├── src/main/resources/
│   └── application.properties
├── docs/
│   └── FRONTEND_API_DOCUMENTATION.md
└── user_interface/       # React frontend
```

---

## 🔒 User Roles

| Role | Permissions |
|------|-------------|
| **STUDENT** | Take quizzes, view scores, access leaderboards |
| **TEACHER** | All student permissions + create/manage quizzes |
| **ADMIN** | All permissions + user management, system stats |

---

## 🧪 Running Tests

```bash
# Run all tests
./mvnw test

# Run with coverage
./mvnw test jacoco:report
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📝 License

This project is open-source and available under the MIT License.

---

## 📧 Contact

For questions or support, please open an issue on GitHub.
