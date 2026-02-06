import React from 'react';
import '../style/Home.css';

const QuizSkeleton = () => {
    return (
        <div className="quiz-card quiz-skeleton">
            <div className="skeleton-header">
                <div className="skeleton-title"></div>
                <div className="skeleton-badge"></div>
            </div>
            <div className="skeleton-meta">
                <div className="skeleton-text"></div>
                <div className="skeleton-text"></div>
            </div>
            <div className="skeleton-author">
                <div className="skeleton-avatar"></div>
                <div className="skeleton-name"></div>
            </div>
            <style>{`
        .quiz-skeleton {
          pointer-events: none;
          cursor: default;
        }
        .skeleton-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 15px;
        }
        .skeleton-title {
          height: 24px;
          background-color: #eee;
          width: 60%;
          border-radius: 4px;
          animation: pulse 1.5s infinite;
        }
        .skeleton-badge {
          height: 20px;
          background-color: #eee;
          width: 20%;
          border-radius: 10px;
          animation: pulse 1.5s infinite;
        }
        .skeleton-meta {
          display: flex;
          gap: 15px;
          margin-bottom: 20px;
        }
        .skeleton-text {
          height: 16px;
          background-color: #eee;
          width: 30%;
          border-radius: 4px;
          animation: pulse 1.5s infinite;
        }
        .skeleton-author {
          display: flex;
          align-items: center;
          gap: 10px;
          border-top: 1px solid #f0efff;
          padding-top: 15px;
        }
        .skeleton-avatar {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background-color: #eee;
          animation: pulse 1.5s infinite;
        }
        .skeleton-name {
          height: 16px;
          width: 40%;
          background-color: #eee;
          border-radius: 4px;
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
      `}</style>
        </div>
    );
};

export default QuizSkeleton;
