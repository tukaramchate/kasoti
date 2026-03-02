import React from 'react';

const StatsCard = ({ value, label }) => {
    return (
        <div className="bg-[color:var(--bg-card)]/80 backdrop-blur-lg border border-[color:var(--border)] py-6 px-8 rounded-2xl text-center min-w-[150px] transition-all duration-300 hover:shadow-glow hover:-translate-y-1 hover:border-[color:var(--accent-subtle)] relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-[color:var(--accent)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[color:var(--accent)] to-purple-500 mb-1 relative z-10">{value}</div>
            <div className="text-[color:var(--text-secondary)] text-[13px] font-semibold tracking-wide uppercase relative z-10">{label}</div>
        </div>
    );
};

export default StatsCard;
