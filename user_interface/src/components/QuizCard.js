import React, { useContext } from 'react';
import { FiClock, FiEdit, FiAward, FiTrash2, FiUsers, FiSend, FiLock, FiShare2 } from 'react-icons/fi';
import { UserContext } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import { quizAPI } from '../api';
import { toast } from 'react-toastify';

const QuizCard = ({ quiz, onClick, onDelete, onPublish, onClose }) => {
    const { user } = useContext(UserContext);
    const navigate = useNavigate();
    const currentUser = user?.user;
    const isOwner = currentUser?.username === (quiz.creatorUsername || quiz.username);

    const handleEdit = (e) => {
        e.stopPropagation();
        navigate(`/editQuiz/${quiz.id}`);
    };

    const handleDelete = (e) => {
        e.stopPropagation();
        if (window.confirm(`Are you sure you want to delete "${quiz.title}"?`)) {
            onDelete && onDelete(quiz.id);
        }
    };

    const handlePublish = async (e) => {
        e.stopPropagation();
        try {
            const response = await quizAPI.publishQuiz(quiz.id);
            const shareCode = response.data?.shareCode;
            if (shareCode) {
                const shareUrl = `${window.location.origin}/share/${shareCode}`;
                toast.success(
                    <div>
                        <div>Quiz published!</div>
                        <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.8 }}>
                            Share code: <strong>{shareCode}</strong>
                        </div>
                    </div>,
                    { autoClose: 8000 }
                );
                // Copy share URL to clipboard
                navigator.clipboard?.writeText(shareUrl);
            } else {
                toast.success('Quiz published successfully!');
            }
            if (onPublish) onPublish(quiz.id);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to publish quiz');
        }
    };

    const handleClose = async (e) => {
        e.stopPropagation();
        if (window.confirm(`Close "${quiz.title}"? Students will no longer be able to attempt it.`)) {
            try {
                await quizAPI.closeQuiz(quiz.id);
                toast.success('Quiz closed');
                if (onClose) onClose(quiz.id);
            } catch (error) {
                toast.error(error.response?.data?.message || 'Failed to close quiz');
            }
        }
    };

    const handleCopyShareCode = (e) => {
        e.stopPropagation();
        const shareUrl = `${window.location.origin}/share/${quiz.shareCode}`;
        navigator.clipboard?.writeText(shareUrl).then(() => {
            toast.success('Share link copied!');
        });
    };

    const handleViewStudents = (e) => {
        e.stopPropagation();
        navigate(`/quiz/${quiz.id}/students`);
    };

    const handleLeaderboard = (e) => {
        e.stopPropagation();
        navigate(`/leaderboard/${quiz.id}`);
    };

    const getStatusBadgeClass = () => {
        switch (quiz.status) {
            case 'PUBLISHED': return 'status-published';
            case 'CLOSED': return 'status-closed';
            default: return 'status-draft';
        }
    };

    const questionCount = quiz.questionCount || quiz.questions?.length || 0;
    const creatorName = quiz.creatorUsername || quiz.username;

    return (
        <div className="quiz-card" onClick={onClick}>
            <div className="quiz-card-header">
                <h3 className="quiz-card-title">{quiz.title}</h3>
                <div className="quiz-card-badges">
                    {quiz.status && quiz.status !== 'PUBLISHED' && (
                        <span className={`quiz-card-badge ${getStatusBadgeClass()}`}>
                            {quiz.status}
                        </span>
                    )}
                    <span className="quiz-card-category-badge">
                        {quiz.category || 'General'}
                    </span>
                    <span className="quiz-card-badge">
                        {questionCount} Q
                    </span>
                </div>
            </div>

            <div className="quiz-card-meta">
                <span><FiClock /> {quiz.timeLimitMinutes || questionCount * 1} min</span>
                <span
                    onClick={handleLeaderboard}
                    title="View Leaderboard"
                    className="leaderboard-link-icon"
                >
                    <FiAward /> Leaderboard
                </span>
            </div>

            <div className="quiz-card-footer">
                <div className="quiz-card-author">
                    <div className="quiz-card-author-avatar">
                        {creatorName?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <span className="quiz-card-author-name">
                        By {creatorName || 'Unknown'}
                    </span>
                </div>

                {isOwner && (
                    <div className="quiz-card-actions">
                        {quiz.status === 'DRAFT' && (
                            <button className="quiz-action-btn edit" onClick={handlePublish} title="Publish Quiz">
                                <FiSend />
                            </button>
                        )}
                        {quiz.status === 'PUBLISHED' && (
                            <>
                                {quiz.shareCode && (
                                    <button className="quiz-action-btn edit" onClick={handleCopyShareCode} title="Copy Share Link">
                                        <FiShare2 />
                                    </button>
                                )}
                                <button className="quiz-action-btn edit" onClick={handleViewStudents} title="View Students">
                                    <FiUsers />
                                </button>
                                <button className="quiz-action-btn delete" onClick={handleClose} title="Close Quiz">
                                    <FiLock />
                                </button>
                            </>
                        )}
                        <button className="quiz-action-btn edit" onClick={handleEdit} title="Edit Quiz">
                            <FiEdit />
                        </button>
                        <button className="quiz-action-btn delete" onClick={handleDelete} title="Delete Quiz">
                            <FiTrash2 />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuizCard;
