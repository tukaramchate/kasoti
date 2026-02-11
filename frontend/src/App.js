import React, { useContext } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Landing from "./pages/Landing/Landing";
import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import Home from "./pages/Home/Home";
import QuizData from "./pages/QuizData/QuizData";
import AddQuiz from "./pages/AddQuiz/AddQuiz";
import EditQuiz from "./pages/EditQuiz/EditQuiz";
import QuizStudents from "./pages/QuizStudents/QuizStudents";
import Profile from "./pages/Profile/Profile";
import Leaderboard from "./pages/Leaderboard/Leaderboard";
import ShareQuiz from "./pages/ShareQuiz/ShareQuiz";
import Dashboard from "./pages/Dashboard/Dashboard";
import Admin from "./pages/Admin/Admin";
import { UserContext } from "./context/UserContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const App = () => {
  const { user } = useContext(UserContext);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/share/:shareCode" element={<ShareQuiz />} />
        <Route path="/home" element={user ? <Home /> : <Navigate to="/login" />} />
        <Route
          path="/quiz/:id"
          element={user ? <QuizData /> : <Navigate to="/login" />}
        />
        <Route
          path="/addQuiz"
          element={user ? <AddQuiz /> : <Navigate to="/login" />}
        />
        <Route
          path="/editQuiz/:id"
          element={user ? <EditQuiz /> : <Navigate to="/login" />}
        />
        <Route
          path="/quiz/:id/students"
          element={user ? <QuizStudents /> : <Navigate to="/login" />}
        />
        <Route
          path="/profile"
          element={user ? <Profile /> : <Navigate to="/login" />}
        />
        <Route
          path="/leaderboard/:id"
          element={user ? <Leaderboard /> : <Navigate to="/login" />}
        />
        <Route
          path="/dashboard"
          element={user ? <Dashboard /> : <Navigate to="/login" />}
        />
        <Route
          path="/admin"
          element={user ? <Admin /> : <Navigate to="/login" />}
        />
      </Routes>
      <ToastContainer />
    </Router>
  );
};


export default App;
