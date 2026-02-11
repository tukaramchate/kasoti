import React, { useState, useEffect, useContext, useCallback } from "react";
import { quizAPI } from "../../api";
import { UserContext } from "../../context/UserContext";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "./Home.css";
import { FiSearch, FiMoon, FiSun, FiChevronLeft, FiChevronRight } from "react-icons/fi";

// Components
import QuizCard from "../../components/QuizCard";
import StatsCard from "../../components/StatsCard";
import QuizSkeleton from "../../components/QuizSkeleton";

const Home = () => {
  const { user, setUser } = useContext(UserContext);
  const [quizzes, setQuizzes] = useState([]);
  const [myQuizzes, setMyQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myQuizzesLoading, setMyQuizzesLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState(['All']);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const navigate = useNavigate();

  // Pagination state
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 12;

  const currentUser = user?.user;
  const isTeacher = currentUser?.role === 'TEACHER' || currentUser?.is_teacher;
  const isAdmin = currentUser?.role === 'ADMIN';

  // Apply dark mode to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await quizAPI.getCategories();
        setCategories(['All', ...response.data]);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  const fetchMyQuizzes = useCallback(async () => {
    if (!isTeacher) return;
    setMyQuizzesLoading(true);
    try {
      const response = await quizAPI.getMyQuizzes();
      setMyQuizzes(Array.isArray(response.data) ? response.data : response.data.content || []);
    } catch (error) {
      console.error("Error fetching my quizzes:", error);
    } finally {
      setMyQuizzesLoading(false);
    }
  }, [isTeacher]);

  useEffect(() => {
    fetchMyQuizzes();
  }, [fetchMyQuizzes]);

  const fetchQuizzes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await quizAPI.getAllQuizzes(page, pageSize, searchQuery, selectedCategory);

      // Handle paginated response
      if (response.data.content) {
        setQuizzes(response.data.content);
        setTotalPages(response.data.totalPages);
        setTotalElements(response.data.totalElements);
      } else {
        // Fallback for non-paginated response
        setQuizzes(response.data);
        setTotalPages(1);
        setTotalElements(response.data.length);
      }
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      toast.error("Failed to load quizzes");
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, selectedCategory]);

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  // Reset to first page when search or category changes
  useEffect(() => {
    setPage(0);
  }, [searchQuery, selectedCategory]);

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
      setMyQuizzes(myQuizzes.filter(q => q.id !== quizId));
      toast.success('Quiz deleted successfully');
    } catch (error) {
      console.error('Error deleting quiz:', error);
      toast.error('Failed to delete quiz');
    }
  };

  // Calculate total questions from current page
  const totalQuestions = quizzes.reduce((acc, quiz) => acc + (quiz.questionCount || quiz.questions?.length || 0), 0);

  return (
    <div className="home-container">
      {/* Header */}
      <header className="home-header">
        <div className="home-logo">
          <img src="/assets/Kasoti logo.png" alt="Kasoti" className="home-logo-img" />
        </div>

        <div className="user-section">
          <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)} title="Toggle theme">
            {darkMode ? <FiSun /> : <FiMoon />}
          </button>
          {(isTeacher || isAdmin) && (
            <button className="nav-link-btn" onClick={() => navigate('/dashboard')}>
              Dashboard
            </button>
          )}
          {isAdmin && (
            <button className="nav-link-btn" onClick={() => navigate('/admin')}>
              Admin
            </button>
          )}
          {currentUser && (
            <div className="user-info" onClick={() => navigate('/profile')}>
              <div className="user-avatar">
                {currentUser.username?.charAt(0).toUpperCase()}
              </div>
              <span className="user-name">{currentUser.username}</span>
              {isTeacher && <span className="teacher-badge">Teacher</span>}
              {isAdmin && <span className="teacher-badge">Admin</span>}
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
          Welcome to <span>Kasoti</span>
        </h1>
        <p className="hero-subtitle">
          Test your knowledge with interactive quizzes
        </p>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <StatsCard
          value={totalElements}
          label="Total Quizzes"
        />
        <StatsCard
          value={totalQuestions}
          label="Questions"
        />
        <StatsCard
          value={isTeacher ? "Create" : "Learn"}
          label={isTeacher ? "New Quizzes" : "& Explore"}
        />
      </section>

      {/* My Quizzes Section (Teachers only) */}
      {isTeacher && (
        <section className="quiz-section my-quizzes-section">
          <div className="section-header">
            <h2 className="section-title">My Quizzes</h2>
            <Link to="/addQuiz" className="create-quiz-btn">
              + Create Quiz
            </Link>
          </div>
          {myQuizzesLoading ? (
            <div className="quiz-grid">
              {[1, 2, 3].map((n) => (
                <QuizSkeleton key={n} />
              ))}
            </div>
          ) : myQuizzes.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <h3 className="empty-title">No quizzes created yet</h3>
              <p className="empty-text">Create your first quiz to get started!</p>
              <Link to="/addQuiz" className="create-quiz-btn">
                + Create First Quiz
              </Link>
            </div>
          ) : (
            <div className="quiz-grid">
              {myQuizzes.map((quiz) => (
                <QuizCard
                  key={quiz.id}
                  quiz={quiz}
                  onClick={() => handleQuizClick(quiz.id)}
                  onDelete={handleDeleteQuiz}
                  onPublish={() => { fetchMyQuizzes(); fetchQuizzes(); }}
                  onClose={() => { fetchMyQuizzes(); fetchQuizzes(); }}
                />
              ))}
            </div>
          )}
        </section>
      )}

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
          </div>
        </div>

        {/* Category Filter */}
        <div className="category-filter">
          {categories.map((category) => (
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
            <h3 className="empty-title">
              {searchQuery || selectedCategory !== 'All'
                ? "No quizzes found"
                : "No quizzes yet"}
            </h3>
            <p className="empty-text">
              {searchQuery || selectedCategory !== 'All'
                ? "Try adjusting your search or filter."
                : "Check back later for new quizzes."}
            </p>
          </div>
        ) : (
          <>
            <div className="quiz-grid">
              {quizzes.map((quiz) => (
                <QuizCard
                  key={quiz.id}
                  quiz={quiz}
                  onClick={() => handleQuizClick(quiz.id)}
                  onDelete={handleDeleteQuiz}
                  onPublish={() => fetchQuizzes()}
                  onClose={() => fetchQuizzes()}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="pagination-btn"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  <FiChevronLeft /> Prev
                </button>
                <span className="pagination-info">
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  className="pagination-btn"
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                >
                  Next <FiChevronRight />
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default Home;
