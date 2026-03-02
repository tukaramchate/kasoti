import React, { useState, useEffect, useCallback } from "react";
import { dashboardAPI } from "../../api";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { FiBookOpen, FiUsers, FiCheckCircle, FiTrendingUp, FiClock, FiBarChart2, FiChevronRight, FiLock, FiX, FiPieChart } from "react-icons/fi";
import { formatTime, getScoreClass } from "../../utils/styles";

const StatCard = ({ icon, label, value, colorClass, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4, ease: "easeOut" }}
    className="flex items-center gap-3.5 bg-[color:var(--bg-card)]/80 backdrop-blur-lg border border-[color:var(--border)] rounded-2xl p-5 shadow-sm hover:shadow-glow hover:-translate-y-1 transition-all duration-300 hover:border-[color:var(--accent-subtle)] group relative overflow-hidden"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-[color:var(--accent)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0 relative z-10 ${colorClass}`}>{icon}</div>
    <div className="flex flex-col relative z-10">
      <span className="text-[24px] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[color:var(--text-primary)] to-[color:var(--text-secondary)] leading-tight">{value}</span>
      <span className="text-[13px] font-medium text-[color:var(--text-secondary)]">{label}</span>
    </div>
  </motion.div>
);

const getStatusClass = (status) => {
  const s = (status || "DRAFT").toLowerCase();
  if (s === "published") return "bg-[color:var(--success-light)] text-[color:var(--success)]";
  if (s === "closed") return "bg-[color:var(--danger-light)] text-[color:var(--danger)]";
  return "bg-[color:var(--bg-hover)] text-[color:var(--text-secondary)]";
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentAttempts, setRecentAttempts] = useState([]);
  const [quizStats, setQuizStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuizStats, setSelectedQuizStats] = useState(null);
  const [statsModalLoading, setStatsModalLoading] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [statsRes, attemptsRes, quizzesRes] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getRecentAttempts(10),
        dashboardAPI.getQuizzes(0, 5),
      ]);
      setStats(statsRes.data);
      setRecentAttempts(attemptsRes.data || []);
      setQuizStats(quizzesRes.data?.content || quizzesRes.data || []);
    } catch (error) {
      console.error("Error fetching dashboard:", error);
      toast.error("Failed to load dashboard data");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  const handleViewQuizStats = async (quizId) => {
    setStatsModalLoading(true);
    try {
      const res = await dashboardAPI.getQuizStats(quizId);
      setSelectedQuizStats(res.data);
    } catch { toast.error("Failed to load quiz stats"); }
    finally { setStatsModalLoading(false); }
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

  const topStats = [
    { icon: <FiBookOpen />, label: "Total Quizzes", value: stats?.totalQuizzes || 0, colorClass: "bg-[color:var(--accent-light)] text-[color:var(--accent)]", delay: 0.1 },
    { icon: <FiCheckCircle />, label: "Published", value: stats?.publishedQuizzes || 0, colorClass: "bg-[color:var(--success-light)] text-[color:var(--success)]", delay: 0.15 },
    { icon: <FiUsers />, label: "Total Attempts", value: stats?.totalAttempts || 0, colorClass: "bg-[color:var(--warning-light)] text-[color:var(--warning)]", delay: 0.2 },
    { icon: <FiTrendingUp />, label: "Avg Score", value: stats?.averageScore != null ? `${Math.round(stats.averageScore)}%` : "-", colorClass: "bg-[color:var(--danger-light)] text-[color:var(--danger)]", delay: 0.25 },
    { icon: <FiBookOpen />, label: "Drafts", value: stats?.draftQuizzes || 0, colorClass: "bg-[color:var(--bg-hover)] text-[color:var(--text-secondary)]", delay: 0.3 },
    { icon: <FiLock />, label: "Closed", value: stats?.closedQuizzes || 0, colorClass: "bg-[color:var(--danger-light)] text-[color:var(--danger)]", delay: 0.35 },
  ];

  return (
    <div className="max-w-[1200px] mx-auto px-5 py-6 relative">
      {/* Subtle top gradient */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-[color:var(--accent)]/5 to-transparent pointer-events-none -z-10" />

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-7">
        <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[color:var(--text-primary)] to-[color:var(--text-secondary)] tracking-tight">Teacher Dashboard</h1>
        <p className="text-sm text-[color:var(--text-secondary)] mt-1 font-medium">Overview of your quizzes and student activity</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {topStats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-5">
        {/* My Quizzes Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5 }}
          className="bg-[color:var(--bg-card)]/80 backdrop-blur-lg border border-[color:var(--border)] rounded-2xl p-5 shadow-sm"
        >
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-base font-bold text-[color:var(--text-primary)] flex items-center gap-2">
              <FiBarChart2 className="text-[color:var(--accent)]" /> My Quizzes
            </h3>
            <Link to="/home" className="text-[13px] text-[color:var(--accent)] no-underline font-semibold flex items-center gap-1 hover:underline">
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
                    {["Quiz", "Status", "Students", "Actions"].map((h) => (
                      <th key={h} className="text-left py-2.5 px-3 font-semibold text-xs uppercase tracking-wider text-[color:var(--text-muted)] border-b border-[color:var(--border)]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {quizStats.map((quiz, i) => (
                    <motion.tr
                      key={quiz.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.05 }}
                      className="hover:bg-[color:var(--bg-hover)] transition-colors"
                    >
                      <td className="py-3 px-3 border-b border-[color:var(--border-light)] text-[color:var(--text-primary)]">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-[14px]">{quiz.title}</span>
                          <span className="text-[11px] text-[color:var(--text-muted)]">{quiz.category}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 border-b border-[color:var(--border-light)]">
                        <span className={`inline-block py-0.5 px-2.5 rounded-full text-[11px] font-semibold uppercase tracking-wide ${getStatusClass(quiz.status)}`}>
                          {quiz.status || "DRAFT"}
                        </span>
                      </td>
                      <td className="py-3 px-3 border-b border-[color:var(--border-light)] text-[color:var(--text-primary)] font-medium">
                        {quiz.totalAttempts || quiz.attemptCount || 0}
                      </td>
                      <td className="py-3 px-3 border-b border-[color:var(--border-light)]">
                        <div className="flex gap-2">
                          <button
                            className="border border-[color:var(--border)] rounded-lg py-1 px-3 text-xs text-[color:var(--accent)] cursor-pointer flex items-center gap-1 font-semibold transition-all hover:bg-[color:var(--accent-light)] hover:border-[color:var(--accent)] hover:shadow-sm"
                            onClick={() => handleViewQuizStats(quiz.id)}
                          >
                            <FiBarChart2 size={12} /> Stats
                          </button>
                          <button
                            className="border border-[color:var(--border)] rounded-lg py-1 px-3 text-xs text-[color:var(--accent)] cursor-pointer flex items-center gap-1 font-semibold transition-all hover:bg-[color:var(--accent-light)] hover:border-[color:var(--accent)] hover:shadow-sm"
                            onClick={() => navigate(`/quiz/${quiz.id}/analytics`)}
                          >
                            <FiPieChart size={12} /> Analytics
                          </button>
                          <button
                            className="border border-[color:var(--border)] rounded-lg py-1 px-3 text-xs text-[color:var(--accent)] cursor-pointer flex items-center gap-1 font-semibold transition-all hover:bg-[color:var(--accent-light)] hover:border-[color:var(--accent)] hover:shadow-sm"
                            onClick={() => navigate(`/quiz/${quiz.id}/students`)}
                          >
                            View <FiChevronRight />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.5 }}
          className="bg-[color:var(--bg-card)]/80 backdrop-blur-lg border border-[color:var(--border)] rounded-2xl p-5 shadow-sm"
        >
          <h3 className="text-base font-bold text-[color:var(--text-primary)] mb-5 flex items-center gap-2">
            <FiClock className="text-[color:var(--accent)]" /> Recent Activity
          </h3>

          <div className="flex flex-col">
            {recentAttempts.length === 0 ? (
              <p className="text-center text-[color:var(--text-muted)] py-8 text-sm">No activity yet.</p>
            ) : (
              recentAttempts.map((attempt, idx) => (
                <motion.div
                  key={attempt.id || idx}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + idx * 0.04 }}
                  className="flex items-center gap-3 py-3 border-b border-[color:var(--border-light)] last:border-b-0"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[color:var(--accent)] to-purple-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {(attempt.username || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 flex flex-col min-w-0">
                    <span className="font-semibold text-sm text-[color:var(--text-primary)] truncate">{attempt.username || "Student"}</span>
                    <span className="text-xs text-[color:var(--text-muted)] truncate">
                      {attempt.quizTitle || "Quiz"} &bull; {formatTime(attempt.timeTakenSeconds)}
                    </span>
                  </div>
                  <div className={`py-1 px-2.5 rounded-full text-xs font-bold flex-shrink-0 ${getScoreClass(attempt.score)}`}>
                    {attempt.score}%
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* Quiz Stats Modal */}
      <AnimatePresence>
        {(selectedQuizStats || statsModalLoading) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => !statsModalLoading && setSelectedQuizStats(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="bg-[color:var(--bg-card)]/90 backdrop-blur-2xl border border-[color:var(--border)] rounded-2xl w-full max-w-[500px] p-6 shadow-glass max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {statsModalLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-[color:var(--accent)] border-t-transparent rounded-full animate-spin mb-3" />
                  <span className="text-sm text-[color:var(--text-muted)]">Loading stats...</span>
                </div>
              ) : selectedQuizStats && (
                <>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-[color:var(--text-primary)] mb-1">{selectedQuizStats.quizTitle || "Quiz Stats"}</h3>
                      <p className="text-xs text-[color:var(--text-muted)] font-medium">Detailed analytics</p>
                    </div>
                    <button
                      onClick={() => setSelectedQuizStats(null)}
                      className="w-8 h-8 rounded-xl border border-[color:var(--border)] flex items-center justify-center text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)] hover:border-[color:var(--accent)] hover:bg-[color:var(--accent-light)] transition-all"
                    >
                      <FiX size={14} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {[
                      { label: "Total Attempts", value: selectedQuizStats.totalAttempts || 0, color: "text-[color:var(--accent)]" },
                      { label: "Avg Score", value: selectedQuizStats.averageScore != null ? `${Math.round(selectedQuizStats.averageScore)}%` : "-", color: "text-[color:var(--success)]" },
                      { label: "Highest", value: selectedQuizStats.highestScore != null ? `${selectedQuizStats.highestScore}%` : "-", color: "text-[color:var(--text-primary)]" },
                      { label: "Lowest", value: selectedQuizStats.lowestScore != null ? `${selectedQuizStats.lowestScore}%` : "-", color: "text-[color:var(--danger)]" },
                    ].map((item) => (
                      <motion.div key={item.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        className="bg-[color:var(--bg-primary)] rounded-xl p-4 text-center border border-[color:var(--border)]"
                      >
                        <div className={`text-2xl font-extrabold mb-1 ${item.color}`}>{item.value}</div>
                        <div className="text-[11px] font-medium text-[color:var(--text-muted)]">{item.label}</div>
                      </motion.div>
                    ))}
                  </div>

                  {selectedQuizStats.passRate != null && (
                    <div className="bg-[color:var(--bg-primary)] rounded-xl p-4 text-center border border-[color:var(--border)] mb-4">
                      <div className="text-2xl font-extrabold text-[color:var(--warning)] mb-1">{Math.round(selectedQuizStats.passRate)}%</div>
                      <div className="text-[11px] font-medium text-[color:var(--text-muted)]">Pass Rate</div>
                    </div>
                  )}

                  {selectedQuizStats.averageTimeTaken != null && (
                    <div className="bg-[color:var(--bg-primary)] rounded-xl p-4 text-center border border-[color:var(--border)] mb-5">
                      <div className="text-2xl font-extrabold text-[color:var(--text-primary)] mb-1">{formatTime(selectedQuizStats.averageTimeTaken)}</div>
                      <div className="text-[11px] font-medium text-[color:var(--text-muted)]">Avg Time</div>
                    </div>
                  )}

                  <button
                    onClick={() => setSelectedQuizStats(null)}
                    className="w-full py-3 bg-gradient-to-r from-[color:var(--accent)] to-purple-600 text-white rounded-xl text-sm font-semibold hover:shadow-glow hover:-translate-y-0.5 transition-all duration-300"
                  >
                    Close
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
