import React, { useState, useEffect, useContext, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { quizAPI } from "../../api";
import { UserContext } from "../../context/UserContext";
import { FiClock, FiUser, FiBookOpen } from "react-icons/fi";
import LoadingSpinner from "../../components/LoadingSpinner";

const ShareQuiz = () => {
    const { shareCode } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(UserContext);
    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchQuiz = useCallback(async () => {
        try {
            const response = await quizAPI.getByShareCode(shareCode);
            setQuiz(response.data);
        } catch (err) {
            setError(err.response?.data?.message || "Quiz not found or no longer available");
        } finally {
            setLoading(false);
        }
    }, [shareCode]);

    useEffect(() => {
        fetchQuiz();
    }, [fetchQuiz]);

    const handleStartQuiz = () => {
        if (user && quiz) {
            navigate(`/quiz/${quiz.id}`);
        } else {
            navigate(`/login?redirect=/quiz/${quiz?.id}`);
        }
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
                <div className="w-full max-w-md bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-2xl p-8 text-center">
                    <div className="text-5xl mb-4">404</div>
                    <h1 className="text-xl font-bold text-[color:var(--text-primary)] mb-2">Quiz Not Found</h1>
                    <p className="text-[color:var(--text-secondary)] mb-6">{error}</p>
                    <button className="w-full py-3 bg-[color:var(--accent)] text-white rounded-lg font-medium text-sm cursor-pointer transition-all hover:bg-[color:var(--accent-hover)]" onClick={() => navigate(user ? '/home' : '/')}>
                        {user ? 'Go Home' : 'Sign In'}
                    </button>
                </div>
            </div>
        );
    }

    const questionCount = quiz?.questionCount || quiz?.questions?.length || 0;

    return (
        <div className="min-h-screen flex items-center justify-center bg-[color:var(--bg-primary)] p-6">
            <div className="w-full max-w-md bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-2xl p-8">
                <div className="text-center mb-6">
                    <img src="/assets/kasoti-logo.png" alt="Kasoti" className="h-10 mx-auto" onError={(e) => { e.target.style.display = 'none'; }} />
                </div>

                <h1 className="text-xl font-bold text-[color:var(--text-primary)] text-center mb-2">{quiz?.title}</h1>
                {quiz?.description && (
                    <p className="text-[color:var(--text-secondary)] text-center mb-4">{quiz.description}</p>
                )}

                <div className="flex gap-4 flex-wrap mb-6 justify-center text-[13px] text-[color:var(--text-secondary)]">
                    <span className="flex items-center gap-1">
                        <FiBookOpen /> {questionCount} Questions
                    </span>
                    {quiz?.timeLimitMinutes && (
                        <span className="flex items-center gap-1">
                            <FiClock /> {quiz.timeLimitMinutes} min
                        </span>
                    )}
                    {quiz?.category && (
                        <span className="py-0.5 px-2.5 bg-[color:var(--accent-light)] text-[color:var(--accent)] rounded-full font-semibold text-[11px]">
                            {quiz.category}
                        </span>
                    )}
                </div>

                {quiz?.creatorUsername && (
                    <div className="flex items-center justify-center gap-2 mb-6 text-[13px] text-[color:var(--text-muted)]">
                        <FiUser /> Created by {quiz.creatorUsername}
                    </div>
                )}

                <button className="w-full py-3 bg-[color:var(--accent)] text-white rounded-lg font-medium text-sm cursor-pointer transition-all hover:bg-[color:var(--accent-hover)]" onClick={handleStartQuiz}>
                    {user ? 'Start Quiz' : 'Sign In to Start'}
                </button>

                {!user && (
                    <div className="text-center mt-6 text-sm text-[color:var(--text-secondary)]">
                        Don't have an account? <Link to="/register" className="text-[color:var(--accent)] hover:underline">Create one</Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ShareQuiz;
