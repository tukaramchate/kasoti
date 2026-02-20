import React, { useEffect, useState, useContext, useCallback } from "react";
import { useParams } from "react-router-dom";
import { quizAPI } from "../../api";
import { UserContext } from "../../context/UserContext";
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
            <div className="min-h-screen bg-[color:var(--bg-primary)] p-6 max-sm:p-4">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[color:var(--bg-primary)] p-6 max-sm:p-4">
            <div className="max-w-[760px] mx-auto">
                <PageHeader title="Leaderboard" />

                <div className="bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-2xl overflow-hidden">
                    <div className="p-7 text-center border-b border-[color:var(--border)] max-sm:p-5">
                        <h1 className="flex items-center justify-center gap-2.5 text-2xl font-bold text-[color:var(--text-primary)] mb-1.5 max-sm:text-xl">
                            <FiAward className="text-yellow-500" /> Leaderboard
                        </h1>
                        <p className="text-[color:var(--text-secondary)] text-sm">Top Champions for "{quizTitle}"</p>
                    </div>

                    <div>
                        {leaderboard.length === 0 ? (
                            <div className="p-12 text-center max-sm:p-8">
                                <FiAward className="text-[40px] text-[color:var(--text-muted)] mb-3" />
                                <h3 className="text-base text-[color:var(--text-primary)] mb-1.5">No champions yet!</h3>
                                <p className="text-[color:var(--text-secondary)] text-[13px]">Be the first to take this quiz and claim the top spot.</p>
                            </div>
                        ) : (
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr>
                                        <th className="text-left py-3 px-4 text-[11px] font-semibold text-[color:var(--text-muted)] uppercase tracking-wider border-b border-[color:var(--border)] bg-[color:var(--bg-primary)]">Rank</th>
                                        <th className="text-left py-3 px-4 text-[11px] font-semibold text-[color:var(--text-muted)] uppercase tracking-wider border-b border-[color:var(--border)] bg-[color:var(--bg-primary)]">Player</th>
                                        <th className="text-left py-3 px-4 text-[11px] font-semibold text-[color:var(--text-muted)] uppercase tracking-wider border-b border-[color:var(--border)] bg-[color:var(--bg-primary)]">Score</th>
                                        <th className="text-left py-3 px-4 text-[11px] font-semibold text-[color:var(--text-muted)] uppercase tracking-wider border-b border-[color:var(--border)] bg-[color:var(--bg-primary)]">Time</th>
                                        <th className="text-left py-3 px-4 text-[11px] font-semibold text-[color:var(--text-muted)] uppercase tracking-wider border-b border-[color:var(--border)] bg-[color:var(--bg-primary)] max-sm:hidden">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leaderboard.map((attempt, index) => {
                                        const username = attempt.username || attempt.user?.username;
                                        const isCurrentUser = user?.user?.username === username;

                                        return (
                                            <tr key={attempt.id || index} className={`transition-all hover:bg-[color:var(--bg-hover)] ${isCurrentUser ? '!bg-[color:var(--accent-light)]' : ''}`}>
                                                <td className="py-3.5 px-4 border-b border-[color:var(--border-light)] text-sm w-14">
                                                    {index + 1 <= 3 ? (
                                                        <div className={`w-[30px] h-[30px] rounded-full flex items-center justify-center font-bold text-[13px] text-white ${index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-500' : index === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-500' : 'bg-gradient-to-br from-amber-600 to-amber-700'}`}>
                                                            {index + 1}
                                                        </div>
                                                    ) : (
                                                        <span className="pl-2.5">{index + 1}</span>
                                                    )}
                                                </td>
                                                <td className="py-3.5 px-4 border-b border-[color:var(--border-light)] text-sm">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-8 h-8 bg-[color:var(--accent)] rounded-full flex items-center justify-center text-white font-semibold text-[13px] shrink-0">
                                                            {username ? username.charAt(0).toUpperCase() : "?"}
                                                        </div>
                                                        <span>
                                                            {username || "Unknown"}
                                                            {isCurrentUser && <span className="text-xs text-[color:var(--accent)] ml-1.5">(You)</span>}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4 border-b border-[color:var(--border-light)] text-base font-bold text-[color:var(--accent)]">{attempt.score}%</td>
                                                <td className="py-3.5 px-4 border-b border-[color:var(--border-light)] text-[13px] text-[color:var(--text-secondary)]">{formatTime(attempt.timeTakenSeconds || attempt.timeTaken)}</td>
                                                <td className="py-3.5 px-4 border-b border-[color:var(--border-light)] text-xs text-[color:var(--text-muted)] max-sm:hidden">{formatDate(attempt.attemptedAt || attempt.completedAt)}</td>
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
