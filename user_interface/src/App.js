import React, { useContext } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./Login";
import Register from "./Register";
import Home from "./Home";
import QuizData from "./QuizData";
import AddQuiz from "./AddQuiz";
import EditQuiz from "./EditQuiz";
import QuizStudents from "./QuizStudents";
import Profile from "./Profile";
import Leaderboard from "./Leaderboard";
import { UserContext } from "./userContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const App = () => {
  const { user } = useContext(UserContext);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/home" element={user ? <Home /> : <Navigate to="/" />} />
        <Route
          path="/quiz/:id"
          element={user ? <QuizData /> : <Navigate to="/" />}
        />
        <Route
          path="/addQuiz"
          element={user ? <AddQuiz /> : <Navigate to="/" />}
        />
        <Route
          path="/editQuiz/:id"
          element={user ? <EditQuiz /> : <Navigate to="/" />}
        />
        <Route
          path="/quiz/:id/students"
          element={user ? <QuizStudents /> : <Navigate to="/" />}
        />
        <Route
          path="/profile"
          element={user ? <Profile /> : <Navigate to="/" />}
        />
        <Route
          path="/leaderboard/:id"
          element={user ? <Leaderboard /> : <Navigate to="/" />}
        />
      </Routes>
      <ToastContainer />
    </Router>
  );
};


export default App;
