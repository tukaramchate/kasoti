import React, { useState, useEffect, useCallback } from "react";
import { quizAPI } from "../../api";
import { useAuth } from "../../context/UserContext";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FiSearch, FiChevronLeft, FiChevronRight, FiFilter } from "react-icons/fi";

// Components
import QuizCard from "../../components/QuizCard";
import StatsCard from "../../components/StatsCard";
import QuizSkeleton from "../../components/QuizSkeleton";

/** Debounce hook — returns debounced value after `delay` ms of inactivity */
function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [myQuizzes, setMyQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myQuizzesLoading, setMyQuizzesLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery);
  const [categories, setCategories] = useState(['All']);

  // Pagination state
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 12;

  const currentUser = user?.user;
  const isTeacher = currentUser?.role === 'TEACHER' || currentUser?.is_teacher;

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
      const response = await quizAPI.getAllQuizzes(page, pageSize, debouncedSearch, selectedCategory);

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
  }, [page, debouncedSearch, selectedCategory]);

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  // Reset to first page when search or category changes
  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, selectedCategory]);


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
    <div className="min-h-screen bg-[color:var(--bg-primary)]">
      {/* Hero Section */}
      <section className="text-center pt-12 pb-4 px-6 md:pt-12 md:pb-4">
        <h1 className="text-[28px] md:text-[28px] font-bold text-[color:var(--text-primary)] mb-1.5">
          Welcome to <span className="text-[color:var(--accent)]">Kasoti</span>
        </h1>
        <p className="text-[color:var(--text-secondary)] text-[15px]">
          Test your knowledge with interactive quizzes
        </p>
      </section>

      {/* Stats Section */}
      <section className="flex justify-center flex-wrap gap-3 p-6 md:p-6">
        <StatsCard value={totalElements} label="Total Quizzes" />
        <StatsCard value={totalQuestions} label="Questions" />
        <StatsCard value={isTeacher ? "Create" : "Learn"} label={isTeacher ? "New Quizzes" : "& Explore"} />
      </section>

      {/* My Quizzes Section (Teachers only) */}
      {isTeacher && (
        <section className="px-4 md:px-6 pb-6 mb-2 border-b border-[color:var(--border)] max-w-[1280px] mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-5">
            <h2 className="text-lg font-semibold text-[color:var(--text-primary)]">My Quizzes</h2>
            <Link
              to="/addQuiz"
              className="inline-flex items-center gap-1.5 py-2 px-[18px] bg-[color:var(--accent)] text-white rounded font-medium text-[13px] no-underline transition-all duration-150 hover:bg-[color:var(--accent-hover)]"
            >
              + Create Quiz
            </Link>
          </div>
          {myQuizzesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
              {[1, 2, 3].map((n) => (
                <QuizSkeleton key={n} />
              ))}
            </div>
          ) : myQuizzes.length === 0 ? (
            <div className="text-center py-[60px] px-5 bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-lg">
              <div className="text-[40px] mb-3">📝</div>
              <h3 className="text-base text-[color:var(--text-primary)] mb-1.5">No quizzes created yet</h3>
              <p className="text-[color:var(--text-secondary)] text-[13px] mb-5">Create your first quiz to get started!</p>
              <Link
                to="/addQuiz"
                className="inline-flex items-center gap-1.5 py-2 px-[18px] bg-[color:var(--accent)] text-white rounded font-medium text-[13px] no-underline transition-all duration-150 hover:bg-[color:var(--accent-hover)]"
              >
                + Create First Quiz
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
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
      <section className="px-4 md:px-6 pb-10 max-w-[1280px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-5">
          <h2 className="text-lg font-semibold text-[color:var(--text-primary)]">Available Quizzes</h2>
          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <div className="flex items-center bg-[color:var(--bg-card)] border border-[color:var(--border)] py-2 px-3.5 rounded gap-2 transition-all duration-150 focus-within:border-[color:var(--accent)] focus-within:shadow-[0_0_0_3px_var(--accent-light)] flex-1 md:flex-none">
              <FiSearch className="text-[color:var(--text-muted)] text-[15px] flex-shrink-0" />
              <input
                type="text"
                className="bg-transparent border-none outline-none font-sans text-[13px] text-[color:var(--text-primary)] w-full md:w-[180px] placeholder:text-[color:var(--text-muted)]"
                placeholder="Search quizzes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Subject Filter */}
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <FiFilter className="text-[color:var(--text-muted)] text-sm flex-shrink-0" />
          <span className="text-xs font-medium text-[color:var(--text-muted)] flex-shrink-0">Subject:</span>
          {categories.map((category) => (
            <button
              key={category}
              className={`py-1 px-3.5 border rounded-full font-sans text-xs font-medium cursor-pointer transition-all duration-150 ${selectedCategory === category
                ? 'bg-[color:var(--accent)] text-white border-[color:var(--accent)] shadow-sm'
                : 'bg-transparent border-[color:var(--border)] text-[color:var(--text-secondary)] hover:border-[color:var(--accent)] hover:text-[color:var(--accent)] hover:bg-[color:var(--accent-light)]'
                }`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <QuizSkeleton key={n} />
            ))}
          </div>
        ) : quizzes.length === 0 ? (
          <div className="text-center py-[60px] px-5 bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-lg">
            <div className="text-[40px] mb-3">📚</div>
            <h3 className="text-base text-[color:var(--text-primary)] mb-1.5">
              {searchQuery || selectedCategory !== 'All'
                ? "No quizzes found"
                : "No quizzes yet"}
            </h3>
            <p className="text-[color:var(--text-secondary)] text-[13px] mb-5">
              {searchQuery || selectedCategory !== 'All'
                ? "Try adjusting your search or filter."
                : "Check back later for new quizzes."}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
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
              <div className="flex justify-center items-center gap-1.5 mt-7">
                <button
                  className="flex items-center gap-1 py-2 px-3.5 bg-[color:var(--bg-card)] border border-[color:var(--border)] text-[color:var(--text-secondary)] rounded font-sans text-[13px] cursor-pointer transition-all duration-150 hover:border-[color:var(--accent)] hover:text-[color:var(--accent)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-[color:var(--border)] disabled:hover:text-[color:var(--text-secondary)]"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  <FiChevronLeft /> Prev
                </button>
                <span className="text-[color:var(--text-muted)] text-[13px] px-3">
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  className="flex items-center gap-1 py-2 px-3.5 bg-[color:var(--bg-card)] border border-[color:var(--border)] text-[color:var(--text-secondary)] rounded font-sans text-[13px] cursor-pointer transition-all duration-150 hover:border-[color:var(--accent)] hover:text-[color:var(--accent)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-[color:var(--border)] disabled:hover:text-[color:var(--text-secondary)]"
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
