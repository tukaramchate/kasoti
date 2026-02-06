import React, { useState, useEffect, useContext } from "react";
import { UserContext } from "./userContext";
import { quizAPI, userAPI } from "./api"; // Assuming userAPI export exists as per plan
import "./style/Profile.css";
import PageHeader from "./components/PageHeader";
import LoadingSpinner from "./components/LoadingSpinner";
import { FiUser, FiActivity, FiAward, FiBookOpen } from "react-icons/fi";

const Profile = () => {
    const { user } = useContext(UserContext);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    const currentUser = user?.user;
    const isTeacher = currentUser?.is_teacher;

    useEffect(() => {
        fetchProfileData();
    }, [user]);

    const fetchProfileData = async () => {
        try {
            if (isTeacher) {
                // Fetch created quizzes for teachers
                const response = await quizAPI.getMyQuizzes();
                setData(response.data);
            } else {
                // Fetch score history for students
                const response = await userAPI.getScoreHistory();
                setData(response.data);
            }
        } catch (error) {
            console.error("Error fetching profile data:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LoadingSpinner />;

    // Calculate Stats
    const totalItems = data.length;
    const secondaryStat = isTeacher
        ? data.reduce((acc, quiz) => acc + (quiz.questions?.length || 0), 0) // Total Questions created
        : Math.round(data.reduce((acc, score) => acc + score.score, 0) / (totalItems || 1)); // Avg Score

    return (
        <div className="profile-container">
            <PageHeader title="My Profile" />

            {/* User Info Card */}
            <div className="profile-header-card">
                <div className="profile-avatar-large">
                    {currentUser?.username?.charAt(0).toUpperCase()}
                </div>
                <div className="profile-info">
                    <h2>{currentUser?.username}</h2>
                    <div className="profile-email">{currentUser?.email || "user@example.com"}</div>
                    <span className="profile-role-badge">
                        {isTeacher ? "Teacher Account" : "Student Account"}
                    </span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="profile-stats-grid">
                <div className="profile-stat-card">
                    <div className="stat-icon-wrapper" style={{ backgroundColor: "#e3f2fd", color: "#2196f3" }}>
                        <FiBookOpen />
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{totalItems}</span>
                        <span className="stat-label">{isTeacher ? "Quizzes Created" : "Quizzes Taken"}</span>
                    </div>
                </div>

                <div className="profile-stat-card">
                    <div className="stat-icon-wrapper" style={{ backgroundColor: "#e8f5e9", color: "#4caf50" }}>
                        <FiActivity />
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{secondaryStat}</span>
                        <span className="stat-label">{isTeacher ? "Total Questions" : "Avg Score"}</span>
                    </div>
                </div>

                {!isTeacher && (
                    <div className="profile-stat-card">
                        <div className="stat-icon-wrapper" style={{ backgroundColor: "#fff3e0", color: "#ff9800" }}>
                            <FiAward />
                        </div>
                        <div className="stat-content">
                            <span className="stat-value">
                                {data.filter(s => s.score >= 80).length}
                            </span>
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
                        <p style={{ color: '#666', fontStyle: 'italic' }}>No activity yet.</p>
                    ) : (
                        data.map((item, index) => (
                            <div key={index} className="activity-card" style={isTeacher ? { cursor: 'pointer' } : {}}
                                onClick={() => isTeacher && window.location.assign(`/quiz/${item.id}/students`)}>
                                <div className="activity-info">
                                    <h4>{item.title || item.quizTitle || item.quiz?.title || "Untitled Quiz"}</h4>
                                    <span className="activity-date">
                                        {isTeacher ? `${item.questions?.length || 0} Questions` : `Score: ${item.score}%`}
                                    </span>
                                </div>
                                <div className="activity-score">
                                    {isTeacher ? (
                                        <span style={{ fontSize: '14px', color: '#4d47c3', fontWeight: 600 }}>
                                            View Students →
                                        </span>
                                    ) : (
                                        <span style={{ color: item.score >= 80 ? '#27ae60' : item.score >= 50 ? '#f39c12' : '#e74c3c' }}>
                                            {item.score}%
                                        </span>
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
