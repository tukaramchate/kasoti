import React from 'react';

const StatsCard = ({ value, label }) => {
    return (
        <div className="bg-[color:var(--bg-card)] border border-[color:var(--border)] py-5 px-7 rounded-lg text-center min-w-[130px] transition-all duration-150 hover:shadow-sm">
            <div className="text-2xl font-bold text-[color:var(--accent)]">{value}</div>
            <div className="text-[color:var(--text-muted)] text-xs mt-0.5 font-medium">{label}</div>
        </div>
    );
};

export default StatsCard;
