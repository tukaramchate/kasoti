import React, { useState, useEffect, useCallback } from "react";
import { adminAPI } from "../../api";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FiUsers, FiBookOpen, FiBarChart2, FiTrash2,
  FiArrowLeft, FiChevronLeft, FiChevronRight, FiActivity,
  FiChevronDown, FiChevronUp
} from "react-icons/fi";
import PageHeader from "../../components/PageHeader";
import ConfirmDialog from "../../components/ConfirmDialog";

const TABS = [
  { key: "stats", label: "Overview", icon: <FiBarChart2 /> },
  { key: "users", label: "Users", icon: <FiUsers /> },
  { key: "quizzes", label: "Quizzes", icon: <FiBookOpen /> },
  { key: "attempts", label: "Attempts", icon: <FiActivity /> },
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

  // Attempts
  const [attempts, setAttempts] = useState([]);
  const [attemptPage, setAttemptPage] = useState(0);
  const [attemptTotalPages, setAttemptTotalPages] = useState(0);

  // Attempt drill-down
  const [expandedAttempt, setExpandedAttempt] = useState(null);
  const [attemptDetail, setAttemptDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Confirm dialog
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null });

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

  const fetchAttempts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getAttempts(attemptPage, 15);
      const data = res.data;
      setAttempts(data.content || data || []);
      setAttemptTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error("Error fetching attempts:", error);
      toast.error("Failed to load attempts");
    } finally {
      setLoading(false);
    }
  }, [attemptPage]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (tab === "users") fetchUsers();
  }, [tab, fetchUsers]);

  useEffect(() => {
    if (tab === "quizzes") fetchQuizzes();
  }, [tab, fetchQuizzes]);

  useEffect(() => {
    if (tab === "attempts") fetchAttempts();
  }, [tab, fetchAttempts]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await adminAPI.updateUserRole(userId, newRole);
      toast.success("Role updated successfully");
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update role");
    }
  };

  const handleDeleteUser = (userId, username) => {
    setConfirmDialog({
      open: true,
      title: 'Delete User',
      message: `Delete user "${username}"? This cannot be undone.`,
      onConfirm: async () => {
        try {
          await adminAPI.deleteUser(userId);
          toast.success("User deleted");
          fetchUsers();
          fetchStats();
        } catch (error) {
          toast.error(error.response?.data?.message || "Failed to delete user");
        }
      },
    });
  };

  const handleDeleteQuiz = (quizId, title) => {
    setConfirmDialog({
      open: true,
      title: 'Delete Quiz',
      message: `Delete quiz "${title}"? This cannot be undone.`,
      onConfirm: async () => {
        try {
          await adminAPI.deleteQuiz(quizId);
          toast.success("Quiz deleted");
          fetchQuizzes();
          fetchStats();
        } catch (error) {
          toast.error(error.response?.data?.message || "Failed to delete quiz");
        }
      },
    });
  };

  const getStatusClass = (status) => {
    const s = (status || "DRAFT").toLowerCase();
    if (s === "published") return "bg-[color:var(--success-light)] text-[color:var(--success)]";
    if (s === "closed") return "bg-[color:var(--danger-light)] text-[color:var(--danger)]";
    return "bg-[color:var(--bg-hover)] text-[color:var(--text-secondary)]";
  };

  const paginationBtnClass = "flex items-center gap-1 py-2 px-4 border border-[color:var(--border)] rounded bg-[color:var(--bg-card)] text-[color:var(--text-primary)] text-[13px] font-medium cursor-pointer transition-all duration-150 hover:border-[color:var(--accent)] hover:text-[color:var(--accent)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-[color:var(--border)] disabled:hover:text-[color:var(--text-primary)]";

  return (
    <div className="max-w-[1200px] mx-auto px-5 py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
        <PageHeader title="Admin Panel" />
        <Link to="/home" className="flex items-center gap-1.5 text-[color:var(--text-secondary)] no-underline text-sm font-medium transition-all duration-150 hover:text-[color:var(--accent)]">
          <FiArrowLeft /> Back to Home
        </Link>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-1 mb-6 bg-[color:var(--bg-secondary)] border border-[color:var(--border)] rounded-lg p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 border-none rounded text-sm font-medium cursor-pointer transition-all duration-150 ${
              tab === t.key
                ? 'bg-[color:var(--accent)] text-white shadow-sm'
                : 'bg-transparent text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:bg-[color:var(--bg-hover)]'
            }`}
            onClick={() => setTab(t.key)}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === "stats" && (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-lg p-6 flex flex-col items-center text-center shadow-sm">
              <span className="text-[28px] font-bold text-[color:var(--accent)] leading-tight">{stats?.totalUsers || 0}</span>
              <span className="text-[13px] text-[color:var(--text-secondary)] mt-1">Total Users</span>
            </div>
            <div className="bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-lg p-6 flex flex-col items-center text-center shadow-sm">
              <span className="text-[28px] font-bold text-[color:var(--accent)] leading-tight">{stats?.totalStudents || 0}</span>
              <span className="text-[13px] text-[color:var(--text-secondary)] mt-1">Students</span>
            </div>
            <div className="bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-lg p-6 flex flex-col items-center text-center shadow-sm">
              <span className="text-[28px] font-bold text-[color:var(--accent)] leading-tight">{stats?.totalTeachers || 0}</span>
              <span className="text-[13px] text-[color:var(--text-secondary)] mt-1">Teachers</span>
            </div>
            <div className="bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-lg p-6 flex flex-col items-center text-center shadow-sm">
              <span className="text-[28px] font-bold text-[color:var(--accent)] leading-tight">{stats?.totalAdmins || 0}</span>
              <span className="text-[13px] text-[color:var(--text-secondary)] mt-1">Admins</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-lg p-6 flex flex-col items-center text-center shadow-sm">
              <span className="text-[28px] font-bold text-[color:var(--accent)] leading-tight">{stats?.totalQuizzes || 0}</span>
              <span className="text-[13px] text-[color:var(--text-secondary)] mt-1">Total Quizzes</span>
            </div>
            <div className="bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-lg p-6 flex flex-col items-center text-center shadow-sm">
              <span className="text-[28px] font-bold text-[color:var(--accent)] leading-tight">{stats?.publishedQuizzes || 0}</span>
              <span className="text-[13px] text-[color:var(--text-secondary)] mt-1">Published</span>
            </div>
            <div className="bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-lg p-6 flex flex-col items-center text-center shadow-sm">
              <span className="text-[28px] font-bold text-[color:var(--accent)] leading-tight">{stats?.draftQuizzes || 0}</span>
              <span className="text-[13px] text-[color:var(--text-secondary)] mt-1">Drafts</span>
            </div>
            <div className="bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-lg p-6 flex flex-col items-center text-center shadow-sm">
              <span className="text-[28px] font-bold text-[color:var(--accent)] leading-tight">{stats?.closedQuizzes || 0}</span>
              <span className="text-[13px] text-[color:var(--text-secondary)] mt-1">Closed</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mt-4">
            <div className="bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-lg p-6 flex flex-col items-center text-center shadow-sm">
              <span className="text-[28px] font-bold text-[color:var(--accent)] leading-tight">{stats?.totalAttempts || 0}</span>
              <span className="text-[13px] text-[color:var(--text-secondary)] mt-1">Total Attempts</span>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {tab === "users" && (
        <div className="bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-lg p-5 shadow-sm">
          <div className="mb-4">
            <div className="flex flex-wrap gap-1 bg-[color:var(--bg-input)] rounded p-0.5">
              {["ALL", "STUDENT", "TEACHER", "ADMIN"].map((r) => (
                <button
                  key={r}
                  className={`py-1.5 px-3.5 border-none rounded-sm text-[13px] font-medium cursor-pointer transition-all duration-150 ${
                    roleFilter === r
                      ? 'bg-[color:var(--bg-card)] text-[color:var(--accent)] shadow-sm'
                      : 'bg-transparent text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]'
                  }`}
                  onClick={() => { setRoleFilter(r); setUserPage(0); }}
                >
                  {r === "ALL" ? "All" : r.charAt(0) + r.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center min-h-[200px]">
              <div className="w-9 h-9 border-[3px] border-[color:var(--border)] border-t-[color:var(--accent)] rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr>
                      <th className="text-left py-2.5 px-3 font-semibold text-xs uppercase tracking-wide text-[color:var(--text-muted)] border-b border-[color:var(--border)]">User</th>
                      <th className="text-left py-2.5 px-3 font-semibold text-xs uppercase tracking-wide text-[color:var(--text-muted)] border-b border-[color:var(--border)] hidden md:table-cell">Email</th>
                      <th className="text-left py-2.5 px-3 font-semibold text-xs uppercase tracking-wide text-[color:var(--text-muted)] border-b border-[color:var(--border)] hidden lg:table-cell">Phone</th>
                      <th className="text-left py-2.5 px-3 font-semibold text-xs uppercase tracking-wide text-[color:var(--text-muted)] border-b border-[color:var(--border)]">Role</th>
                      <th className="text-left py-2.5 px-3 font-semibold text-xs uppercase tracking-wide text-[color:var(--text-muted)] border-b border-[color:var(--border)] hidden lg:table-cell">Joined</th>
                      <th className="text-left py-2.5 px-3 font-semibold text-xs uppercase tracking-wide text-[color:var(--text-muted)] border-b border-[color:var(--border)]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr><td colSpan="6" className="text-center text-[color:var(--text-muted)] py-8 px-3">No users found</td></tr>
                    ) : (
                      users.map((u) => (
                        <tr key={u.id} className="hover:bg-[color:var(--bg-hover)]">
                          <td className="py-3 px-3 border-b border-[color:var(--border-light)] text-[color:var(--text-primary)]">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-[color:var(--accent-light)] text-[color:var(--accent)] flex items-center justify-center font-semibold text-[13px] flex-shrink-0">
                                {(u.username || "?").charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <span className="font-medium block">{u.name || u.username}</span>
                                <span className="text-xs text-[color:var(--text-muted)] block">@{u.username}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 border-b border-[color:var(--border-light)] text-[color:var(--text-secondary)] text-[13px] hidden md:table-cell">{u.email}</td>
                          <td className="py-3 px-3 border-b border-[color:var(--border-light)] text-[color:var(--text-muted)] text-[13px] hidden lg:table-cell">{u.phone || '-'}</td>
                          <td className="py-3 px-3 border-b border-[color:var(--border-light)] text-[color:var(--text-primary)]">
                            <select
                              className="py-1 px-2.5 border border-[color:var(--border)] rounded-sm bg-[color:var(--bg-input)] text-[color:var(--text-primary)] text-[13px] cursor-pointer transition-all duration-150 hover:border-[color:var(--accent)] focus:outline-none focus:border-[color:var(--accent)] focus:shadow-[0_0_0_2px_var(--accent-light)]"
                              value={u.role}
                              onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            >
                              <option value="STUDENT">Student</option>
                              <option value="TEACHER">Teacher</option>
                              <option value="ADMIN">Admin</option>
                            </select>
                          </td>
                          <td className="py-3 px-3 border-b border-[color:var(--border-light)] text-[color:var(--text-muted)] text-[12px] hidden lg:table-cell">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}</td>
                          <td className="py-3 px-3 border-b border-[color:var(--border-light)] text-[color:var(--text-primary)]">
                            <button
                              className="bg-transparent border border-[color:var(--border)] rounded-sm p-1.5 text-[color:var(--text-muted)] cursor-pointer flex items-center transition-all duration-150 hover:text-[color:var(--danger)] hover:border-[color:var(--danger)] hover:bg-[color:var(--danger-light)]"
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
                <div className="flex justify-center items-center gap-4 pt-4">
                  <button
                    className={paginationBtnClass}
                    onClick={() => setUserPage((p) => Math.max(0, p - 1))}
                    disabled={userPage === 0}
                  >
                    <FiChevronLeft /> Prev
                  </button>
                  <span className="text-[13px] text-[color:var(--text-secondary)]">
                    Page {userPage + 1} of {userTotalPages}
                  </span>
                  <button
                    className={paginationBtnClass}
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
        <div className="bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-lg p-5 shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center min-h-[200px]">
              <div className="w-9 h-9 border-[3px] border-[color:var(--border)] border-t-[color:var(--accent)] rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr>
                      <th className="text-left py-2.5 px-3 font-semibold text-xs uppercase tracking-wide text-[color:var(--text-muted)] border-b border-[color:var(--border)]">Quiz</th>
                      <th className="text-left py-2.5 px-3 font-semibold text-xs uppercase tracking-wide text-[color:var(--text-muted)] border-b border-[color:var(--border)] hidden md:table-cell">Creator</th>
                      <th className="text-left py-2.5 px-3 font-semibold text-xs uppercase tracking-wide text-[color:var(--text-muted)] border-b border-[color:var(--border)]">Status</th>
                      <th className="text-left py-2.5 px-3 font-semibold text-xs uppercase tracking-wide text-[color:var(--text-muted)] border-b border-[color:var(--border)]">Questions</th>
                      <th className="text-left py-2.5 px-3 font-semibold text-xs uppercase tracking-wide text-[color:var(--text-muted)] border-b border-[color:var(--border)]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quizzes.length === 0 ? (
                      <tr><td colSpan="5" className="text-center text-[color:var(--text-muted)] py-8 px-3">No quizzes found</td></tr>
                    ) : (
                      quizzes.map((q) => (
                        <tr key={q.id} className="hover:bg-[color:var(--bg-hover)]">
                          <td className="py-3 px-3 border-b border-[color:var(--border-light)] text-[color:var(--text-primary)]">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-medium">{q.title}</span>
                              <span className="text-xs text-[color:var(--text-muted)]">{q.category}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 border-b border-[color:var(--border-light)] text-[color:var(--text-primary)] hidden md:table-cell">{q.creatorUsername || q.createdBy?.username || "-"}</td>
                          <td className="py-3 px-3 border-b border-[color:var(--border-light)] text-[color:var(--text-primary)]">
                            <span className={`inline-block py-0.5 px-2.5 rounded-full text-[11px] font-semibold uppercase tracking-wide ${getStatusClass(q.status)}`}>
                              {q.status || "DRAFT"}
                            </span>
                          </td>
                          <td className="py-3 px-3 border-b border-[color:var(--border-light)] text-[color:var(--text-primary)]">{q.questionCount || q.questions?.length || 0}</td>
                          <td className="py-3 px-3 border-b border-[color:var(--border-light)] text-[color:var(--text-primary)]">
                            <button
                              className="bg-transparent border border-[color:var(--border)] rounded-sm p-1.5 text-[color:var(--text-muted)] cursor-pointer flex items-center transition-all duration-150 hover:text-[color:var(--danger)] hover:border-[color:var(--danger)] hover:bg-[color:var(--danger-light)]"
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
                <div className="flex justify-center items-center gap-4 pt-4">
                  <button
                    className={paginationBtnClass}
                    onClick={() => setQuizPage((p) => Math.max(0, p - 1))}
                    disabled={quizPage === 0}
                  >
                    <FiChevronLeft /> Prev
                  </button>
                  <span className="text-[13px] text-[color:var(--text-secondary)]">
                    Page {quizPage + 1} of {quizTotalPages}
                  </span>
                  <button
                    className={paginationBtnClass}
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

      {/* Attempts Tab */}
      {tab === "attempts" && (
        <div className="bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-lg p-5 shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center min-h-[200px]">
              <div className="w-9 h-9 border-[3px] border-[color:var(--border)] border-t-[color:var(--accent)] rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr>
                      <th className="text-left py-2.5 px-3 font-semibold text-xs uppercase tracking-wide text-[color:var(--text-muted)] border-b border-[color:var(--border)]">Student</th>
                      <th className="text-left py-2.5 px-3 font-semibold text-xs uppercase tracking-wide text-[color:var(--text-muted)] border-b border-[color:var(--border)]">Quiz</th>
                      <th className="text-left py-2.5 px-3 font-semibold text-xs uppercase tracking-wide text-[color:var(--text-muted)] border-b border-[color:var(--border)] hidden md:table-cell">Score</th>
                      <th className="text-left py-2.5 px-3 font-semibold text-xs uppercase tracking-wide text-[color:var(--text-muted)] border-b border-[color:var(--border)] hidden md:table-cell">Marks</th>
                      <th className="text-left py-2.5 px-3 font-semibold text-xs uppercase tracking-wide text-[color:var(--text-muted)] border-b border-[color:var(--border)] hidden md:table-cell">Correct</th>
                      <th className="text-left py-2.5 px-3 font-semibold text-xs uppercase tracking-wide text-[color:var(--text-muted)] border-b border-[color:var(--border)] hidden lg:table-cell">Time</th>
                      <th className="text-left py-2.5 px-3 font-semibold text-xs uppercase tracking-wide text-[color:var(--text-muted)] border-b border-[color:var(--border)] hidden lg:table-cell">Date</th>
                      <th className="text-left py-2.5 px-3 font-semibold text-xs uppercase tracking-wide text-[color:var(--text-muted)] border-b border-[color:var(--border)] w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {attempts.length === 0 ? (
                      <tr><td colSpan="8" className="text-center text-[color:var(--text-muted)] py-8 px-3">No attempts found</td></tr>
                    ) : (
                      attempts.map((a) => (
                        <React.Fragment key={a.attemptId}>
                        <tr className="hover:bg-[color:var(--bg-hover)] cursor-pointer" onClick={async () => {
                          if (expandedAttempt === a.attemptId) {
                            setExpandedAttempt(null);
                            setAttemptDetail(null);
                          } else {
                            setExpandedAttempt(a.attemptId);
                            setDetailLoading(true);
                            try {
                              const res = await adminAPI.getAttemptById(a.attemptId);
                              setAttemptDetail(res.data);
                            } catch { setAttemptDetail(null); }
                            finally { setDetailLoading(false); }
                          }
                        }}>
                          <td className="py-3 px-3 border-b border-[color:var(--border-light)] text-[color:var(--text-primary)]">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-[color:var(--accent-light)] text-[color:var(--accent)] flex items-center justify-center font-semibold text-[13px] flex-shrink-0">
                                {(a.username || "?").charAt(0).toUpperCase()}
                              </div>
                              <span className="font-medium text-[13px]">@{a.username}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 border-b border-[color:var(--border-light)] text-[color:var(--text-primary)] text-[13px]">{a.quizTitle}</td>
                          <td className="py-3 px-3 border-b border-[color:var(--border-light)] text-[color:var(--text-primary)] hidden md:table-cell">
                            <span className={`inline-block py-0.5 px-2.5 rounded-full text-[11px] font-semibold ${a.score >= 60 ? 'bg-[color:var(--success-light)] text-[color:var(--success)]' : 'bg-[color:var(--danger-light)] text-[color:var(--danger)]'}`}>
                              {a.score}%
                            </span>
                          </td>
                          <td className="py-3 px-3 border-b border-[color:var(--border-light)] text-[color:var(--text-secondary)] text-[13px] hidden md:table-cell">
                            {a.marksObtained ?? '-'}/{a.totalMarks ?? '-'}
                          </td>
                          <td className="py-3 px-3 border-b border-[color:var(--border-light)] text-[color:var(--text-secondary)] text-[13px] hidden md:table-cell">
                            {a.correctAnswers}/{a.totalQuestions}
                          </td>
                          <td className="py-3 px-3 border-b border-[color:var(--border-light)] text-[color:var(--text-secondary)] text-[13px] hidden lg:table-cell">
                            {a.timeTakenSeconds ? `${Math.floor(a.timeTakenSeconds / 60)}m ${a.timeTakenSeconds % 60}s` : "-"}
                          </td>
                          <td className="py-3 px-3 border-b border-[color:var(--border-light)] text-[color:var(--text-muted)] text-[13px] hidden lg:table-cell">
                            {a.attemptedAt ? new Date(a.attemptedAt).toLocaleDateString() : "-"}
                          </td>
                          <td className="py-3 px-3 border-b border-[color:var(--border-light)] text-[color:var(--text-muted)]">
                            {expandedAttempt === a.attemptId ? <FiChevronUp /> : <FiChevronDown />}
                          </td>
                        </tr>
                        {expandedAttempt === a.attemptId && (
                          <tr>
                            <td colSpan="8" className="p-0">
                              <div className="bg-[color:var(--bg-secondary)] border-b border-[color:var(--border)] px-5 py-4">
                                {detailLoading ? (
                                  <div className="flex items-center justify-center py-4">
                                    <div className="w-6 h-6 border-2 border-[color:var(--border)] border-t-[color:var(--accent)] rounded-full animate-spin"></div>
                                  </div>
                                ) : attemptDetail?.answers?.length > 0 ? (
                                  <div className="flex flex-col gap-2">
                                    <h4 className="text-sm font-semibold text-[color:var(--text-primary)] mb-1">Answer Details</h4>
                                    {attemptDetail.answers.map((ans, idx) => (
                                      <div key={idx} className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 py-2 px-3 rounded text-[13px] ${ans.isCorrect ? 'bg-[color:var(--success-light)]' : 'bg-[color:var(--danger-light)]'}`}>
                                        <span className="font-medium text-[color:var(--text-primary)] flex-1">Q{idx + 1}: {ans.questionText}</span>
                                        <div className="flex gap-3 text-xs">
                                          <span>Selected: <strong>{ans.selectedOption || 'None'}</strong></span>
                                          <span>Correct: <strong>{ans.correctOption}</strong></span>
                                          <span>{ans.marksObtained}/{ans.maxMarks}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-[color:var(--text-muted)] text-sm">No answer details available.</p>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                        </React.Fragment>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {attemptTotalPages > 1 && (
                <div className="flex justify-center items-center gap-4 pt-4">
                  <button
                    className={paginationBtnClass}
                    onClick={() => setAttemptPage((p) => Math.max(0, p - 1))}
                    disabled={attemptPage === 0}
                  >
                    <FiChevronLeft /> Prev
                  </button>
                  <span className="text-[13px] text-[color:var(--text-secondary)]">
                    Page {attemptPage + 1} of {attemptTotalPages}
                  </span>
                  <button
                    className={paginationBtnClass}
                    onClick={() => setAttemptPage((p) => Math.min(attemptTotalPages - 1, p + 1))}
                    disabled={attemptPage >= attemptTotalPages - 1}
                  >
                    Next <FiChevronRight />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant="danger"
        onConfirm={() => { confirmDialog.onConfirm?.(); setConfirmDialog(d => ({ ...d, open: false })); }}
        onCancel={() => setConfirmDialog(d => ({ ...d, open: false }))}
      />
    </div>
  );
};

export default Admin;
