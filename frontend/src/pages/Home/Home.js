import React, { useState, useEffect, useCallback, useMemo } from "react";
import { quizAPI } from "../../api";
import { useAuth } from "../../context/UserContext";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FiSearch, FiChevronLeft, FiChevronRight, FiFilter, FiX, FiChevronDown, FiChevronUp } from "react-icons/fi";

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
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [selectedTag, setSelectedTag] = useState('');
  const [availableTags, setAvailableTags] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery);
  const [categories, setCategories] = useState(['All']);
  const [showFilters, setShowFilters] = useState(true);
  const [showAllTags, setShowAllTags] = useState(false);
  const MAX_VISIBLE_TAGS = 20;

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
    const fetchTags = async () => {
      try {
        const response = await quizAPI.getTags();
        setAvailableTags(response.data || []);
      } catch (error) {
        console.error("Error fetching tags:", error);
      }
    };
    fetchCategories();
    fetchTags();
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
      const response = await quizAPI.getAllQuizzes(page, pageSize, debouncedSearch, selectedCategory, selectedDifficulty, selectedTag);

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
  }, [page, debouncedSearch, selectedCategory, selectedDifficulty, selectedTag]);

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  // Reset to first page when search or category changes
  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, selectedCategory, selectedDifficulty, selectedTag]);


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

  // Filter helpers
  const activeFilterCount = (selectedCategory !== 'All' ? 1 : 0) + (selectedDifficulty !== 'All' ? 1 : 0) + (selectedTag ? 1 : 0);
  const visibleTags = useMemo(() => showAllTags ? availableTags : availableTags.slice(0, MAX_VISIBLE_TAGS), [showAllTags, availableTags, MAX_VISIBLE_TAGS]);

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

        {/* Filters */}
        <div className="mb-6">
          {/* Filter Toggle Bar */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setShowFilters(f => !f)}
              className="flex items-center gap-2 text-[13px] font-medium text-[color:var(--text-secondary)] hover:text-[color:var(--accent)] transition-colors duration-150 cursor-pointer bg-transparent border-none p-0"
            >
              <FiFilter className="text-sm" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="inline-flex items-center justify-center h-[18px] min-w-[18px] px-1 rounded-full bg-[color:var(--accent)] text-white text-[10px] font-bold leading-none">
                  {activeFilterCount}
                </span>
              )}
              {showFilters ? <FiChevronUp className="text-xs" /> : <FiChevronDown className="text-xs" />}
            </button>

            {activeFilterCount > 0 && (
              <button
                onClick={() => { setSelectedCategory('All'); setSelectedDifficulty('All'); setSelectedTag(''); }}
                className="flex items-center gap-1 text-[11px] text-[color:var(--text-muted)] hover:text-red-400 transition-colors duration-150 cursor-pointer bg-transparent border-none p-0"
              >
                <FiX className="text-xs" />
                Clear all
              </button>
            )}
          </div>

          {/* Active Filter Pills (always visible when filters are applied) */}
          {!showFilters && activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {selectedCategory !== 'All' && (
                <span className="inline-flex items-center gap-1 py-1 px-2.5 rounded-full bg-[color:var(--accent)]/15 text-[color:var(--accent)] text-[11px] font-medium">
                  {selectedCategory}
                  <FiX className="text-[10px] cursor-pointer hover:text-white" onClick={() => setSelectedCategory('All')} />
                </span>
              )}
              {selectedDifficulty !== 'All' && (
                <span className="inline-flex items-center gap-1 py-1 px-2.5 rounded-full bg-[color:var(--accent)]/15 text-[color:var(--accent)] text-[11px] font-medium">
                  {selectedDifficulty.charAt(0) + selectedDifficulty.slice(1).toLowerCase()}
                  <FiX className="text-[10px] cursor-pointer hover:text-white" onClick={() => setSelectedDifficulty('All')} />
                </span>
              )}
              {selectedTag && (
                <span className="inline-flex items-center gap-1 py-1 px-2.5 rounded-full bg-[color:var(--accent)]/15 text-[color:var(--accent)] text-[11px] font-medium">
                  #{selectedTag}
                  <FiX className="text-[10px] cursor-pointer hover:text-white" onClick={() => setSelectedTag('')} />
                </span>
              )}
            </div>
          )}

          {/* Expandable Filter Panel */}
          {showFilters && (
            <div className="bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-xl overflow-hidden">
              {/* Category Section */}
              <div className="p-4 pb-3">
                <span className="text-[11px] uppercase tracking-wider text-[color:var(--text-muted)] font-semibold mb-2.5 block">Category</span>
                <div className="flex flex-wrap gap-1.5">
                  {categories.map((category) => (
                    <button
                      key={category}
                      className={`py-1.5 px-3 border rounded-full font-sans text-[11px] font-medium cursor-pointer transition-all duration-150 ${selectedCategory === category
                        ? 'bg-[color:var(--accent)] text-white border-[color:var(--accent)] shadow-[0_0_8px_var(--accent-light)]'
                        : 'bg-transparent border-[color:var(--border)] text-[color:var(--text-secondary)] hover:border-[color:var(--accent)] hover:text-[color:var(--accent)] hover:bg-[color:var(--accent)]/5'
                        }`}
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-px bg-[color:var(--border)] mx-4" />

              {/* Difficulty Section */}
              <div className="p-4 pb-3">
                <span className="text-[11px] uppercase tracking-wider text-[color:var(--text-muted)] font-semibold mb-2.5 block">Difficulty</span>
                <div className="flex gap-1.5">
                  {['All', 'EASY', 'MEDIUM', 'HARD'].map((d) => {
                    const difficultyColors = {
                      'EASY': selectedDifficulty === d ? 'bg-emerald-500 border-emerald-500 text-white shadow-[0_0_8px_rgba(16,185,129,0.3)]' : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10',
                      'MEDIUM': selectedDifficulty === d ? 'bg-amber-500 border-amber-500 text-white shadow-[0_0_8px_rgba(245,158,11,0.3)]' : 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10',
                      'HARD': selectedDifficulty === d ? 'bg-red-500 border-red-500 text-white shadow-[0_0_8px_rgba(239,68,68,0.3)]' : 'border-red-500/30 text-red-400 hover:bg-red-500/10',
                    };
                    const isAll = d === 'All';
                    const colorClass = isAll
                      ? (selectedDifficulty === d ? 'bg-[color:var(--accent)] text-white border-[color:var(--accent)]' : 'bg-transparent border-[color:var(--border)] text-[color:var(--text-secondary)] hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]')
                      : difficultyColors[d];
                    return (
                      <button
                        key={d}
                        className={`py-1.5 px-3.5 border rounded-full font-sans text-[11px] font-semibold cursor-pointer transition-all duration-150 ${colorClass}`}
                        onClick={() => setSelectedDifficulty(d)}
                      >
                        {isAll ? 'All' : d.charAt(0) + d.slice(1).toLowerCase()}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tags Section */}
              {availableTags.length > 0 && (
                <>
                  <div className="h-px bg-[color:var(--border)] mx-4" />
                  <div className="p-4 pb-3">
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-[11px] uppercase tracking-wider text-[color:var(--text-muted)] font-semibold">
                        Tags
                        <span className="ml-1.5 text-[10px] normal-case tracking-normal font-normal opacity-60">
                          ({availableTags.length})
                        </span>
                      </span>
                      {availableTags.length > MAX_VISIBLE_TAGS && (
                        <button
                          onClick={() => setShowAllTags(v => !v)}
                          className="text-[11px] text-[color:var(--accent)] hover:underline cursor-pointer bg-transparent border-none p-0 font-medium"
                        >
                          {showAllTags ? 'Show less' : `Show all ${availableTags.length}`}
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        className={`py-1 px-2.5 border rounded-full font-sans text-[11px] font-medium cursor-pointer transition-all duration-150 ${!selectedTag
                          ? 'bg-[color:var(--accent)] text-white border-[color:var(--accent)]'
                          : 'bg-transparent border-[color:var(--border)] text-[color:var(--text-secondary)] hover:border-[color:var(--accent)] hover:text-[color:var(--accent)] hover:bg-[color:var(--accent)]/5'
                          }`}
                        onClick={() => setSelectedTag('')}
                      >
                        All
                      </button>
                      {visibleTags.map((tag) => (
                        <button
                          key={tag}
                          className={`py-1 px-2.5 border rounded-full font-sans text-[11px] font-medium cursor-pointer transition-all duration-150 ${selectedTag === tag
                            ? 'bg-[color:var(--accent)] text-white border-[color:var(--accent)] shadow-[0_0_8px_var(--accent-light)]'
                            : 'bg-transparent border-[color:var(--border)] text-[color:var(--text-secondary)] hover:border-[color:var(--accent)] hover:text-[color:var(--accent)] hover:bg-[color:var(--accent)]/5'
                            }`}
                          onClick={() => setSelectedTag(tag)}
                        >
                          #{tag}
                        </button>
                      ))}
                      {!showAllTags && availableTags.length > MAX_VISIBLE_TAGS && (
                        <span className="py-1 px-2 text-[11px] text-[color:var(--text-muted)]">
                          +{availableTags.length - MAX_VISIBLE_TAGS} more
                        </span>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
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
