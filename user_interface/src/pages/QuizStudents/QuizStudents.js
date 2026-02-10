import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { quizAPI } from "../../api";
import { toast } from "react-toastify";
import "../Leaderboard/Leaderboard.css"; // Reuse leaderboard styles
import PageHeader from "../../components/PageHeader";
import LoadingSpinner from "../../components/LoadingSpinner";
import { FiUsers, FiFilter } from "react-icons/fi";

const SORT_OPTIONS = [
    { value: 'score_desc', label: 'Highest Score' },
    { value: 'score_asc', label: 'Lowest Score' },
    { value: 'time_asc', label: 'Fastest Time' },
    { value: 'attemptedAt_desc', label: 'Most Recent' },
];

const QuizStudents = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [quizInfo, setQuizInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState('score_desc');

    const fetchData = useCallback(async () => {
        try {
            const [quizRes, studentsRes] = await Promise.all([
                quizAPI.getQuizById(id),
                quizAPI.getQuizStudents(id, sortBy)
            ]);

            setQuizInfo(quizRes.data);
            setStudents(studentsRes.data || []);
        } catch (error) {
            console.error("Error fetching data:", error);
            if (error.response?.status === 403) {
                toast.error("You don't have access to view this");
                navigate('/home');
            }
        } finally {
            setLoading(false);
        }
    }, [id, sortBy, navigate]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSortChange = (newSort) => {
        setSortBy(newSort);
        setLoading(true);
    };

    const formatTime = (seconds) => {
        if (!seconds && seconds !== 0) return "-";
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return "-";
        return new Date(dateString).toLocaleDateString();
    };

    const getScoreColor = (score, passPercentage) => {
        if (passPercentage && score < passPercentage) return 'var(--danger)';
        if (score >= 80) return 'var(--success)';
        if (score >= 50) return 'var(--warning)';
        return 'var(--text-secondary)';
    };

    if (loading) {
        return (
            <div className="leaderboard-container">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="leaderboard-container">
            <div className="leaderboard-content">
                <PageHeader title="Back to Home" />

                <div className="leaderboard-card">
                    <div className="leaderboard-header">
                        <h1 className="leaderboard-title">
                            <FiUsers /> Student Attempts
                        </h1>
                        <p className="leaderboard-subtitle">
                            {quizInfo?.title} • {students.length} attempts
                        </p>
                    </div>

                    {/* Sort Controls */}
                    <div style={{
                        padding: '16px 24px',
                        borderBottom: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        <FiFilter style={{ color: 'var(--text-muted)' }} />
                        <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Sort by:</span>
                        <select
                            value={sortBy}
                            onChange={(e) => handleSortChange(e.target.value)}
                            style={{
                                padding: '8px 12px',
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius)',
                                fontFamily: 'inherit',
                                fontSize: '14px',
                                color: 'var(--text-primary)',
                                cursor: 'pointer'
                            }}
                        >
                            {SORT_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="leaderboard-table-container">
                        {students.length === 0 ? (
                            <div className="empty-state">
                                <FiUsers className="empty-icon" />
                                <h3>No attempts yet</h3>
                                <p>Students will appear here once they take the quiz.</p>
                            </div>
                        ) : (
                            <table className="leaderboard-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Student</th>
                                        <th>Score</th>
                                        <th>Marks</th>
                                        <th>Time</th>
                                        <th className="mobile-hide">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map((attempt, index) => {
                                        const username = attempt.username || attempt.user?.username;

                                        return (
                                            <tr key={attempt.id || index}>
                                                <td className="rank-cell">
                                                    <span style={{ paddingLeft: '10px' }}>{index + 1}</span>
                                                </td>
                                                <td>
                                                    <div className="user-cell">
                                                        <div className="user-avatar-small">
                                                            {username ? username.charAt(0).toUpperCase() : "?"}
                                                        </div>
                                                        <span>{username || "Unknown"}</span>
                                                    </div>
                                                </td>
                                                <td className="score-cell" style={{ color: getScoreColor(attempt.score, quizInfo?.passPercentage) }}>
                                                    {attempt.score}%
                                                </td>
                                                <td style={{ color: 'var(--text-secondary)' }}>
                                                    {attempt.marksObtained || '-'}/{attempt.totalMarks || '-'}
                                                </td>
                                                <td className="time-cell">{formatTime(attempt.timeTakenSeconds || attempt.timeTaken)}</td>
                                                <td className="date-cell mobile-hide">{formatDate(attempt.attemptedAt)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuizStudents;
