import React, { useState } from 'react';
import { FiClock, FiEdit, FiAward, FiTrash2, FiUsers, FiSend, FiLock, FiShare2, FiTag } from 'react-icons/fi';
import { useAuth } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import { quizAPI } from '../api';
import { toast } from 'react-toastify';
import ConfirmDialog from './ConfirmDialog';

const QuizCard = ({ quiz, onClick, onDelete, onPublish, onClose }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const currentUser = user?.user;
    const isOwner = currentUser?.username === (quiz.creatorUsername || quiz.username);
    const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null });

    const handleEdit = (e) => {
        e.stopPropagation();
        navigate(`/editQuiz/${quiz.id}`);
    };

    const handleDelete = (e) => {
        e.stopPropagation();
        setConfirmDialog({
            open: true,
            title: 'Delete Quiz',
            message: `Are you sure you want to delete "${quiz.title}"?`,
            onConfirm: () => onDelete && onDelete(quiz.id),
        });
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
                        <div className="text-xs mt-1 opacity-80">
                            Share code: <strong>{shareCode}</strong>
                        </div>
                    </div>,
                    { autoClose: 8000 }
                );
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
        setConfirmDialog({
            open: true,
            title: 'Close Quiz',
            message: `Close "${quiz.title}"? Students will no longer be able to attempt it.`,
            onConfirm: async () => {
                try {
                    await quizAPI.closeQuiz(quiz.id);
                    toast.success('Quiz closed');
                    if (onClose) onClose(quiz.id);
                } catch (error) {
                    toast.error(error.response?.data?.message || 'Failed to close quiz');
                }
            },
        });
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

    const getStatusBadgeStyles = () => {
        switch (quiz.status) {
            case 'PUBLISHED': return 'bg-[color:var(--success-light)] text-[color:var(--success)]';
            case 'CLOSED': return 'bg-[color:var(--danger-light)] text-[color:var(--danger)]';
            default: return 'bg-[color:var(--bg-hover)] text-[color:var(--text-secondary)]';
        }
    };

    const questionCount = quiz.questionCount || quiz.questions?.length || 0;
    const creatorName = quiz.creatorUsername || quiz.username;
    const difficultyColors = {
        EASY: 'bg-[color:var(--success-light)] text-[color:var(--success)]',
        MEDIUM: 'bg-[color:var(--warning-light)] text-[color:var(--warning)]',
        HARD: 'bg-[color:var(--danger-light)] text-[color:var(--danger)]',
    };
    const tagList = quiz.tags ? quiz.tags.split(',').map(t => t.trim()).filter(Boolean) : [];

    return (
        <>
        <div
            className="bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-lg p-[18px] cursor-pointer transition-all duration-150 hover:border-[color:var(--accent-subtle)] hover:shadow hover:-translate-y-px"
            onClick={onClick}
        >
            {/* Header */}
            <div className="flex justify-between items-start mb-2.5 gap-2.5">
                <h3 className="text-[15px] font-semibold text-[color:var(--text-primary)] m-0 leading-snug">{quiz.title}</h3>
                <div className="flex gap-1 flex-shrink-0 flex-wrap">
                    {quiz.status && quiz.status !== 'PUBLISHED' && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getStatusBadgeStyles()}`}>
                            {quiz.status}
                        </span>
                    )}
                    {quiz.difficulty && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${difficultyColors[quiz.difficulty] || 'bg-[color:var(--bg-hover)] text-[color:var(--text-secondary)]'}`}>
                            {quiz.difficulty}
                        </span>
                    )}
                    <span className="bg-[color:var(--accent-light)] text-[color:var(--accent)] px-2 py-0.5 rounded-full text-[10px] font-semibold">
                        {quiz.category || 'General'}
                    </span>
                    <span className="bg-[color:var(--bg-hover)] text-[color:var(--text-secondary)] px-2 py-0.5 rounded-full text-[10px] font-medium">
                        {questionCount} Q
                    </span>
                </div>
            </div>

            {/* Meta */}
            <div className="flex gap-3.5 text-[color:var(--text-muted)] text-xs mb-3.5">
                <span className="flex items-center gap-1"><FiClock /> {quiz.timeLimitMinutes || questionCount * 1} min</span>
                <span
                    onClick={handleLeaderboard}
                    title="View Leaderboard"
                    className="flex items-center gap-1 cursor-pointer transition-all duration-150 hover:text-[color:var(--accent)]"
                >
                    <FiAward /> Leaderboard
                </span>
            </div>

            {/* Tags */}
            {tagList.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3.5">
                    {tagList.slice(0, 4).map((tag) => (
                        <span key={tag} className="flex items-center gap-0.5 bg-[color:var(--bg-hover)] text-[color:var(--text-muted)] px-1.5 py-0.5 rounded text-[10px]">
                            <FiTag className="text-[8px]" /> {tag}
                        </span>
                    ))}
                    {tagList.length > 4 && <span className="text-[color:var(--text-muted)] text-[10px] py-0.5">+{tagList.length - 4}</span>}
                </div>
            )}

            {/* Footer */}
            <div className="flex justify-between items-center pt-3.5 border-t border-[color:var(--border-light)]">
                <div className="flex items-center gap-2">
                    <div className="w-[26px] h-[26px] bg-[color:var(--accent)] rounded-full flex items-center justify-center text-white text-[10px] font-semibold">
                        {creatorName?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <span className="text-[color:var(--text-muted)] text-xs">
                        By {creatorName || 'Unknown'}
                    </span>
                </div>

                {isOwner && (
                    <div className="flex gap-0.5">
                        {quiz.status === 'DRAFT' && (
                            <button
                                className="w-[30px] h-[30px] bg-transparent border-none rounded-sm cursor-pointer flex items-center justify-center text-sm transition-all duration-150 text-[color:var(--accent)] hover:bg-[color:var(--accent-light)]"
                                onClick={handlePublish}
                                title="Publish Quiz"
                            >
                                <FiSend />
                            </button>
                        )}
                        {quiz.status === 'PUBLISHED' && (
                            <>
                                {quiz.shareCode && (
                                    <button
                                        className="w-[30px] h-[30px] bg-transparent border-none rounded-sm cursor-pointer flex items-center justify-center text-sm transition-all duration-150 text-[color:var(--accent)] hover:bg-[color:var(--accent-light)]"
                                        onClick={handleCopyShareCode}
                                        title="Copy Share Link"
                                    >
                                        <FiShare2 />
                                    </button>
                                )}
                                <button
                                    className="w-[30px] h-[30px] bg-transparent border-none rounded-sm cursor-pointer flex items-center justify-center text-sm transition-all duration-150 text-[color:var(--accent)] hover:bg-[color:var(--accent-light)]"
                                    onClick={handleViewStudents}
                                    title="View Students"
                                >
                                    <FiUsers />
                                </button>
                                <button
                                    className="w-[30px] h-[30px] bg-transparent border-none rounded-sm cursor-pointer flex items-center justify-center text-sm transition-all duration-150 text-[color:var(--danger)] hover:bg-[color:var(--danger-light)]"
                                    onClick={handleClose}
                                    title="Close Quiz"
                                >
                                    <FiLock />
                                </button>
                            </>
                        )}
                        <button
                            className="w-[30px] h-[30px] bg-transparent border-none rounded-sm cursor-pointer flex items-center justify-center text-sm transition-all duration-150 text-[color:var(--accent)] hover:bg-[color:var(--accent-light)]"
                            onClick={handleEdit}
                            title="Edit Quiz"
                        >
                            <FiEdit />
                        </button>
                        <button
                            className="w-[30px] h-[30px] bg-transparent border-none rounded-sm cursor-pointer flex items-center justify-center text-sm transition-all duration-150 text-[color:var(--danger)] hover:bg-[color:var(--danger-light)]"
                            onClick={handleDelete}
                            title="Delete Quiz"
                        >
                            <FiTrash2 />
                        </button>
                    </div>
                )}
            </div>
        </div>

        <ConfirmDialog
            open={confirmDialog.open}
            title={confirmDialog.title}
            message={confirmDialog.message}
            variant="danger"
            onConfirm={() => { confirmDialog.onConfirm?.(); setConfirmDialog(d => ({ ...d, open: false })); }}
            onCancel={() => setConfirmDialog(d => ({ ...d, open: false }))}
        />
        </>
    );
};

export default QuizCard;
