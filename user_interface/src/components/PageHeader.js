import React from 'react';
import { FiChevronLeft } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import '../style/AddQuiz.css'; // Reusing existing header styles

const PageHeader = ({ title, onBack }) => {
    const navigate = useNavigate();

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            navigate(-1);
        }
    };

    return (
        <header className="addquiz-header" style={{ marginBottom: '30px' }}>
            <button onClick={handleBack} className="back-button" aria-label="Go back">
                <FiChevronLeft />
            </button>
            <h1 className="page-title">{title}</h1>
        </header>
    );
};

export default PageHeader;
