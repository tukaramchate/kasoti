import React, { useState, useEffect, useCallback } from "react";
import { dashboardAPI } from "../../api";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { FiBookOpen, FiUsers, FiCheckCircle, FiTrendingUp, FiClock, FiBarChart2, FiArrowLeft, FiChevronRight } from "react-icons/fi";
import "./Dashboard.css";
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
    if (score >= 80) return "high";
    if (score >= 50) return "medium";
    return "low";
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <span className="loading-text">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-top-bar">
        <PageHeader title="Teacher Dashboard" />
        <Link to="/home" className="dashboard-back-link">
          <FiArrowLeft /> Back to Home
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="dashboard-stats-grid">
        <div className="dash-stat-card">
          <div className="dash-stat-icon" style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)" }}>
            <FiBookOpen />
          </div>
          <div className="dash-stat-info">
            <span className="dash-stat-value">{stats?.totalQuizzes || 0}</span>
            <span className="dash-stat-label">Total Quizzes</span>
          </div>
        </div>

        <div className="dash-stat-card">
          <div className="dash-stat-icon" style={{ backgroundColor: "var(--success-light)", color: "var(--success)" }}>
            <FiCheckCircle />
          </div>
          <div className="dash-stat-info">
            <span className="dash-stat-value">{stats?.totalPublished || 0}</span>
            <span className="dash-stat-label">Published</span>
          </div>
        </div>

        <div className="dash-stat-card">
          <div className="dash-stat-icon" style={{ backgroundColor: "var(--warning-light)", color: "var(--warning)" }}>
            <FiUsers />
          </div>
          <div className="dash-stat-info">
            <span className="dash-stat-value">{stats?.totalAttempts || 0}</span>
            <span className="dash-stat-label">Total Attempts</span>
          </div>
        </div>

        <div className="dash-stat-card">
          <div className="dash-stat-icon" style={{ backgroundColor: "var(--danger-light)", color: "var(--danger)" }}>
            <FiTrendingUp />
          </div>
          <div className="dash-stat-info">
            <span className="dash-stat-value">{stats?.averageScore != null ? `${Math.round(stats.averageScore)}%` : "-"}</span>
            <span className="dash-stat-label">Avg Score</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* My Quizzes */}
        <div className="dashboard-section">
          <div className="section-header-row">
            <h3><FiBarChart2 /> My Quizzes</h3>
            <Link to="/home" className="see-all-link">See All <FiChevronRight /></Link>
          </div>

          <div className="dashboard-table-wrap">
            {quizStats.length === 0 ? (
              <p className="dashboard-empty">No quizzes created yet.</p>
            ) : (
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Quiz</th>
                    <th>Status</th>
                    <th>Students</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {quizStats.map((quiz) => (
                    <tr key={quiz.id}>
                      <td className="quiz-title-cell">
                        <span className="quiz-title-text">{quiz.title}</span>
                        <span className="quiz-category-tag">{quiz.category}</span>
                      </td>
                      <td>
                        <span className={`status-badge status-${(quiz.status || "DRAFT").toLowerCase()}`}>
                          {quiz.status || "DRAFT"}
                        </span>
                      </td>
                      <td>{quiz.totalAttempts || quiz.attemptCount || 0}</td>
                      <td>
                        <button className="table-action-btn" onClick={() => navigate(`/quiz/${quiz.id}/students`)}>
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
        <div className="dashboard-section">
          <h3><FiClock /> Recent Activity</h3>

          <div className="recent-activity-list">
            {recentAttempts.length === 0 ? (
              <p className="dashboard-empty">No activity yet.</p>
            ) : (
              recentAttempts.map((attempt, idx) => (
                <div key={attempt.id || idx} className="activity-item">
                  <div className="activity-avatar">
                    {(attempt.user?.username || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="activity-details">
                    <span className="activity-name">{attempt.user?.name || attempt.user?.username || "Student"}</span>
                    <span className="activity-meta">
                      {attempt.quiz?.title || "Quiz"} &bull; {formatTime(attempt.timeTakenSeconds)}
                    </span>
                  </div>
                  <div className={`activity-score-badge ${getScoreClass(attempt.score)}`}>
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
