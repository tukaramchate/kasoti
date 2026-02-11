import React, { useState, useEffect, useCallback } from "react";
import { adminAPI } from "../../api";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FiUsers, FiBookOpen, FiBarChart2, FiTrash2,
  FiArrowLeft, FiChevronLeft, FiChevronRight
} from "react-icons/fi";
import "./Admin.css";
import PageHeader from "../../components/PageHeader";

const TABS = [
  { key: "stats", label: "Overview", icon: <FiBarChart2 /> },
  { key: "users", label: "Users", icon: <FiUsers /> },
  { key: "quizzes", label: "Quizzes", icon: <FiBookOpen /> },
];

const Admin = () => {
  const [tab, setTab] = useState("stats");

  // Stats
  const [stats, setStats] = useState(null);

  // Users
  const [users, setUsers] = useState([]);
  const [userPage, setUserPage] = useState(0);
  const [userTotalPages, setUserTotalPages] = useState(0);
  const [roleFilter, setRoleFilter] = useState("ALL");

  // Quizzes
  const [quizzes, setQuizzes] = useState([]);
  const [quizPage, setQuizPage] = useState(0);
  const [quizTotalPages, setQuizTotalPages] = useState(0);

  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const res = await adminAPI.getStats();
      setStats(res.data);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      let res;
      if (roleFilter === "ALL") {
        res = await adminAPI.getUsers(userPage, 15);
      } else {
        res = await adminAPI.getUsersByRole(roleFilter, userPage, 15);
      }
      const data = res.data;
      setUsers(data.content || data || []);
      setUserTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [userPage, roleFilter]);

  const fetchQuizzes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getQuizzes(quizPage, 15);
      const data = res.data;
      setQuizzes(data.content || data || []);
      setQuizTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      toast.error("Failed to load quizzes");
    } finally {
      setLoading(false);
    }
  }, [quizPage]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (tab === "users") fetchUsers();
  }, [tab, fetchUsers]);

  useEffect(() => {
    if (tab === "quizzes") fetchQuizzes();
  }, [tab, fetchQuizzes]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await adminAPI.updateUserRole(userId, newRole);
      toast.success("Role updated successfully");
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update role");
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`Delete user "${username}"? This cannot be undone.`)) return;
    try {
      await adminAPI.deleteUser(userId);
      toast.success("User deleted");
      fetchUsers();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete user");
    }
  };

  const handleDeleteQuiz = async (quizId, title) => {
    if (!window.confirm(`Delete quiz "${title}"? This cannot be undone.`)) return;
    try {
      await adminAPI.deleteQuiz(quizId);
      toast.success("Quiz deleted");
      fetchQuizzes();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete quiz");
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-top-bar">
        <PageHeader title="Admin Panel" />
        <Link to="/home" className="admin-back-link">
          <FiArrowLeft /> Back to Home
        </Link>
      </div>

      {/* Tab Navigation */}
      <div className="admin-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`admin-tab ${tab === t.key ? "active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === "stats" && (
        <div className="admin-stats-section">
          <div className="admin-stats-grid">
            <div className="admin-stat-card">
              <span className="admin-stat-value">{stats?.totalUsers || 0}</span>
              <span className="admin-stat-label">Total Users</span>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-value">{stats?.totalStudents || 0}</span>
              <span className="admin-stat-label">Students</span>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-value">{stats?.totalTeachers || 0}</span>
              <span className="admin-stat-label">Teachers</span>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-value">{stats?.totalAdmins || 0}</span>
              <span className="admin-stat-label">Admins</span>
            </div>
          </div>

          <div className="admin-stats-grid" style={{ marginTop: "16px" }}>
            <div className="admin-stat-card">
              <span className="admin-stat-value">{stats?.totalQuizzes || 0}</span>
              <span className="admin-stat-label">Total Quizzes</span>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-value">{stats?.totalPublished || 0}</span>
              <span className="admin-stat-label">Published</span>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-value">{stats?.totalAttempts || 0}</span>
              <span className="admin-stat-label">Total Attempts</span>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-value">
                {stats?.averageScore != null ? `${Math.round(stats.averageScore)}%` : "-"}
              </span>
              <span className="admin-stat-label">Avg Score</span>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {tab === "users" && (
        <div className="admin-section">
          <div className="admin-section-header">
            <div className="role-filter">
              {["ALL", "STUDENT", "TEACHER", "ADMIN"].map((r) => (
                <button
                  key={r}
                  className={`role-filter-btn ${roleFilter === r ? "active" : ""}`}
                  onClick={() => { setRoleFilter(r); setUserPage(0); }}
                >
                  {r === "ALL" ? "All" : r.charAt(0) + r.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="loading-container"><div className="spinner"></div></div>
          ) : (
            <>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr><td colSpan="4" className="table-empty">No users found</td></tr>
                    ) : (
                      users.map((u) => (
                        <tr key={u.id}>
                          <td>
                            <div className="user-cell">
                              <div className="user-cell-avatar">
                                {(u.username || "?").charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <span className="user-cell-name">{u.name || u.username}</span>
                                <span className="user-cell-username">@{u.username}</span>
                              </div>
                            </div>
                          </td>
                          <td className="user-cell-email">{u.email}</td>
                          <td>
                            <select
                              className="role-select"
                              value={u.role}
                              onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            >
                              <option value="STUDENT">Student</option>
                              <option value="TEACHER">Teacher</option>
                              <option value="ADMIN">Admin</option>
                            </select>
                          </td>
                          <td>
                            <button
                              className="delete-btn-sm"
                              onClick={() => handleDeleteUser(u.id, u.username)}
                              title="Delete user"
                            >
                              <FiTrash2 />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {userTotalPages > 1 && (
                <div className="admin-pagination">
                  <button
                    className="pagination-btn"
                    onClick={() => setUserPage((p) => Math.max(0, p - 1))}
                    disabled={userPage === 0}
                  >
                    <FiChevronLeft /> Prev
                  </button>
                  <span className="pagination-info">
                    Page {userPage + 1} of {userTotalPages}
                  </span>
                  <button
                    className="pagination-btn"
                    onClick={() => setUserPage((p) => Math.min(userTotalPages - 1, p + 1))}
                    disabled={userPage >= userTotalPages - 1}
                  >
                    Next <FiChevronRight />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Quizzes Tab */}
      {tab === "quizzes" && (
        <div className="admin-section">
          {loading ? (
            <div className="loading-container"><div className="spinner"></div></div>
          ) : (
            <>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Quiz</th>
                      <th>Creator</th>
                      <th>Status</th>
                      <th>Questions</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quizzes.length === 0 ? (
                      <tr><td colSpan="5" className="table-empty">No quizzes found</td></tr>
                    ) : (
                      quizzes.map((q) => (
                        <tr key={q.id}>
                          <td>
                            <div className="quiz-cell">
                              <span className="quiz-cell-title">{q.title}</span>
                              <span className="quiz-cell-category">{q.category}</span>
                            </div>
                          </td>
                          <td>{q.creatorUsername || q.createdBy?.username || "-"}</td>
                          <td>
                            <span className={`status-badge status-${(q.status || "DRAFT").toLowerCase()}`}>
                              {q.status || "DRAFT"}
                            </span>
                          </td>
                          <td>{q.questionCount || q.questions?.length || 0}</td>
                          <td>
                            <button
                              className="delete-btn-sm"
                              onClick={() => handleDeleteQuiz(q.id, q.title)}
                              title="Delete quiz"
                            >
                              <FiTrash2 />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {quizTotalPages > 1 && (
                <div className="admin-pagination">
                  <button
                    className="pagination-btn"
                    onClick={() => setQuizPage((p) => Math.max(0, p - 1))}
                    disabled={quizPage === 0}
                  >
                    <FiChevronLeft /> Prev
                  </button>
                  <span className="pagination-info">
                    Page {quizPage + 1} of {quizTotalPages}
                  </span>
                  <button
                    className="pagination-btn"
                    onClick={() => setQuizPage((p) => Math.min(quizTotalPages - 1, p + 1))}
                    disabled={quizPage >= quizTotalPages - 1}
                  >
                    Next <FiChevronRight />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Admin;
