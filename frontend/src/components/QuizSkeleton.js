import React from 'react';

const QuizSkeleton = () => {
  return (
    <div className="bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-lg p-[18px] pointer-events-none">
      <div className="flex justify-between items-start mb-2.5 gap-2.5">
        <div className="skeleton w-[60%] h-5"></div>
        <div className="skeleton w-[20%] h-5 rounded-full"></div>
      </div>
      <div className="flex gap-3.5 mb-3.5">
        <div className="skeleton w-[30%] h-4"></div>
        <div className="skeleton w-[30%] h-4"></div>
      </div>
      <div className="pt-4 border-t border-[color:var(--border-light)] flex items-center gap-2">
        <div className="skeleton w-7 h-7 rounded-full"></div>
        <div className="skeleton w-20 h-3.5"></div>
      </div>
    </div>
  );
};

export default QuizSkeleton;
