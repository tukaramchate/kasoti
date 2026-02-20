import React, { lazy, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";
import { ProtectedRoute, GuestRoute, RoleGuard } from "./components/RouteGuards";
import ErrorBoundary from "./components/ErrorBoundary";
import LoadingSpinner from "./components/LoadingSpinner";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Lazy-loaded pages
const Landing = lazy(() => import("./pages/Landing/Landing"));
const Login = lazy(() => import("./pages/Login/Login"));
const Register = lazy(() => import("./pages/Register/Register"));
const Home = lazy(() => import("./pages/Home/Home"));
const QuizData = lazy(() => import("./pages/QuizData/QuizData"));
const AddQuiz = lazy(() => import("./pages/AddQuiz/AddQuiz"));
const EditQuiz = lazy(() => import("./pages/EditQuiz/EditQuiz"));
const QuizStudents = lazy(() => import("./pages/QuizStudents/QuizStudents"));
const Profile = lazy(() => import("./pages/Profile/Profile"));
const Leaderboard = lazy(() => import("./pages/Leaderboard/Leaderboard"));
const ShareQuiz = lazy(() => import("./pages/ShareQuiz/ShareQuiz"));
const Dashboard = lazy(() => import("./pages/Dashboard/Dashboard"));
const Admin = lazy(() => import("./pages/Admin/Admin"));
const NotFound = lazy(() => import("./pages/NotFound/NotFound"));

const SuspenseFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-[color:var(--bg-primary)]">
    <LoadingSpinner />
  </div>
);

const App = () => {
  return (
    <ErrorBoundary>
    <Router>
      <Suspense fallback={<SuspenseFallback />}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/share/:shareCode" element={<ShareQuiz />} />

          {/* Guest-only routes (redirect to /home if logged in) */}
          <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

          {/* Protected routes (require auth) */}
          <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/quiz/:id" element={<ProtectedRoute><QuizData /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/leaderboard/:id" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />

          {/* Teacher + Admin routes */}
          <Route path="/addQuiz" element={
            <ProtectedRoute><RoleGuard roles={["TEACHER", "ADMIN"]}><AddQuiz /></RoleGuard></ProtectedRoute>
          } />
          <Route path="/editQuiz/:id" element={
            <ProtectedRoute><RoleGuard roles={["TEACHER", "ADMIN"]}><EditQuiz /></RoleGuard></ProtectedRoute>
          } />
          <Route path="/quiz/:id/students" element={
            <ProtectedRoute><RoleGuard roles={["TEACHER", "ADMIN"]}><QuizStudents /></RoleGuard></ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute><RoleGuard roles={["TEACHER", "ADMIN"]}><Dashboard /></RoleGuard></ProtectedRoute>
          } />

          {/* Admin-only routes */}
          <Route path="/admin" element={
            <ProtectedRoute><RoleGuard roles={["ADMIN"]}><Admin /></RoleGuard></ProtectedRoute>
          } />

          {/* 404 catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      <ToastContainer />
    </Router>
    </ErrorBoundary>
  );
};


export default App;
