import React from 'react';
import '../style/Home.css';

const StatsCard = ({ value, label }) => {
    return (
        <div className="stat-card">
            <div className="stat-value">{value}</div>
            <div className="stat-label">{label}</div>
        </div>
    );
};

export default StatsCard;
