import React from 'react';
import '../style/Home.css';

const LoadingSpinner = ({ text = "Loading..." }) => {
    return (
        <div className="loading-container">
            <div className="loading-spinner"></div>
            {text && <p style={{ marginTop: '15px', color: '#666' }}>{text}</p>}
        </div>
    );
};

export default LoadingSpinner;
