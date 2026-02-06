import React, { useState, useEffect, useContext } from "react";
import { quizAPI } from "./api";
import { UserContext } from "./userContext";
import { Link, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./style/Home.css";
import { FiSearch, FiMoon, FiSun } from "react-icons/fi";

// Components
import QuizCard from "./components/QuizCard";
import StatsCard from "./components/StatsCard";
import LoadingSpinner from "./components/LoadingSpinner";
import QuizSkeleton from "./components/QuizSkeleton";

const CATEGORIES = ['All', 'General', 'Science', 'Mathematics', 'History', 'Technology', 'Languages', 'Arts'];

const Home = () => {
  const { user, setUser } = useContext(UserContext);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const navigate = useNavigate();

  // Apply dark mode to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Combined filtering: category + search
  const filteredQuizzes = quizzes.filter(quiz => {
    const matchesCategory = selectedCategory === 'All' || quiz.category === selectedCategory;
    const matchesSearch = quiz.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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

  const handleDeleteQuiz = async (quizId) => {
    try {
      await quizAPI.deleteQuiz(quizId);
      setQuizzes(quizzes.filter(q => q.id !== quizId));
      toast.success('Quiz deleted successfully');
    } catch (error) {
      console.error('Error deleting quiz:', error);
      toast.error('Failed to delete quiz');
    }
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
          <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)} title="Toggle theme">
            {darkMode ? <FiSun /> : <FiMoon />}
          </button>
          {currentUser && (
            <div className="user-info" onClick={() => navigate('/profile')}>
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
        <StatsCard
          value={quizzes.length}
          label="Total Quizzes"
        />
        <StatsCard
          value={quizzes.reduce((acc, quiz) => acc + (quiz.questions?.length || 0), 0)}
          label="Total Questions"
        />
        <StatsCard
          value={isTeacher ? "Create" : "Learn"}
          label={isTeacher ? "New Quizzes" : "& Explore"}
        />
      </section>

      {/* Quiz Section */}
      <section className="quiz-section">
        <div className="section-header">
          <h2 className="section-title">Available Quizzes</h2>
          <div className="header-actions">
            <div className="search-box">
              <FiSearch className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Search quizzes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {isTeacher && (
              <Link to="/addQuiz" className="create-quiz-btn">
                + Create Quiz
              </Link>
            )}
          </div>
        </div>

        {/* Category Filter */}
        <div className="category-filter">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="quiz-grid">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <QuizSkeleton key={n} />
            ))}
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
        ) : filteredQuizzes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h3 className="empty-title">No quizzes in this category</h3>
            <p className="empty-text">Try selecting a different category.</p>
          </div>
        ) : (
          <div className="quiz-grid">
            {filteredQuizzes.map((quiz) => (
              <QuizCard
                key={quiz.id}
                quiz={quiz}
                onClick={() => handleQuizClick(quiz.id)}
                onDelete={handleDeleteQuiz}
              />
            ))}
          </div>
        )}
      </section>

      <ToastContainer />
    </div>
  );
};

export default Home;
