import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { quizAPI } from "../../api";
import { useAuth } from "../../context/UserContext";
import { FiClock, FiUser, FiBookOpen, FiArrowRight } from "react-icons/fi";
import LoadingSpinner from "../../components/LoadingSpinner";
import { motion } from "framer-motion";

const ShareQuiz = () => {
    const { shareCode } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchQuiz = useCallback(async () => {
        try {
            const response = await quizAPI.getByShareCode(shareCode);
            setQuiz(response.data);
        } catch (err) {
            setError(err.response?.data?.message || "Quiz not found or no longer available");
        } finally { setLoading(false); }
    }, [shareCode]);

    useEffect(() => { fetchQuiz(); }, [fetchQuiz]);

    const handleStartQuiz = () => {
        if (user && quiz) navigate(`/quiz/${quiz.id}`);
        else navigate(`/login?redirect=/quiz/${quiz?.id}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[color:var(--bg-primary)] p-6">
                <LoadingSpinner />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[color:var(--bg-primary)] p-6">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}
                    className="w-full max-w-md bg-[color:var(--bg-card)]/80 backdrop-blur-2xl border border-[color:var(--border)] rounded-2xl p-8 text-center shadow-glass"
                >
                    <div className="text-5xl mb-4 opacity-60">😕</div>
                    <h1 className="text-xl font-bold text-[color:var(--text-primary)] mb-2">Quiz Not Found</h1>
                    <p className="text-[color:var(--text-secondary)] mb-6 text-sm">{error}</p>
                    <button className="w-full py-3 bg-gradient-to-r from-[color:var(--accent)] to-purple-600 text-white rounded-xl font-semibold text-sm cursor-pointer transition-all hover:shadow-glow hover:-translate-y-0.5"
                        onClick={() => navigate(user ? "/home" : "/")}>
                        {user ? "Go Home" : "Sign In"}
                    </button>
                </motion.div>
            </div>
        );
    }

    const questionCount = quiz?.questionCount || quiz?.questions?.length || 0;

    return (
        <div className="min-h-screen flex items-center justify-center bg-[color:var(--bg-primary)] p-6 relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[color:var(--accent)] rounded-full mix-blend-multiply filter blur-[120px] opacity-15 animate-blob" />
                <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-purple-500 rounded-full mix-blend-multiply filter blur-[100px] opacity-10 animate-blob animation-delay-2000" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-md bg-[color:var(--bg-card)]/80 backdrop-blur-2xl border border-[color:var(--border)] rounded-2xl p-8 shadow-glass relative z-10"
            >
                {/* Logo */}
                <div className="text-center mb-6">
                    <img src="/assets/kasoti-logo.png" alt="Kasoti" className="h-10 mx-auto" onError={(e) => { e.target.style.display = "none"; }} />
                </div>

                {/* Quiz Title */}
                <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="text-xl font-extrabold text-[color:var(--text-primary)] text-center mb-2 tracking-tight"
                >
                    {quiz?.title}
                </motion.h1>

                {quiz?.description && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
                        className="text-[color:var(--text-secondary)] text-center mb-4 text-sm leading-relaxed"
                    >
                        {quiz.description}
                    </motion.p>
                )}

                {/* Meta chips */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="flex gap-3 flex-wrap mb-6 justify-center text-[13px] text-[color:var(--text-secondary)]"
                >
                    <span className="flex items-center gap-1.5 py-1 px-3 bg-[color:var(--bg-hover)] rounded-lg border border-[color:var(--border)]">
                        <FiBookOpen className="text-[color:var(--accent)]" /> {questionCount} Questions
                    </span>
                    {quiz?.timeLimitMinutes && (
                        <span className="flex items-center gap-1.5 py-1 px-3 bg-[color:var(--bg-hover)] rounded-lg border border-[color:var(--border)]">
                            <FiClock className="text-[color:var(--accent)]" /> {quiz.timeLimitMinutes} min
                        </span>
                    )}
                    {quiz?.category && (
                        <span className="py-1 px-3 bg-[color:var(--accent-light)] text-[color:var(--accent)] rounded-lg font-semibold text-[12px] border border-[color:var(--accent-subtle)]">
                            {quiz.category}
                        </span>
                    )}
                </motion.div>

                {quiz?.creatorUsername && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
                        className="flex items-center justify-center gap-2 mb-6 text-[13px] text-[color:var(--text-muted)]"
                    >
                        <FiUser /> Created by <span className="font-semibold text-[color:var(--text-secondary)]">{quiz.creatorUsername}</span>
                    </motion.div>
                )}

                <motion.button
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="group w-full py-3.5 bg-gradient-to-r from-[color:var(--accent)] to-purple-600 text-white rounded-xl font-semibold text-sm cursor-pointer transition-all hover:shadow-glow hover:-translate-y-0.5 flex items-center justify-center gap-2"
                    onClick={handleStartQuiz}
                >
                    {user ? "Start Quiz" : "Sign In to Start"}
                    <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                </motion.button>

                {!user && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
                        className="text-center mt-5 text-sm text-[color:var(--text-secondary)]"
                    >
                        Don't have an account?{" "}
                        <Link to="/register" className="text-[color:var(--accent)] font-semibold hover:underline">Create one</Link>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
};

export default ShareQuiz;
