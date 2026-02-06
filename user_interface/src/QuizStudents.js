import React, { useState, useEffect, useContext } from "react";
import { quizAPI } from "./api";
import { UserContext } from "./userContext";
import { useParams, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FiUsers, FiAward, FiClock, FiArrowLeft } from "react-icons/fi";
import "./style/Profile.css";
import PageHeader from "./components/PageHeader";
import LoadingSpinner from "./components/LoadingSpinner";

const QuizStudents = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(UserContext);
    const [students, setStudents] = useState([]);
    const [quizTitle, setQuizTitle] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStudents();
    }, [id]);

    const fetchStudents = async () => {
        try {
            // Fetch quiz title
            const quizResponse = await quizAPI.getQuizById(id);
            setQuizTitle(quizResponse.data.title);

            // Fetch students (sorted by score ascending)
            const studentsResponse = await quizAPI.getQuizStudents(id);
            setStudents(studentsResponse.data);
        } catch (error) {
            console.error("Error fetching students:", error);
            if (error.response?.status === 403) {
                toast.error("You can only view students for your own quizzes");
                navigate("/home");
            } else {
                toast.error("Failed to load student data");
            }
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (seconds) => {
        if (!seconds) return "N/A";
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    if (loading) {
        return (
            <div className="profile-container">
                <LoadingSpinner text="Loading student data..." />
            </div>
        );
    }

    return (
        <div className="profile-container">
            <PageHeader title={`Students - ${quizTitle}`} />

            {/* Stats */}
            <div className="profile-stats-grid">
                <div className="profile-stat-card">
                    <div className="stat-icon-wrapper" style={{ backgroundColor: "#e3f2fd", color: "#2196f3" }}>
                        <FiUsers />
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{students.length}</span>
                        <span className="stat-label">Total Students</span>
                    </div>
                </div>

                <div className="profile-stat-card">
                    <div className="stat-icon-wrapper" style={{ backgroundColor: "#e8f5e9", color: "#4caf50" }}>
                        <FiAward />
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">
                            {students.length > 0 ? Math.round(students.reduce((acc, s) => acc + s.score, 0) / students.length) : 0}%
                        </span>
                        <span className="stat-label">Average Score</span>
                    </div>
                </div>
            </div>

            {/* Student List */}
            <div className="profile-section">
                <h3 className="profile-section-title">
                    <FiUsers /> Student Attempts (Lowest Score First)
                </h3>

                <div className="activity-list">
                    {students.length === 0 ? (
                        <p style={{ color: '#666', fontStyle: 'italic' }}>No students have attempted this quiz yet.</p>
                    ) : (
                        students.map((student, index) => (
                            <div key={index} className="activity-card">
                                <div className="activity-info">
                                    <h4>{student.user?.username || "Unknown Student"}</h4>
                                    <span className="activity-date">
                                        <FiClock style={{ marginRight: 5 }} />
                                        {formatTime(student.timeTakenSeconds)}
                                    </span>
                                </div>
                                <div className="activity-score" style={{
                                    color: student.score >= 80 ? '#27ae60' : student.score >= 50 ? '#f39c12' : '#e74c3c'
                                }}>
                                    {student.score}%
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Back Button */}
            <div style={{ marginTop: 30 }}>
                <button
                    onClick={() => navigate("/profile")}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '12px 25px',
                        backgroundColor: '#f0efff',
                        color: '#4d47c3',
                        border: 'none',
                        borderRadius: 10,
                        fontFamily: 'Poppins, sans-serif',
                        fontSize: 16,
                        fontWeight: 600,
                        cursor: 'pointer'
                    }}
                >
                    <FiArrowLeft /> Back to Profile
                </button>
            </div>

            <ToastContainer />
        </div>
    );
};

export default QuizStudents;
