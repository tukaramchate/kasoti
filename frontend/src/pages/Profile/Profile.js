import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/UserContext";
import { quizAPI, profileAPI } from "../../api";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import PageHeader from "../../components/PageHeader";
import LoadingSpinner from "../../components/LoadingSpinner";
import PasswordInput from "../../components/PasswordInput";
import { FiBookOpen, FiActivity, FiAward, FiTrendingUp, FiEdit2, FiLock, FiSave, FiX, FiChevronLeft, FiChevronRight } from "react-icons/fi";

const Profile = () => {
    const { user, setUser } = useAuth();
    const navigate = useNavigate();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    // Pagination for student attempts
    const [attemptPage, setAttemptPage] = useState(0);
    const [attemptTotalPages, setAttemptTotalPages] = useState(0);

    // Edit profile state
    const [editing, setEditing] = useState(false);
    const [editName, setEditName] = useState("");
    const [editEmail, setEditEmail] = useState("");
    const [editPhone, setEditPhone] = useState("");
    const [saving, setSaving] = useState(false);

    // Change password state
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [changingPassword, setChangingPassword] = useState(false);

    const currentUser = user?.user;
    const isTeacher = currentUser?.role === 'TEACHER' || currentUser?.is_teacher;

    const fetchProfileData = useCallback(async () => {
        try {
            // Fetch fresh profile data from API
            const profileRes = await profileAPI.getProfile();
            const profileData = profileRes.data;

            // Update context with fresh data using functional update to avoid stale closure
            setUser(prev => ({ ...prev, user: { ...prev?.user, ...profileData } }));

            if (isTeacher) {
                const response = await quizAPI.getMyQuizzes();
                setData(response.data);
            } else {
                const response = await profileAPI.getAttemptsPaginated(attemptPage, 10);
                const attemptData = response.data;
                if (attemptData.content) {
                    setData(attemptData.content);
                    setAttemptTotalPages(attemptData.totalPages || 1);
                } else {
                    setData(attemptData || []);
                    setAttemptTotalPages(1);
                }
            }
        } catch (error) {
            console.error("Error fetching profile data:", error);
        } finally {
            setLoading(false);
        }
    }, [isTeacher, attemptPage, setUser]);

    useEffect(() => {
        fetchProfileData();
    }, [fetchProfileData]);

    const startEditing = () => {
        setEditName(currentUser?.name || "");
        setEditEmail(currentUser?.email || "");
        setEditPhone(currentUser?.phone ? String(currentUser.phone) : "");
        setEditing(true);
    };

    const cancelEditing = () => {
        setEditing(false);
    };

    const handleSaveProfile = async () => {
        if (!editName.trim() || editName.length < 2) {
            toast.error("Name must be at least 2 characters");
            return;
        }
        if (!editEmail.trim() || !editEmail.includes("@")) {
            toast.error("Please enter a valid email");
            return;
        }

        setSaving(true);
        try {
            const response = await profileAPI.updateProfile({
                name: editName.trim(),
                email: editEmail.trim(),
                phone: editPhone ? editPhone.trim() : null,
            });

            // Update context with new data
            const updatedUser = { ...user, user: { ...currentUser, ...response.data } };
            setUser(updatedUser);

            setEditing(false);
            toast.success("Profile updated successfully");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (!currentPassword) {
            toast.error("Enter your current password");
            return;
        }
        if (newPassword.length < 8) {
            toast.error("New password must be at least 8 characters");
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        setChangingPassword(true);
        try {
            await profileAPI.changePassword(currentPassword, newPassword);
            toast.success("Password changed successfully");
            setShowPasswordForm(false);
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to change password");
        } finally {
            setChangingPassword(false);
        }
    };

    const inputStyles = "w-full py-2.5 px-3 font-sans text-sm text-[color:var(--text-primary)] bg-[color:var(--bg-input)] border border-[color:var(--border)] rounded outline-none transition-all duration-150 focus:border-[color:var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-light)]";

    if (loading) {
        return (
            <div className="min-h-screen bg-[color:var(--bg-primary)] p-4 sm:p-6 max-w-[860px] mx-auto">
                <LoadingSpinner />
            </div>
        );
    }

    // Calculate Stats
    const totalItems = data.length;

    let secondaryStat, tertiaryStat;
    if (isTeacher) {
        secondaryStat = data.reduce((acc, quiz) => acc + (quiz.questionCount || quiz.questions?.length || 0), 0);
        tertiaryStat = null;
    } else {
        secondaryStat = totalItems > 0
            ? Math.round(data.reduce((acc, score) => acc + (score.score || 0), 0) / totalItems)
            : 0;
        tertiaryStat = data.filter(s => s.score >= 80).length;
    }

    const getScoreClass = (score) => {
        if (score >= 80) return 'text-[color:var(--success)]';
        if (score >= 50) return 'text-[color:var(--warning)]';
        return 'text-[color:var(--danger)]';
    };

    return (
        <div className="min-h-screen bg-[color:var(--bg-primary)] p-4 sm:p-6 max-w-[860px] mx-auto">
            <PageHeader title="My Profile" />

            {/* User Info Card */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-xl p-6 sm:p-7 mb-5 text-center sm:text-left">
                <div className="w-[72px] h-[72px] bg-[color:var(--accent)] rounded-full flex items-center justify-center text-white text-[28px] font-bold flex-shrink-0">
                    {currentUser?.username?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                    {editing ? (
                        <div className="flex flex-col gap-3">
                            <div className="flex flex-col gap-2">
                                <input
                                    type="text"
                                    className={inputStyles}
                                    placeholder="Full Name"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                />
                                <input
                                    type="email"
                                    className={inputStyles}
                                    placeholder="Email"
                                    value={editEmail}
                                    onChange={(e) => setEditEmail(e.target.value)}
                                />
                                <input
                                    type="tel"
                                    className={inputStyles}
                                    placeholder="Phone (optional)"
                                    value={editPhone}
                                    onChange={(e) => setEditPhone(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2 justify-center sm:justify-start">
                                <button
                                    className="flex items-center gap-1.5 py-2 px-4 bg-[color:var(--accent)] text-white border-none rounded font-sans text-[13px] font-medium cursor-pointer transition-all duration-150 hover:bg-[color:var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={handleSaveProfile}
                                    disabled={saving}
                                >
                                    <FiSave /> {saving ? "Saving..." : "Save"}
                                </button>
                                <button
                                    className="flex items-center gap-1.5 py-2 px-4 bg-[color:var(--bg-hover)] text-[color:var(--text-secondary)] border border-[color:var(--border)] rounded font-sans text-[13px] font-medium cursor-pointer transition-all duration-150 hover:border-[color:var(--danger)] hover:text-[color:var(--danger)]"
                                    onClick={cancelEditing}
                                >
                                    <FiX /> Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <h2 className="text-[22px] font-bold text-[color:var(--text-primary)] mb-0.5">{currentUser?.name || currentUser?.username}</h2>
                            <div className="text-[color:var(--text-secondary)] text-[13px] mb-2.5">{currentUser?.email || "user@example.com"}</div>
                            {currentUser?.phone && (
                                <div className="text-[color:var(--text-secondary)] text-[13px] mb-2.5">{currentUser.phone}</div>
                            )}
                            <span className="inline-block py-1 px-3 bg-[color:var(--accent-light)] text-[color:var(--accent)] rounded-full text-[11px] font-semibold">
                                {isTeacher ? "Teacher Account" : "Student Account"}
                            </span>
                        </>
                    )}
                </div>
                {!editing && (
                    <div className="flex gap-1.5 flex-shrink-0">
                        <button
                            className="w-9 h-9 bg-transparent border border-[color:var(--border)] rounded cursor-pointer text-[color:var(--text-secondary)] text-[15px] flex items-center justify-center transition-all duration-150 hover:border-[color:var(--accent)] hover:text-[color:var(--accent)] hover:bg-[color:var(--accent-light)]"
                            onClick={startEditing}
                            title="Edit Profile"
                        >
                            <FiEdit2 />
                        </button>
                        <button
                            className="w-9 h-9 bg-transparent border border-[color:var(--border)] rounded cursor-pointer text-[color:var(--text-secondary)] text-[15px] flex items-center justify-center transition-all duration-150 hover:border-[color:var(--accent)] hover:text-[color:var(--accent)] hover:bg-[color:var(--accent-light)]"
                            onClick={() => setShowPasswordForm(!showPasswordForm)}
                            title="Change Password"
                        >
                            <FiLock />
                        </button>
                    </div>
                )}
            </div>

            {/* Change Password Form */}
            {showPasswordForm && (
                <div className="bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-lg p-5 mb-5">
                    <h3 className="flex items-center gap-2 text-base font-semibold text-[color:var(--text-primary)] mb-4">
                        <FiLock /> Change Password
                    </h3>
                    <form className="flex flex-col gap-2.5" onSubmit={handleChangePassword}>
                        <PasswordInput
                            className={inputStyles}
                            placeholder="Current password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                        />
                        <PasswordInput
                            className={inputStyles}
                            placeholder="New password (min 8 chars)"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                        <PasswordInput
                            className={inputStyles}
                            placeholder="Confirm new password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        <div className="flex gap-2 mt-1">
                            <button
                                type="submit"
                                className="flex items-center gap-1.5 py-2 px-4 bg-[color:var(--accent)] text-white border-none rounded font-sans text-[13px] font-medium cursor-pointer transition-all duration-150 hover:bg-[color:var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={changingPassword}
                            >
                                <FiSave /> {changingPassword ? "Changing..." : "Change Password"}
                            </button>
                            <button
                                type="button"
                                className="flex items-center gap-1.5 py-2 px-4 bg-[color:var(--bg-hover)] text-[color:var(--text-secondary)] border border-[color:var(--border)] rounded font-sans text-[13px] font-medium cursor-pointer transition-all duration-150 hover:border-[color:var(--danger)] hover:text-[color:var(--danger)]"
                                onClick={() => {
                                    setShowPasswordForm(false);
                                    setCurrentPassword("");
                                    setNewPassword("");
                                    setConfirmPassword("");
                                }}
                            >
                                <FiX /> Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3.5 mb-5">
                <div className="flex items-center gap-3.5 bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-lg p-[18px]">
                    <div className="w-11 h-11 rounded flex items-center justify-center text-lg flex-shrink-0 bg-[color:var(--accent-light)] text-[color:var(--accent)]">
                        <FiBookOpen />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[22px] font-bold text-[color:var(--text-primary)]">{totalItems}</span>
                        <span className="text-xs text-[color:var(--text-secondary)]">{isTeacher ? "Quizzes Created" : "Quizzes Taken"}</span>
                    </div>
                </div>

                <div className="flex items-center gap-3.5 bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-lg p-[18px]">
                    <div className="w-11 h-11 rounded flex items-center justify-center text-lg flex-shrink-0 bg-[color:var(--success-light)] text-[color:var(--success)]">
                        {isTeacher ? <FiActivity /> : <FiTrendingUp />}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[22px] font-bold text-[color:var(--text-primary)]">{secondaryStat}{!isTeacher && '%'}</span>
                        <span className="text-xs text-[color:var(--text-secondary)]">{isTeacher ? "Total Questions" : "Avg Score"}</span>
                    </div>
                </div>

                {!isTeacher && (
                    <div className="flex items-center gap-3.5 bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-lg p-[18px]">
                        <div className="w-11 h-11 rounded flex items-center justify-center text-lg flex-shrink-0 bg-[color:var(--warning-light)] text-[color:var(--warning)]">
                            <FiAward />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[22px] font-bold text-[color:var(--text-primary)]">{tertiaryStat}</span>
                            <span className="text-xs text-[color:var(--text-secondary)]">Distinctions</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Activity / List Section */}
            <div className="bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-lg p-5">
                <h3 className="flex items-center gap-2 text-base font-semibold text-[color:var(--text-primary)] mb-4">
                    {isTeacher ? <><FiBookOpen /> My Quizzes</> : <><FiActivity /> Recent Activity</>}
                </h3>

                <div className="flex flex-col gap-2">
                    {data.length === 0 ? (
                        <p className="text-center py-9 px-5 text-[color:var(--text-muted)] text-[13px]">No activity yet.</p>
                    ) : (
                        data.map((item, index) => (
                            <div
                                key={item.id || index}
                                className={`flex flex-col sm:flex-row justify-between items-center gap-2 p-3.5 bg-[color:var(--bg-primary)] border border-[color:var(--border)] rounded transition-all duration-150 hover:border-[color:var(--accent-subtle)] text-center sm:text-left ${isTeacher ? 'cursor-pointer' : ''}`}
                                onClick={() => isTeacher && navigate(`/quiz/${item.id}/students`)}
                            >
                                <div>
                                    <h4 className="text-sm font-medium text-[color:var(--text-primary)] mb-0.5">{item.title || item.quizTitle || item.quiz?.title || "Untitled Quiz"}</h4>
                                    <span className="text-xs text-[color:var(--text-muted)]">
                                        {isTeacher
                                            ? `${item.questionCount || item.questions?.length || 0} Questions • ${item.status || 'DRAFT'}`
                                            : `Completed ${item.attemptedAt ? new Date(item.attemptedAt).toLocaleDateString() : ''}`}
                                    </span>
                                </div>
                                <div className={`text-lg font-bold ${!isTeacher ? getScoreClass(item.score) : ''}`}>
                                    {isTeacher ? (
                                        <span className="text-sm text-[color:var(--accent)] font-medium">
                                            View Students →
                                        </span>
                                    ) : (
                                        <>{item.score}%</>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Pagination for student attempts */}
                {!isTeacher && attemptTotalPages > 1 && (
                    <div className="flex justify-center items-center gap-4 pt-4 border-t border-[color:var(--border-light)] mt-4">
                        <button
                            className="flex items-center gap-1 py-2 px-3.5 bg-[color:var(--bg-primary)] border border-[color:var(--border)] text-[color:var(--text-secondary)] rounded font-sans text-[13px] cursor-pointer transition-all duration-150 hover:border-[color:var(--accent)] hover:text-[color:var(--accent)] disabled:opacity-40 disabled:cursor-not-allowed"
                            onClick={() => setAttemptPage(p => Math.max(0, p - 1))}
                            disabled={attemptPage === 0}
                        >
                            <FiChevronLeft /> Prev
                        </button>
                        <span className="text-[13px] text-[color:var(--text-muted)]">
                            Page {attemptPage + 1} of {attemptTotalPages}
                        </span>
                        <button
                            className="flex items-center gap-1 py-2 px-3.5 bg-[color:var(--bg-primary)] border border-[color:var(--border)] text-[color:var(--text-secondary)] rounded font-sans text-[13px] cursor-pointer transition-all duration-150 hover:border-[color:var(--accent)] hover:text-[color:var(--accent)] disabled:opacity-40 disabled:cursor-not-allowed"
                            onClick={() => setAttemptPage(p => Math.min(attemptTotalPages - 1, p + 1))}
                            disabled={attemptPage >= attemptTotalPages - 1}
                        >
                            Next <FiChevronRight />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile;
