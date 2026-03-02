import React, { lazy, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";
import { ProtectedRoute, GuestRoute, RoleGuard } from "./components/RouteGuards";
import ErrorBoundary from "./components/ErrorBoundary";
import Navbar from "./components/Navbar";
import LoadingSpinner from "./components/LoadingSpinner";
import { ToastContainer } from "react-toastify";
import { useTheme } from "./context/ThemeContext";
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
const Analytics = lazy(() => import("./pages/Analytics/Analytics"));
const NotFound = lazy(() => import("./pages/NotFound/NotFound"));

const SuspenseFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-[color:var(--bg-primary)]">
    <LoadingSpinner />
  </div>
);

/** Layout wrapper that renders the Navbar + page content */
const AppLayout = ({ children }) => (
  <>
    <Navbar />
    <main>{children}</main>
  </>
);

const AppRoutes = () => {
  const { darkMode } = useTheme();

  return (
    <>
      <Suspense fallback={<SuspenseFallback />}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/share/:shareCode" element={<ShareQuiz />} />

          {/* Guest-only routes (redirect to /home if logged in) */}
          <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

          {/* Protected routes with Navbar */}
          <Route path="/home" element={
            <ProtectedRoute><AppLayout><Home /></AppLayout></ProtectedRoute>
          } />
          <Route path="/quiz/:id" element={
            <ProtectedRoute><AppLayout><QuizData /></AppLayout></ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute><AppLayout><Profile /></AppLayout></ProtectedRoute>
          } />
          <Route path="/leaderboard/:id" element={
            <ProtectedRoute><AppLayout><Leaderboard /></AppLayout></ProtectedRoute>
          } />

          {/* Teacher + Admin routes with Navbar */}
          <Route path="/addQuiz" element={
            <ProtectedRoute><RoleGuard roles={["TEACHER", "ADMIN"]}><AppLayout><AddQuiz /></AppLayout></RoleGuard></ProtectedRoute>
          } />
          <Route path="/editQuiz/:id" element={
            <ProtectedRoute><RoleGuard roles={["TEACHER", "ADMIN"]}><AppLayout><EditQuiz /></AppLayout></RoleGuard></ProtectedRoute>
          } />
          <Route path="/quiz/:id/students" element={
            <ProtectedRoute><RoleGuard roles={["TEACHER", "ADMIN"]}><AppLayout><QuizStudents /></AppLayout></RoleGuard></ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute><RoleGuard roles={["TEACHER", "ADMIN"]}><AppLayout><Dashboard /></AppLayout></RoleGuard></ProtectedRoute>
          } />
          <Route path="/quiz/:id/analytics" element={
            <ProtectedRoute><RoleGuard roles={["TEACHER", "ADMIN"]}><AppLayout><Analytics /></AppLayout></RoleGuard></ProtectedRoute>
          } />

          {/* Admin-only routes with Navbar */}
          <Route path="/admin" element={
            <ProtectedRoute><RoleGuard roles={["ADMIN"]}><AppLayout><Admin /></AppLayout></RoleGuard></ProtectedRoute>
          } />

          {/* 404 catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss={false}
        draggable
        pauseOnHover
        theme={darkMode ? "dark" : "light"}
        toastStyle={{
          borderRadius: "10px",
          fontSize: "13px",
        }}
      />
    </>
  );
};

const App = () => {
  return (
    <ErrorBoundary>
      <Router>
        <AppRoutes />
      </Router>
    </ErrorBoundary>
  );
};

export default App;
