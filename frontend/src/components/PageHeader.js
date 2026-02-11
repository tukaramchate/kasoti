import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';

const PageHeader = ({ title }) => {
    const navigate = useNavigate();

    return (
        <div className="flex items-center gap-3 mb-6">
            <button
                className="flex items-center gap-2 px-4 py-2.5 bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded text-sm font-medium text-[color:var(--text-secondary)] cursor-pointer transition-all duration-150 hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
                onClick={() => navigate(-1)}
            >
                <FiArrowLeft /> Back
            </button>
            <h1 className="text-xl font-semibold text-[color:var(--text-primary)] m-0">{title}</h1>
        </div>
    );
};

export default PageHeader;
