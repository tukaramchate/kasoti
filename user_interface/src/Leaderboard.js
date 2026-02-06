import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { quizAPI } from "./api";
import { UserContext } from "./userContext";
import "./style/Leaderboard.css";
import LoadingSpinner from "./components/LoadingSpinner";
import PageHeader from "./components/PageHeader";
import { FiAward, FiClock, FiCalendar } from "react-icons/fi";

const Leaderboard = () => {
    const { id } = useParams();
    const [leaderboard, setLeaderboard] = useState([]);
    const [quizTitle, setQuizTitle] = useState("");
    const [loading, setLoading] = useState(true);
    const { user } = useContext(UserContext);

    useEffect(() => {
        fetchLeaderboard();
        // Fetch quiz details just to get the title if not available in leaderboard response
        // Optimization: Could potentially return title in leaderboard API or separate call
        fetchQuizTitle();
    }, [id]);

    const fetchQuizTitle = async () => {
        try {
            const res = await quizAPI.getQuizById(id);
            setQuizTitle(res.data.title);
        } catch (error) {
            console.error("Error fetching quiz title", error);
        }
    };

    const fetchLeaderboard = async () => {
        try {
            const response = await quizAPI.getLeaderboard(id);
            // Sort by score (desc) then time (asc) if backend doesn't already
            const sortedData = response.data.sort((a, b) => {
                if (b.score !== a.score) return b.score - a.score;
                return a.timeTakenSeconds - b.timeTakenSeconds; // Assuming timeTaken exists, otherwise just score
            });
            setLeaderboard(sortedData);
        } catch (error) {
            console.error("Error fetching leaderboard:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "-";
        return new Date(dateString).toLocaleDateString();
    };

    const formatTime = (seconds) => {
        if (!seconds && seconds !== 0) return "-";
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="leaderboard-container">
            <div className="leaderboard-content">
                <PageHeader title="Back to Quiz" />

                <div className="leaderboard-card">
                    <div className="leaderboard-header">
                        <h1 className="leaderboard-title">
                            <FiAward /> Leaderboard
                        </h1>
                        <p className="leaderboard-subtitle">Top Champions for "{quizTitle}"</p>
                    </div>

                    <div className="leaderboard-table-container">
                        {leaderboard.length === 0 ? (
                            <div className="empty-state">
                                <FiAward className="empty-icon" />
                                <h3>No champions yet!</h3>
                                <p>Be the first to take this quiz and claim the top spot.</p>
                            </div>
                        ) : (
                            <table className="leaderboard-table">
                                <thead>
                                    <tr>
                                        <th>Rank</th>
                                        <th>Player</th>
                                        <th>Score</th>
                                        <th>Time</th>
                                        <th className="mobile-hide">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leaderboard.map((attempt, index) => {
                                        const isCurrentUser = user?.user?.username === attempt.user?.username; // Adjust access path if needed
                                        return (
                                            <tr key={attempt.id || index} className={isCurrentUser ? "current-user-row" : ""}>
                                                <td className="rank-cell">
                                                    {index + 1 <= 3 ? (
                                                        <div className={`rank-badge rank-${index + 1}`}>
                                                            {index + 1}
                                                        </div>
                                                    ) : (
                                                        <span>{index + 1}</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <div className="user-cell">
                                                        <div className="user-avatar-small">
                                                            {attempt.username ? attempt.username.charAt(0).toUpperCase() : "?"}
                                                        </div>
                                                        {attempt.username || "Unknown"}
                                                        {isCurrentUser && <span style={{ fontSize: '12px', color: '#4d47c3' }}>(You)</span>}
                                                    </div>
                                                </td>
                                                <td className="score-cell">{attempt.score}</td>
                                                <td className="time-cell">{formatTime(attempt.timeTaken)}</td>
                                                <td className="date-cell mobile-hide">{formatDate(attempt.completedAt)}</td>
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

export default Leaderboard;
