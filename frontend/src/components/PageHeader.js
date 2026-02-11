import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';

const PageHeader = ({ title }) => {
    const navigate = useNavigate();

    return (
        <div className="page-header">
            <button className="back-btn" onClick={() => navigate('/home')}>
                <FiArrowLeft /> Back
            </button>
            <h1>{title}</h1>
        </div>
    );
};

export default PageHeader;
