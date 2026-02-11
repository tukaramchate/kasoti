import React, { useState, useEffect, useCallback } from "react";
import { dashboardAPI } from "../../api";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { FiBookOpen, FiUsers, FiCheckCircle, FiTrendingUp, FiClock, FiBarChart2, FiArrowLeft, FiChevronRight, FiLock } from "react-icons/fi";
import PageHeader from "../../components/PageHeader";

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentAttempts, setRecentAttempts] = useState([]);
  const [quizStats, setQuizStats] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [statsRes, attemptsRes, quizzesRes] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getRecentAttempts(10),
        dashboardAPI.getQuizzes(0, 5),
      ]);

      setStats(statsRes.data);
      setRecentAttempts(attemptsRes.data || []);

      const quizList = quizzesRes.data?.content || quizzesRes.data || [];
      setQuizStats(quizList);
    } catch (error) {
      console.error("Error fetching dashboard:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const formatTime = (seconds) => {
    if (!seconds) return "-";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getScoreClass = (score) => {
    if (score >= 80) return "bg-[color:var(--success-light)] text-[color:var(--success)]";
    if (score >= 50) return "bg-[color:var(--warning-light)] text-[color:var(--warning)]";
    return "bg-[color:var(--danger-light)] text-[color:var(--danger)]";
  };

  const getStatusClass = (status) => {
    const s = (status || "DRAFT").toLowerCase();
    if (s === "published") return "bg-[color:var(--success-light)] text-[color:var(--success)]";
    if (s === "closed") return "bg-[color:var(--danger-light)] text-[color:var(--danger)]";
    return "bg-[color:var(--bg-hover)] text-[color:var(--text-secondary)]";
  };

  if (loading) {
    return (
      <div className="max-w-[1200px] mx-auto px-5 py-6">
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
          <div className="w-9 h-9 border-[3px] border-[color:var(--border)] border-t-[color:var(--accent)] rounded-full animate-spin"></div>
          <span className="text-[color:var(--text-muted)] text-sm">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-5 py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
        <PageHeader title="Teacher Dashboard" />
        <Link to="/home" className="flex items-center gap-1.5 text-[color:var(--text-secondary)] no-underline text-sm font-medium transition-all duration-150 hover:text-[color:var(--accent)]">
          <FiArrowLeft /> Back to Home
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        <div className="flex items-center gap-3.5 bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-lg p-5 shadow-sm">
          <div className="w-11 h-11 rounded flex items-center justify-center text-xl flex-shrink-0 bg-[color:var(--accent-light)] text-[color:var(--accent)]">
            <FiBookOpen />
          </div>
          <div className="flex flex-col">
            <span className="text-[22px] font-bold text-[color:var(--text-primary)] leading-tight">{stats?.totalQuizzes || 0}</span>
            <span className="text-[13px] text-[color:var(--text-secondary)]">Total Quizzes</span>
          </div>
        </div>

        <div className="flex items-center gap-3.5 bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-lg p-5 shadow-sm">
          <div className="w-11 h-11 rounded flex items-center justify-center text-xl flex-shrink-0 bg-[color:var(--success-light)] text-[color:var(--success)]">
            <FiCheckCircle />
          </div>
          <div className="flex flex-col">
            <span className="text-[22px] font-bold text-[color:var(--text-primary)] leading-tight">{stats?.publishedQuizzes || 0}</span>
            <span className="text-[13px] text-[color:var(--text-secondary)]">Published</span>
          </div>
        </div>

        <div className="flex items-center gap-3.5 bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-lg p-5 shadow-sm">
          <div className="w-11 h-11 rounded flex items-center justify-center text-xl flex-shrink-0 bg-[color:var(--warning-light)] text-[color:var(--warning)]">
            <FiUsers />
          </div>
          <div className="flex flex-col">
            <span className="text-[22px] font-bold text-[color:var(--text-primary)] leading-tight">{stats?.totalAttempts || 0}</span>
            <span className="text-[13px] text-[color:var(--text-secondary)]">Total Attempts</span>
          </div>
        </div>

        <div className="flex items-center gap-3.5 bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-lg p-5 shadow-sm">
          <div className="w-11 h-11 rounded flex items-center justify-center text-xl flex-shrink-0 bg-[color:var(--danger-light)] text-[color:var(--danger)]">
            <FiTrendingUp />
          </div>
          <div className="flex flex-col">
            <span className="text-[22px] font-bold text-[color:var(--text-primary)] leading-tight">{stats?.averageScore != null ? `${Math.round(stats.averageScore)}%` : "-"}</span>
            <span className="text-[13px] text-[color:var(--text-secondary)]">Avg Score</span>
          </div>
        </div>
      </div>

      {/* Draft & Closed Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-7">
        <div className="flex items-center gap-3.5 bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-lg p-5 shadow-sm">
          <div className="w-11 h-11 rounded flex items-center justify-center text-xl flex-shrink-0 bg-[color:var(--bg-hover)] text-[color:var(--text-secondary)]">
            <FiBookOpen />
          </div>
          <div className="flex flex-col">
            <span className="text-[22px] font-bold text-[color:var(--text-primary)] leading-tight">{stats?.draftQuizzes || 0}</span>
            <span className="text-[13px] text-[color:var(--text-secondary)]">Drafts</span>
          </div>
        </div>
        <div className="flex items-center gap-3.5 bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-lg p-5 shadow-sm">
          <div className="w-11 h-11 rounded flex items-center justify-center text-xl flex-shrink-0 bg-[color:var(--danger-light)] text-[color:var(--danger)]">
            <FiLock />
          </div>
          <div className="flex flex-col">
            <span className="text-[22px] font-bold text-[color:var(--text-primary)] leading-tight">{stats?.closedQuizzes || 0}</span>
            <span className="text-[13px] text-[color:var(--text-secondary)]">Closed</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-5">
        {/* My Quizzes */}
        <div className="bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-lg p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-semibold text-[color:var(--text-primary)] flex items-center gap-2">
              <FiBarChart2 /> My Quizzes
            </h3>
            <Link to="/home" className="text-[13px] text-[color:var(--accent)] no-underline font-medium flex items-center gap-1 hover:underline">
              See All <FiChevronRight />
            </Link>
          </div>

          <div className="overflow-x-auto">
            {quizStats.length === 0 ? (
              <p className="text-center text-[color:var(--text-muted)] py-8 text-sm">No quizzes created yet.</p>
            ) : (
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="text-left py-2.5 px-3 font-semibold text-xs uppercase tracking-wide text-[color:var(--text-muted)] border-b border-[color:var(--border)]">Quiz</th>
                    <th className="text-left py-2.5 px-3 font-semibold text-xs uppercase tracking-wide text-[color:var(--text-muted)] border-b border-[color:var(--border)]">Status</th>
                    <th className="text-left py-2.5 px-3 font-semibold text-xs uppercase tracking-wide text-[color:var(--text-muted)] border-b border-[color:var(--border)]">Students</th>
                    <th className="text-left py-2.5 px-3 font-semibold text-xs uppercase tracking-wide text-[color:var(--text-muted)] border-b border-[color:var(--border)]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {quizStats.map((quiz) => (
                    <tr key={quiz.id} className="hover:bg-[color:var(--bg-hover)]">
                      <td className="py-3 px-3 border-b border-[color:var(--border-light)] text-[color:var(--text-primary)]">
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{quiz.title}</span>
                          <span className="text-[11px] text-[color:var(--text-muted)]">{quiz.category}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 border-b border-[color:var(--border-light)] text-[color:var(--text-primary)]">
                        <span className={`inline-block py-0.5 px-2.5 rounded-full text-[11px] font-semibold uppercase tracking-wide ${getStatusClass(quiz.status)}`}>
                          {quiz.status || "DRAFT"}
                        </span>
                      </td>
                      <td className="py-3 px-3 border-b border-[color:var(--border-light)] text-[color:var(--text-primary)]">{quiz.totalAttempts || quiz.attemptCount || 0}</td>
                      <td className="py-3 px-3 border-b border-[color:var(--border-light)] text-[color:var(--text-primary)]">
                        <button
                          className="bg-none border border-[color:var(--border)] rounded py-1 px-3 text-xs text-[color:var(--accent)] cursor-pointer flex items-center gap-1 font-medium transition-all duration-150 hover:bg-[color:var(--accent-light)] hover:border-[color:var(--accent)]"
                          onClick={() => navigate(`/quiz/${quiz.id}/students`)}
                        >
                          View <FiChevronRight />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-lg p-5 shadow-sm">
          <h3 className="text-base font-semibold text-[color:var(--text-primary)] mb-4 flex items-center gap-2">
            <FiClock /> Recent Activity
          </h3>

          <div className="flex flex-col">
            {recentAttempts.length === 0 ? (
              <p className="text-center text-[color:var(--text-muted)] py-8 text-sm">No activity yet.</p>
            ) : (
              recentAttempts.map((attempt, idx) => (
                <div key={attempt.id || idx} className="flex items-center gap-3 py-3 border-b border-[color:var(--border-light)] last:border-b-0">
                  <div className="w-9 h-9 rounded-full bg-[color:var(--accent-light)] text-[color:var(--accent)] flex items-center justify-center font-semibold text-sm flex-shrink-0">
                    {(attempt.user?.username || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 flex flex-col min-w-0">
                    <span className="font-medium text-sm text-[color:var(--text-primary)]">{attempt.user?.name || attempt.user?.username || "Student"}</span>
                    <span className="text-xs text-[color:var(--text-muted)]">
                      {attempt.quiz?.title || "Quiz"} &bull; {formatTime(attempt.timeTakenSeconds)}
                    </span>
                  </div>
                  <div className={`py-1 px-2.5 rounded-full text-xs font-semibold flex-shrink-0 ${getScoreClass(attempt.score)}`}>
                    {attempt.score}%
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
