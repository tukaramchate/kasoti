import React from 'react';

const LoadingSpinner = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
            <div className="spinner w-10 h-10"></div>
            <span className="text-[color:var(--text-secondary)] text-sm">Loading...</span>
        </div>
    );
};

export default LoadingSpinner;
