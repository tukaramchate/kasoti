import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { quizAPI } from "../../api";
import { useAuth } from "../../context/UserContext";
import LoadingSpinner from "../../components/LoadingSpinner";
import PageHeader from "../../components/PageHeader";
import { motion } from "framer-motion";
import { FiAward, FiClock } from "react-icons/fi";
import { formatTime } from "../../utils/styles";

const MEDAL_COLORS = [
    "from-yellow-400 to-amber-500 shadow-yellow-300/40",
    "from-gray-300 to-gray-500 shadow-gray-400/40",
    "from-amber-500 to-amber-700 shadow-amber-400/40",
];

const RankBadge = ({ rank }) => {
    if (rank <= 3) {
        return (
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[13px] text-white bg-gradient-to-br shadow-lg ${MEDAL_COLORS[rank - 1]}`}>
                {rank}
            </div>
        );
    }
    return <span className="pl-2.5 text-[color:var(--text-muted)] font-medium text-sm">{rank}</span>;
};

const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString();
};

const Leaderboard = () => {
    const { id } = useParams();
    const [leaderboard, setLeaderboard] = useState([]);
    const [quizTitle, setQuizTitle] = useState("");
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    const fetchData = useCallback(async () => {
        try {
            const [leaderboardRes, quizRes] = await Promise.all([
                quizAPI.getLeaderboard(id),
                quizAPI.getQuizById(id),
            ]);
            setQuizTitle(quizRes.data.title);
            const sorted = (leaderboardRes.data || []).sort((a, b) => {
                if (b.score !== a.score) return b.score - a.score;
                return (a.timeTakenSeconds || 0) - (b.timeTakenSeconds || 0);
            });
            setLeaderboard(sorted);
        } catch (error) {
            console.error("Error fetching leaderboard:", error);
        } finally { setLoading(false); }
    }, [id]);

    useEffect(() => { fetchData(); }, [fetchData]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[color:var(--bg-primary)] p-6 max-sm:p-4">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[color:var(--bg-primary)] p-6 max-sm:p-4 relative overflow-hidden">
            {/* Subtle BG */}
            <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-[color:var(--accent)]/5 to-transparent pointer-events-none" />

            <div className="max-w-[760px] mx-auto relative z-10">
                <PageHeader title="Leaderboard" />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="bg-[color:var(--bg-card)]/80 backdrop-blur-lg border border-[color:var(--border)] rounded-2xl overflow-hidden shadow-soft"
                >
                    {/* Header */}
                    <div className="p-7 text-center border-b border-[color:var(--border)] max-sm:p-5 bg-gradient-to-br from-[color:var(--accent)]/10 to-purple-500/5">
                        <h1 className="flex items-center justify-center gap-2.5 text-2xl font-extrabold text-[color:var(--text-primary)] mb-2 max-sm:text-xl tracking-tight">
                            <FiAward className="text-yellow-500 drop-shadow-[0_0_12px_rgba(234,179,8,0.5)]" />
                            Leaderboard
                        </h1>
                        <p className="text-[color:var(--text-secondary)] text-sm font-medium">Top Champions for "<span className="text-[color:var(--accent)]">{quizTitle}</span>"</p>
                    </div>

                    {/* Board */}
                    {leaderboard.length === 0 ? (
                        <div className="p-12 text-center max-sm:p-8">
                            <div className="text-5xl mb-4 opacity-60">🏆</div>
                            <h3 className="text-base font-bold text-[color:var(--text-primary)] mb-1.5">No champions yet!</h3>
                            <p className="text-[color:var(--text-secondary)] text-[13px]">Be the first to take this quiz and claim the top spot.</p>
                        </div>
                    ) : (
                        <div>
                            {/* Table Header */}
                            <div className="grid grid-cols-[48px_1fr_80px_80px_80px] gap-2 px-4 py-3 bg-[color:var(--bg-primary)] border-b border-[color:var(--border)]">
                                {["Rank", "Player", "Score", "Time", "Date"].map((h) => (
                                    <div key={h} className="text-[11px] font-bold text-[color:var(--text-muted)] uppercase tracking-wider last:max-sm:hidden">{h}</div>
                                ))}
                            </div>

                            {/* Rows */}
                            {leaderboard.map((attempt, index) => {
                                const username = attempt.username || attempt.user?.username;
                                const isCurrentUser = user?.user?.username === username;
                                const rank = index + 1;

                                return (
                                    <motion.div
                                        key={attempt.id || index}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.1 + index * 0.05, duration: 0.4 }}
                                        className={`grid grid-cols-[48px_1fr_80px_80px_80px] gap-2 items-center px-4 py-3.5 border-b border-[color:var(--border-light)] last:border-b-0 transition-colors ${isCurrentUser ? "bg-[color:var(--accent-light)] border-l-2 border-l-[color:var(--accent)]" : "hover:bg-[color:var(--bg-hover)]"
                                            }`}
                                    >
                                        {/* Rank */}
                                        <div className="flex items-center"><RankBadge rank={rank} /></div>

                                        {/* Player */}
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[13px] shrink-0 text-white ${rank <= 3 ? `bg-gradient-to-br ${MEDAL_COLORS[rank - 1]}` : "bg-gradient-to-br from-[color:var(--accent)] to-purple-600"}`}>
                                                {username ? username.charAt(0).toUpperCase() : "?"}
                                            </div>
                                            <div className="min-w-0">
                                                <span className="text-sm font-semibold text-[color:var(--text-primary)] truncate block">{username || "Unknown"}</span>
                                                {isCurrentUser && <span className="text-[11px] text-[color:var(--accent)] font-semibold">You</span>}
                                            </div>
                                        </div>

                                        {/* Score */}
                                        <div className="text-base font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[color:var(--accent)] to-purple-500">
                                            {attempt.score}%
                                        </div>

                                        {/* Time */}
                                        <div className="flex items-center gap-1 text-[13px] text-[color:var(--text-secondary)] font-medium">
                                            <FiClock size={11} className="flex-shrink-0" />
                                            {formatTime(attempt.timeTakenSeconds || attempt.timeTaken)}
                                        </div>

                                        {/* Date */}
                                        <div className="text-xs text-[color:var(--text-muted)] max-sm:hidden">
                                            {formatDate(attempt.attemptedAt || attempt.completedAt)}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default Leaderboard;
