import React, { useState, useEffect, useContext, useCallback } from "react";
import { UserContext } from "../../context/UserContext";
import { quizAPI, profileAPI } from "../../api";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "./Profile.css";
import PageHeader from "../../components/PageHeader";
import LoadingSpinner from "../../components/LoadingSpinner";
import { FiBookOpen, FiActivity, FiAward, FiTrendingUp, FiEdit2, FiLock, FiSave, FiX } from "react-icons/fi";

const Profile = () => {
    const { user, setUser } = useContext(UserContext);
    const navigate = useNavigate();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

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

            // Update context with fresh data
            const updatedUser = { ...user, user: { ...currentUser, ...profileData } };
            setUser(updatedUser);
            localStorage.setItem("user", JSON.stringify(updatedUser));

            if (isTeacher) {
                const response = await quizAPI.getMyQuizzes();
                setData(response.data);
            } else {
                const response = await profileAPI.getAttempts();
                setData(response.data || []);
            }
        } catch (error) {
            console.error("Error fetching profile data:", error);
        } finally {
            setLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isTeacher]);

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
                phone: editPhone ? parseInt(editPhone) : null,
            });

            // Update context with new data
            const updatedUser = { ...user, user: { ...currentUser, ...response.data } };
            setUser(updatedUser);
            localStorage.setItem("user", JSON.stringify(updatedUser));

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

    if (loading) {
        return (
            <div className="profile-container">
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
        if (score >= 80) return 'high';
        if (score >= 50) return 'medium';
        return 'low';
    };

    return (
        <div className="profile-container">
            <PageHeader title="My Profile" />

            {/* User Info Card */}
            <div className="profile-header-card">
                <div className="profile-avatar-large">
                    {currentUser?.username?.charAt(0).toUpperCase()}
                </div>
                <div className="profile-info">
                    {editing ? (
                        <div className="profile-edit-form">
                            <div className="profile-edit-row">
                                <input
                                    type="text"
                                    className="profile-edit-input"
                                    placeholder="Full Name"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                />
                                <input
                                    type="email"
                                    className="profile-edit-input"
                                    placeholder="Email"
                                    value={editEmail}
                                    onChange={(e) => setEditEmail(e.target.value)}
                                />
                                <input
                                    type="tel"
                                    className="profile-edit-input"
                                    placeholder="Phone (optional)"
                                    value={editPhone}
                                    onChange={(e) => setEditPhone(e.target.value)}
                                />
                            </div>
                            <div className="profile-edit-actions">
                                <button className="profile-save-btn" onClick={handleSaveProfile} disabled={saving}>
                                    <FiSave /> {saving ? "Saving..." : "Save"}
                                </button>
                                <button className="profile-cancel-btn" onClick={cancelEditing}>
                                    <FiX /> Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <h2>{currentUser?.name || currentUser?.username}</h2>
                            <div className="profile-email">{currentUser?.email || "user@example.com"}</div>
                            {currentUser?.phone && (
                                <div className="profile-email">{currentUser.phone}</div>
                            )}
                            <span className="profile-role-badge">
                                {isTeacher ? "Teacher Account" : "Student Account"}
                            </span>
                        </>
                    )}
                </div>
                {!editing && (
                    <div className="profile-header-actions">
                        <button className="profile-icon-btn" onClick={startEditing} title="Edit Profile">
                            <FiEdit2 />
                        </button>
                        <button className="profile-icon-btn" onClick={() => setShowPasswordForm(!showPasswordForm)} title="Change Password">
                            <FiLock />
                        </button>
                    </div>
                )}
            </div>

            {/* Change Password Form */}
            {showPasswordForm && (
                <div className="profile-section" style={{ marginBottom: '20px' }}>
                    <h3 className="profile-section-title"><FiLock /> Change Password</h3>
                    <form className="password-form" onSubmit={handleChangePassword}>
                        <input
                            type="password"
                            className="profile-edit-input"
                            placeholder="Current password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                        />
                        <input
                            type="password"
                            className="profile-edit-input"
                            placeholder="New password (min 8 chars)"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                        <input
                            type="password"
                            className="profile-edit-input"
                            placeholder="Confirm new password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        <div className="profile-edit-actions">
                            <button type="submit" className="profile-save-btn" disabled={changingPassword}>
                                <FiSave /> {changingPassword ? "Changing..." : "Change Password"}
                            </button>
                            <button type="button" className="profile-cancel-btn" onClick={() => {
                                setShowPasswordForm(false);
                                setCurrentPassword("");
                                setNewPassword("");
                                setConfirmPassword("");
                            }}>
                                <FiX /> Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Stats Grid */}
            <div className="profile-stats-grid">
                <div className="profile-stat-card">
                    <div className="stat-icon-wrapper" style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)" }}>
                        <FiBookOpen />
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{totalItems}</span>
                        <span className="stat-label">{isTeacher ? "Quizzes Created" : "Quizzes Taken"}</span>
                    </div>
                </div>

                <div className="profile-stat-card">
                    <div className="stat-icon-wrapper" style={{ backgroundColor: "var(--success-light)", color: "var(--success)" }}>
                        {isTeacher ? <FiActivity /> : <FiTrendingUp />}
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{secondaryStat}{!isTeacher && '%'}</span>
                        <span className="stat-label">{isTeacher ? "Total Questions" : "Avg Score"}</span>
                    </div>
                </div>

                {!isTeacher && (
                    <div className="profile-stat-card">
                        <div className="stat-icon-wrapper" style={{ backgroundColor: "var(--warning-light)", color: "var(--warning)" }}>
                            <FiAward />
                        </div>
                        <div className="stat-content">
                            <span className="stat-value">{tertiaryStat}</span>
                            <span className="stat-label">Distinctions</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Activity / List Section */}
            <div className="profile-section">
                <h3 className="profile-section-title">
                    {isTeacher ? <><FiBookOpen /> My Quizzes</> : <><FiActivity /> Recent Activity</>}
                </h3>

                <div className="activity-list">
                    {data.length === 0 ? (
                        <p className="profile-empty">No activity yet.</p>
                    ) : (
                        data.map((item, index) => (
                            <div
                                key={item.id || index}
                                className="activity-card"
                                style={isTeacher ? { cursor: 'pointer' } : {}}
                                onClick={() => isTeacher && navigate(`/quiz/${item.id}/students`)}
                            >
                                <div className="activity-info">
                                    <h4>{item.title || item.quizTitle || item.quiz?.title || "Untitled Quiz"}</h4>
                                    <span className="activity-date">
                                        {isTeacher
                                            ? `${item.questionCount || item.questions?.length || 0} Questions • ${item.status || 'DRAFT'}`
                                            : `Completed ${item.attemptedAt ? new Date(item.attemptedAt).toLocaleDateString() : ''}`}
                                    </span>
                                </div>
                                <div className={`activity-score ${!isTeacher ? getScoreClass(item.score) : ''}`}>
                                    {isTeacher ? (
                                        <span style={{ fontSize: '14px', color: 'var(--accent)', fontWeight: 500 }}>
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
            </div>
        </div>
    );
};

export default Profile;
