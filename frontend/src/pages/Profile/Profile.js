import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/UserContext";
import { quizAPI, profileAPI } from "../../api";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import PageHeader from "../../components/PageHeader";
import LoadingSpinner from "../../components/LoadingSpinner";
import PasswordInput from "../../components/PasswordInput";
import { motion, AnimatePresence } from "framer-motion";
import { FiBookOpen, FiActivity, FiAward, FiTrendingUp, FiEdit2, FiLock, FiSave, FiX, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { inputStyles, getScoreTextClass } from "../../utils/styles";

const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4 } }),
};

const Profile = () => {
    const { user, setUser } = useAuth();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [attemptPage, setAttemptPage] = useState(0);
    const [attemptTotalPages, setAttemptTotalPages] = useState(0);
    const [editing, setEditing] = useState(false);
    const [editName, setEditName] = useState("");
    const [editEmail, setEditEmail] = useState("");
    const [editPhone, setEditPhone] = useState("");
    const [saving, setSaving] = useState(false);
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [changingPassword, setChangingPassword] = useState(false);

    const currentUser = user?.user;
    const isTeacher = currentUser?.role === "TEACHER" || currentUser?.is_teacher;

    const fetchProfileData = useCallback(async () => {
        try {
            const profileRes = await profileAPI.getProfile();
            setUser((prev) => ({ ...prev, user: { ...prev?.user, ...profileRes.data } }));
            if (isTeacher) {
                const response = await quizAPI.getMyQuizzes();
                setData(response.data);
            } else {
                const response = await profileAPI.getAttemptsPaginated(attemptPage, 10);
                const d = response.data;
                setData(d.content ? d.content : (d || []));
                setAttemptTotalPages(d.totalPages || 1);
            }
        } catch (error) {
            console.error("Error fetching profile data:", error);
        } finally { setLoading(false); }
    }, [isTeacher, attemptPage, setUser]);

    useEffect(() => { fetchProfileData(); }, [fetchProfileData]);

    const startEditing = () => {
        setEditName(currentUser?.name || "");
        setEditEmail(currentUser?.email || "");
        setEditPhone(currentUser?.phone ? String(currentUser.phone) : "");
        setEditing(true);
    };

    const handleSaveProfile = async () => {
        if (!editName.trim() || editName.length < 2) { toast.error("Name must be at least 2 characters"); return; }
        if (!editEmail.trim() || !editEmail.includes("@")) { toast.error("Please enter a valid email"); return; }
        setSaving(true);
        try {
            const response = await profileAPI.updateProfile({ name: editName.trim(), email: editEmail.trim(), phone: editPhone ? editPhone.trim() : null });
            setUser({ ...user, user: { ...currentUser, ...response.data } });
            setEditing(false);
            toast.success("Profile updated successfully");
        } catch (error) { toast.error(error.response?.data?.message || "Failed to update profile"); }
        finally { setSaving(false); }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (!currentPassword) { toast.error("Enter your current password"); return; }
        if (newPassword.length < 8) { toast.error("New password must be at least 8 characters"); return; }
        if (newPassword !== confirmPassword) { toast.error("Passwords do not match"); return; }
        setChangingPassword(true);
        try {
            await profileAPI.changePassword(currentPassword, newPassword);
            toast.success("Password changed successfully");
            setShowPasswordForm(false);
            setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
        } catch (error) { toast.error(error.response?.data?.message || "Failed to change password"); }
        finally { setChangingPassword(false); }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[color:var(--bg-primary)] p-4 sm:p-6 max-w-[860px] mx-auto">
                <LoadingSpinner />
            </div>
        );
    }

    const safeData = data || [];
    const totalItems = safeData.length;
    const secondaryStat = isTeacher
        ? safeData.reduce((acc, quiz) => acc + (quiz.questionCount || quiz.questions?.length || 0), 0)
        : totalItems > 0 ? Math.round(safeData.reduce((acc, s) => acc + (s.score || 0), 0) / totalItems) : 0;
    const tertiaryStat = isTeacher ? null : safeData.filter((s) => s.score >= 80).length;

    const statCards = [
        { icon: <FiBookOpen />, value: totalItems, label: isTeacher ? "Quizzes Created" : "Quizzes Taken", bg: "bg-[color:var(--accent-light)]", color: "text-[color:var(--accent)]" },
        { icon: isTeacher ? <FiActivity /> : <FiTrendingUp />, value: `${secondaryStat}${!isTeacher ? "%" : ""}`, label: isTeacher ? "Total Questions" : "Avg Score", bg: "bg-[color:var(--success-light)]", color: "text-[color:var(--success)]" },
        ...(!isTeacher ? [{ icon: <FiAward />, value: tertiaryStat, label: "Distinctions", bg: "bg-[color:var(--warning-light)]", color: "text-[color:var(--warning)]" }] : []),
    ];

    return (
        <div className="min-h-screen bg-[color:var(--bg-primary)] p-4 sm:p-6 max-w-[860px] mx-auto relative">
            <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-[color:var(--accent)]/5 to-transparent pointer-events-none" />
            <PageHeader title="My Profile" />

            {/* User Info Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                className="flex flex-col sm:flex-row items-center sm:items-start gap-5 bg-[color:var(--bg-card)]/80 backdrop-blur-lg border border-[color:var(--border)] rounded-2xl p-6 sm:p-7 mb-5 text-center sm:text-left shadow-soft"
            >
                <div className="w-[72px] h-[72px] bg-gradient-to-br from-[color:var(--accent)] to-purple-600 rounded-full flex items-center justify-center text-white text-[28px] font-extrabold flex-shrink-0 shadow-glow">
                    {currentUser?.username?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                    {editing ? (
                        <div className="flex flex-col gap-3">
                            <div className="flex flex-col gap-2">
                                <input type="text" className={inputStyles} placeholder="Full Name" value={editName} onChange={(e) => setEditName(e.target.value)} />
                                <input type="email" className={inputStyles} placeholder="Email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
                                <input type="tel" className={inputStyles} placeholder="Phone (optional)" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
                            </div>
                            <div className="flex gap-2 justify-center sm:justify-start">
                                <button className="flex items-center gap-1.5 py-2 px-4 bg-gradient-to-r from-[color:var(--accent)] to-purple-600 text-white border-none rounded-xl font-sans text-[13px] font-semibold cursor-pointer transition-all hover:shadow-glow hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0"
                                    onClick={handleSaveProfile} disabled={saving}>
                                    <FiSave /> {saving ? "Saving..." : "Save"}
                                </button>
                                <button className="flex items-center gap-1.5 py-2 px-4 bg-[color:var(--bg-hover)] text-[color:var(--text-secondary)] border border-[color:var(--border)] rounded-xl font-sans text-[13px] font-medium cursor-pointer transition-all hover:border-[color:var(--danger)] hover:text-[color:var(--danger)]"
                                    onClick={() => setEditing(false)}>
                                    <FiX /> Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <h2 className="text-[22px] font-extrabold text-[color:var(--text-primary)] mb-0.5 tracking-tight">{currentUser?.name || currentUser?.username}</h2>
                            <div className="text-[color:var(--text-secondary)] text-[13px] mb-2.5 font-medium">{currentUser?.email || "user@example.com"}</div>
                            {currentUser?.phone && <div className="text-[color:var(--text-secondary)] text-[13px] mb-2.5">{currentUser.phone}</div>}
                            <span className="inline-block py-1 px-3 bg-[color:var(--accent-light)] text-[color:var(--accent)] rounded-full text-[11px] font-bold tracking-wide uppercase">
                                {isTeacher ? "Teacher Account" : "Student Account"}
                            </span>
                        </>
                    )}
                </div>
                {!editing && (
                    <div className="flex gap-1.5 flex-shrink-0">
                        <button className="w-9 h-9 bg-transparent border border-[color:var(--border)] rounded-xl cursor-pointer text-[color:var(--text-secondary)] text-[15px] flex items-center justify-center transition-all hover:border-[color:var(--accent)] hover:text-[color:var(--accent)] hover:bg-[color:var(--accent-light)] hover:shadow-sm"
                            onClick={startEditing} title="Edit Profile"><FiEdit2 /></button>
                        <button className="w-9 h-9 bg-transparent border border-[color:var(--border)] rounded-xl cursor-pointer text-[color:var(--text-secondary)] text-[15px] flex items-center justify-center transition-all hover:border-[color:var(--accent)] hover:text-[color:var(--accent)] hover:bg-[color:var(--accent-light)] hover:shadow-sm"
                            onClick={() => setShowPasswordForm(!showPasswordForm)} title="Change Password"><FiLock /></button>
                    </div>
                )}
            </motion.div>

            {/* Change Password Form */}
            <AnimatePresence>
                {showPasswordForm && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}
                        className="bg-[color:var(--bg-card)]/80 backdrop-blur-lg border border-[color:var(--border)] rounded-2xl p-5 mb-5 overflow-hidden"
                    >
                        <h3 className="flex items-center gap-2 text-base font-bold text-[color:var(--text-primary)] mb-4"><FiLock className="text-[color:var(--accent)]" /> Change Password</h3>
                        <form className="flex flex-col gap-2.5" onSubmit={handleChangePassword}>
                            <PasswordInput className={inputStyles} placeholder="Current password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                            <PasswordInput className={inputStyles} placeholder="New password (min 8 chars)" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                            <PasswordInput className={inputStyles} placeholder="Confirm new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                            <div className="flex gap-2 mt-1">
                                <button type="submit" className="flex items-center gap-1.5 py-2 px-4 bg-gradient-to-r from-[color:var(--accent)] to-purple-600 text-white border-none rounded-xl font-sans text-[13px] font-semibold cursor-pointer transition-all hover:shadow-glow hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0"
                                    disabled={changingPassword}><FiSave /> {changingPassword ? "Changing..." : "Change Password"}</button>
                                <button type="button" className="flex items-center gap-1.5 py-2 px-4 bg-[color:var(--bg-hover)] text-[color:var(--text-secondary)] border border-[color:var(--border)] rounded-xl font-sans text-[13px] font-medium cursor-pointer transition-all hover:border-[color:var(--danger)] hover:text-[color:var(--danger)]"
                                    onClick={() => { setShowPasswordForm(false); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); }}><FiX /> Cancel</button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3.5 mb-5">
                {statCards.map((stat, i) => (
                    <motion.div key={stat.label} custom={i} variants={itemVariants} initial="hidden" animate="visible"
                        className="flex items-center gap-3.5 bg-[color:var(--bg-card)]/80 backdrop-blur-lg border border-[color:var(--border)] rounded-2xl p-[18px] hover:shadow-glow hover:-translate-y-1 transition-all duration-300 hover:border-[color:var(--accent-subtle)] group relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-[color:var(--accent)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg flex-shrink-0 relative z-10 ${stat.bg} ${stat.color}`}>{stat.icon}</div>
                        <div className="flex flex-col relative z-10">
                            <span className="text-[22px] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[color:var(--text-primary)] to-[color:var(--text-secondary)]">{stat.value}</span>
                            <span className="text-xs font-semibold text-[color:var(--text-secondary)] uppercase tracking-wide">{stat.label}</span>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Activity / List Section */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }}
                className="bg-[color:var(--bg-card)]/80 backdrop-blur-lg border border-[color:var(--border)] rounded-2xl p-5 shadow-soft"
            >
                <h3 className="flex items-center gap-2 text-base font-bold text-[color:var(--text-primary)] mb-4">
                    {isTeacher ? <><FiBookOpen className="text-[color:var(--accent)]" /> My Quizzes</> : <><FiActivity className="text-[color:var(--accent)]" /> Recent Activity</>}
                </h3>

                <div className="flex flex-col gap-2">
                    {safeData.length === 0 ? (
                        <p className="text-center py-9 px-5 text-[color:var(--text-muted)] text-[13px]">No activity yet.</p>
                    ) : (
                        safeData.map((item, index) => (
                            <motion.div
                                key={item.id || index}
                                custom={index}
                                variants={itemVariants}
                                initial="hidden"
                                animate="visible"
                                className={`flex flex-col sm:flex-row justify-between items-center gap-2 p-3.5 bg-[color:var(--bg-primary)] border border-[color:var(--border)] rounded-xl transition-all duration-200 hover:border-[color:var(--accent-subtle)] hover:shadow-sm text-center sm:text-left ${isTeacher ? "cursor-pointer" : ""}`}
                                onClick={() => isTeacher && navigate(`/quiz/${item.id}/students`)}
                            >
                                <div>
                                    <h4 className="text-sm font-semibold text-[color:var(--text-primary)] mb-0.5">{item.title || item.quizTitle || item.quiz?.title || "Untitled Quiz"}</h4>
                                    <span className="text-xs text-[color:var(--text-muted)]">
                                        {isTeacher
                                            ? (
                                                <div className="flex items-center gap-1.5 mt-1" onClick={(e) => e.stopPropagation()}>
                                                    <span>{item.questionCount || item.questions?.length || 0} Questions •</span>
                                                    <select 
                                                        className="bg-transparent border border-[color:var(--border)] rounded text-xs px-1 py-0.5 outline-none cursor-pointer hover:border-[color:var(--accent)]"
                                                        value={item.status || "DRAFT"}
                                                        onChange={async (e) => {
                                                            try {
                                                                await quizAPI.updateStatus(item.id, e.target.value);
                                                                toast.success("Quiz status updated");
                                                                fetchProfileData();
                                                            } catch (err) {
                                                                toast.error(err.response?.data?.message || "Failed to update status");
                                                            }
                                                        }}
                                                    >
                                                        <option value="DRAFT">DRAFT</option>
                                                        <option value="PUBLISHED">PUBLISHED</option>
                                                        <option value="CLOSED">CLOSED</option>
                                                    </select>
                                                </div>
                                            )
                                            : `Completed ${item.attemptedAt ? new Date(item.attemptedAt).toLocaleDateString() : ""}`}
                                    </span>
                                </div>
                                <div className={`text-lg font-extrabold ${!isTeacher ? getScoreTextClass(item.score) : ""}`}>
                                    {isTeacher ? (
                                        <span className="text-sm text-[color:var(--accent)] font-semibold">View Students →</span>
                                    ) : (
                                        <>{item.score}%</>
                                    )}
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>

                {/* Pagination */}
                {!isTeacher && attemptTotalPages > 1 && (
                    <div className="flex justify-center items-center gap-4 pt-4 border-t border-[color:var(--border-light)] mt-4">
                        <button className="flex items-center gap-1 py-2 px-3.5 bg-[color:var(--bg-primary)] border border-[color:var(--border)] text-[color:var(--text-secondary)] rounded-xl font-sans text-[13px] cursor-pointer transition-all hover:border-[color:var(--accent)] hover:text-[color:var(--accent)] disabled:opacity-40 disabled:cursor-not-allowed"
                            onClick={() => setAttemptPage((p) => Math.max(0, p - 1))} disabled={attemptPage === 0}><FiChevronLeft /> Prev</button>
                        <span className="text-[13px] text-[color:var(--text-muted)]">Page {attemptPage + 1} of {attemptTotalPages}</span>
                        <button className="flex items-center gap-1 py-2 px-3.5 bg-[color:var(--bg-primary)] border border-[color:var(--border)] text-[color:var(--text-secondary)] rounded-xl font-sans text-[13px] cursor-pointer transition-all hover:border-[color:var(--accent)] hover:text-[color:var(--accent)] disabled:opacity-40 disabled:cursor-not-allowed"
                            onClick={() => setAttemptPage((p) => Math.min(attemptTotalPages - 1, p + 1))} disabled={attemptPage >= attemptTotalPages - 1}>Next <FiChevronRight /></button>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default Profile;
