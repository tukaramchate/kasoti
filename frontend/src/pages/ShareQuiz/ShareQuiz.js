import React, { useState, useEffect, useContext, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { quizAPI } from "../../api";
import { UserContext } from "../../context/UserContext";
import { FiClock, FiUser, FiBookOpen } from "react-icons/fi";
import LoadingSpinner from "../../components/LoadingSpinner";
import "../Login/Login.css";

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
            navigate(`/?redirect=/quiz/${quiz?.id}`);
        }
    };

    if (loading) {
        return (
            <div className="auth-page">
                <LoadingSpinner />
            </div>
        );
    }

    if (error) {
        return (
            <div className="auth-page">
                <div className="auth-card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>404</div>
                    <h1 className="auth-title" style={{ marginBottom: '8px' }}>Quiz Not Found</h1>
                    <p className="auth-subtitle">{error}</p>
                    <button className="auth-btn" onClick={() => navigate(user ? '/home' : '/')}>
                        {user ? 'Go Home' : 'Sign In'}
                    </button>
                </div>
            </div>
        );
    }

    const questionCount = quiz?.questionCount || quiz?.questions?.length || 0;

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-logo">
                    <img src="/assets/Kasoti logo.png" alt="Kasoti" className="auth-logo-img" />
                </div>

                <h1 className="auth-title">{quiz?.title}</h1>
                {quiz?.description && (
                    <p className="auth-subtitle" style={{ marginBottom: '16px' }}>{quiz.description}</p>
                )}

                <div style={{
                    display: 'flex',
                    gap: '16px',
                    flexWrap: 'wrap',
                    marginBottom: '24px',
                    fontSize: '13px',
                    color: 'var(--text-secondary)'
                }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <FiBookOpen /> {questionCount} Questions
                    </span>
                    {quiz?.timeLimitMinutes && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <FiClock /> {quiz.timeLimitMinutes} min
                        </span>
                    )}
                    {quiz?.category && (
                        <span style={{
                            padding: '2px 10px',
                            background: 'var(--accent-light)',
                            color: 'var(--accent)',
                            borderRadius: '9999px',
                            fontWeight: 600,
                            fontSize: '11px'
                        }}>
                            {quiz.category}
                        </span>
                    )}
                </div>

                {quiz?.creatorUsername && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '24px',
                        fontSize: '13px',
                        color: 'var(--text-muted)'
                    }}>
                        <FiUser /> Created by {quiz.creatorUsername}
                    </div>
                )}

                <button className="auth-btn" onClick={handleStartQuiz}>
                    {user ? 'Start Quiz' : 'Sign In to Start'}
                </button>

                {!user && (
                    <div className="auth-footer">
                        Don't have an account? <a href="/register">Create one</a>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ShareQuiz;
