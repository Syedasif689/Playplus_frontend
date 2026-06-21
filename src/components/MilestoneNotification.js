import React, { useState, useEffect } from 'react';
import '../styles/MilestoneNotification.css';

function MilestoneNotification({ milestone, onClose }) {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        // Auto dismiss after 8 seconds
        const timer = setTimeout(() => {
            setVisible(false);
            setTimeout(onClose, 500);
        }, 8000);

        return () => clearTimeout(timer);
    }, [onClose]);

    if (!visible) return null;

    return (
        <div className="milestone-notification show">
            <div className="milestone-content">
                <div className="milestone-icon">{milestone.emoji}</div>
                <div className="milestone-details">
                    <div className="milestone-title">🎯 Milestone Reached!</div>
                    <div className="milestone-count">{milestone.label} Subscribers</div>
                    <div className="milestone-message">{milestone.message}</div>
                </div>
                <button className="milestone-close" onClick={() => {
                    setVisible(false);
                    setTimeout(onClose, 500);
                }}>
                    ✕
                </button>
            </div>
            <div className="milestone-progress">
                <div className="milestone-progress-bar" style={{ width: '100%' }}></div>
            </div>
        </div>
    );
}

export default MilestoneNotification;