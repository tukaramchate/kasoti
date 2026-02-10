import React from 'react';

const QuizSkeleton = () => {
  return (
    <div className="quiz-card" style={{ pointerEvents: 'none' }}>
      <div className="quiz-card-header">
        <div className="skeleton" style={{ width: '60%', height: '20px' }}></div>
        <div className="skeleton" style={{ width: '20%', height: '20px', borderRadius: '9999px' }}></div>
      </div>
      <div className="quiz-card-meta">
        <div className="skeleton" style={{ width: '30%', height: '16px' }}></div>
        <div className="skeleton" style={{ width: '30%', height: '16px' }}></div>
      </div>
      <div className="quiz-card-footer" style={{ paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="skeleton" style={{ width: '28px', height: '28px', borderRadius: '50%' }}></div>
          <div className="skeleton" style={{ width: '80px', height: '14px' }}></div>
        </div>
      </div>
    </div>
  );
};

export default QuizSkeleton;
