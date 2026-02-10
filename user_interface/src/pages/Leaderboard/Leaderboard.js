import React, { useEffect, useState, useContext, useCallback } from "react";
import { useParams } from "react-router-dom";
import { quizAPI } from "../../api";
import { UserContext } from "../../context/UserContext";
import "./Leaderboard.css";
import LoadingSpinner from "../../components/LoadingSpinner";
import PageHeader from "../../components/PageHeader";
import { FiAward } from "react-icons/fi";

const Leaderboard = () => {
    const { id } = useParams();
    const [leaderboard, setLeaderboard] = useState([]);
    const [quizTitle, setQuizTitle] = useState("");
    const [loading, setLoading] = useState(true);
    const { user } = useContext(UserContext);

    const fetchData = useCallback(async () => {
        try {
            const [leaderboardRes, quizRes] = await Promise.all([
                quizAPI.getLeaderboard(id),
                quizAPI.getQuizById(id)
            ]);

            setQuizTitle(quizRes.data.title);

            // Sort by score (desc) then time (asc)
            const sortedData = (leaderboardRes.data || []).sort((a, b) => {
                if (b.score !== a.score) return b.score - a.score;
                return (a.timeTakenSeconds || 0) - (b.timeTakenSeconds || 0);
            });
            setLeaderboard(sortedData);
        } catch (error) {
            console.error("Error fetching leaderboard:", error);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

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
                                        const username = attempt.username || attempt.user?.username;
                                        const isCurrentUser = user?.user?.username === username;

                                        return (
                                            <tr key={attempt.id || index} className={isCurrentUser ? "current-user-row" : ""}>
                                                <td className="rank-cell">
                                                    {index + 1 <= 3 ? (
                                                        <div className={`rank-badge rank-${index + 1}`}>
                                                            {index + 1}
                                                        </div>
                                                    ) : (
                                                        <span style={{ paddingLeft: '10px' }}>{index + 1}</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <div className="user-cell">
                                                        <div className="user-avatar-small">
                                                            {username ? username.charAt(0).toUpperCase() : "?"}
                                                        </div>
                                                        <span>
                                                            {username || "Unknown"}
                                                            {isCurrentUser && <span style={{ fontSize: '12px', color: 'var(--accent)', marginLeft: '6px' }}>(You)</span>}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="score-cell">{attempt.score}%</td>
                                                <td className="time-cell">{formatTime(attempt.timeTakenSeconds || attempt.timeTaken)}</td>
                                                <td className="date-cell mobile-hide">{formatDate(attempt.attemptedAt || attempt.completedAt)}</td>
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
