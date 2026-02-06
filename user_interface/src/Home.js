import React, { useState, useEffect, useContext } from "react";
import { quizAPI } from "./api";
import { UserContext } from "./userContext";
import { Link, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./style/Home.css";

const Home = () => {
  const { user, setUser } = useContext(UserContext);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const response = await quizAPI.getAllQuizzes();
      setQuizzes(response.data);
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      toast.error("Failed to load quizzes");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
    toast.success("Logged out successfully");
    navigate("/");
  };

  const handleQuizClick = (quizId) => {
    navigate(`/quiz/${quizId}`);
  };

  const currentUser = user?.user;
  const isTeacher = currentUser?.is_teacher;

  return (
    <div className="home-container">
      {/* Header */}
      <header className="home-header">
        <div className="home-logo">
          <div className="home-logo-icon">Q</div>
          <span className="home-logo-text">QuizMaster</span>
        </div>

        <div className="user-section">
          {currentUser && (
            <div className="user-info">
              <div className="user-avatar">
                {currentUser.username?.charAt(0).toUpperCase()}
              </div>
              <span className="user-name">{currentUser.username}</span>
              {isTeacher && <span className="teacher-badge">Teacher</span>}
            </div>
          )}
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <h1 className="hero-title">
          Welcome to <span>QuizMaster</span>
        </h1>
        <p className="hero-subtitle">
          Test your knowledge with interactive quizzes
        </p>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stat-card">
          <div className="stat-value">{quizzes.length}</div>
          <div className="stat-label">Total Quizzes</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {quizzes.reduce((acc, quiz) => acc + (quiz.questions?.length || 0), 0)}
          </div>
          <div className="stat-label">Total Questions</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{isTeacher ? "Create" : "Learn"}</div>
          <div className="stat-label">{isTeacher ? "New Quizzes" : "& Explore"}</div>
        </div>
      </section>

      {/* Quiz Section */}
      <section className="quiz-section">
        <div className="section-header">
          <h2 className="section-title">Available Quizzes</h2>
          {isTeacher && (
            <Link to="/addQuiz" className="create-quiz-btn">
              + Create Quiz
            </Link>
          )}
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
          </div>
        ) : quizzes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <h3 className="empty-title">No quizzes yet</h3>
            <p className="empty-text">
              {isTeacher
                ? "Create your first quiz to get started!"
                : "Check back later for new quizzes."}
            </p>
            {isTeacher && (
              <Link to="/addQuiz" className="create-quiz-btn">
                + Create First Quiz
              </Link>
            )}
          </div>
        ) : (
          <div className="quiz-grid">
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="quiz-card"
                onClick={() => handleQuizClick(quiz.id)}
              >
                <div className="quiz-card-header">
                  <h3 className="quiz-card-title">{quiz.title}</h3>
                  <span className="quiz-card-badge">
                    {quiz.questions?.length || 0} Q
                  </span>
                </div>
                <div className="quiz-card-meta">
                  <span>⏱ {(quiz.questions?.length || 0) * 30}s</span>
                  <span>📝 Interactive</span>
                </div>
                <div className="quiz-card-author">
                  <div className="quiz-card-author-avatar">
                    {quiz.username?.charAt(0).toUpperCase()}
                  </div>
                  <span className="quiz-card-author-name">
                    By {quiz.username}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <ToastContainer />
    </div>
  );
};

export default Home;
