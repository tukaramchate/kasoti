import React, { useContext } from 'react';
import { FiClock, FiEdit, FiAward, FiTrash2 } from 'react-icons/fi';
import { UserContext } from '../userContext';
import { useNavigate } from 'react-router-dom';
import '../style/Home.css';

const QuizCard = ({ quiz, onClick, onDelete }) => {
    const { user } = useContext(UserContext);
    const navigate = useNavigate();
    const currentUser = user?.user;
    const isOwner = currentUser?.username === quiz.username;

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

    return (
        <div className="quiz-card" onClick={onClick}>
            <div className="quiz-card-header">
                <h3 className="quiz-card-title">{quiz.title}</h3>
                <div className="quiz-card-badges">
                    <span className="quiz-card-category-badge">
                        {quiz.category || 'General'}
                    </span>
                    <span className="quiz-card-badge">
                        {quiz.questions?.length || 0} Q
                    </span>
                </div>
            </div>
            <div className="quiz-card-meta">
                <span><FiClock /> {(quiz.questions?.length || 0) * 30}s</span>
                <span
                    onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = `/leaderboard/${quiz.id}`;
                    }}
                    title="View Leaderboard"
                    className="leaderboard-link-icon"
                >
                    <FiAward /> Leaderboard
                </span>
            </div>
            <div className="quiz-card-footer">
                <div className="quiz-card-author">
                    <div className="quiz-card-author-avatar">
                        {quiz.username?.charAt(0).toUpperCase()}
                    </div>
                    <span className="quiz-card-author-name">
                        By {quiz.username}
                    </span>
                </div>
                {isOwner && (
                    <div className="quiz-card-actions">
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
