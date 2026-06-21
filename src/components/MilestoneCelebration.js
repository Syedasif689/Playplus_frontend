import React, { useState, useEffect } from 'react';
import '../styles/MilestoneNotification.css';

function MilestoneCelebration({ milestone, onComplete }) {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        // Auto dismiss after 3 seconds
        const timer = setTimeout(() => {
            setVisible(false);
            setTimeout(onComplete, 500);
        }, 3000);

        return () => clearTimeout(timer);
    }, [onComplete]);

    if (!visible) return null;

    return (
        <div className="milestone-celebration">
            <div className="celebration-content">
                <div className="celebration-emoji">{milestone.emoji}</div>
                <div className="celebration-text">
                    <div className="celebration-title">🎉 Milestone Unlocked!</div>
                    <div className="celebration-count">{milestone.label} Subscribers</div>
                </div>
                {/* Confetti effect - simple CSS particles */}
                <div className="confetti-container">
                    {[...Array(30)].map((_, i) => (
                        <div 
                            key={i} 
                            className="confetti" 
                            style={{
                                left: Math.random() * 100 + '%',
                                animationDelay: Math.random() * 2 + 's',
                                backgroundColor: ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff6bff'][Math.floor(Math.random() * 5)],
                                width: (Math.random() * 8 + 4) + 'px',
                                height: (Math.random() * 8 + 4) + 'px',
                            }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

export default MilestoneCelebration;