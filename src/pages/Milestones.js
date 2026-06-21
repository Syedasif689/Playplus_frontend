import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getAchievedMilestones, getShownMilestones } from '../services/milestoneService';
import '../styles/Milestones.css';

function Milestones() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [subscriberCount, setSubscriberCount] = useState(0);
    const [achievedMilestones, setAchievedMilestones] = useState([]);
    const [shownMilestones, setShownMilestones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMilestone, setSelectedMilestone] = useState(null);

    // All milestones with detailed info
    const allMilestones = [
        {
            count: 50,
            label: '50',
            emoji: '🎉',
            title: 'First Steps',
            message: 'You\'ve reached 50 subscribers! Every journey begins with a single step.',
            icon: '🌱',
            color: '#4CAF50',
            badge: 'Bronze'
        },
        {
            count: 100,
            label: '100',
            emoji: '🎊',
            title: 'Growing Strong',
            message: '100 subscribers! Your channel is gaining momentum.',
            icon: '🌿',
            color: '#8BC34A',
            badge: 'Bronze'
        },
        {
            count: 500,
            label: '500',
            emoji: '🌟',
            title: 'Rising Star',
            message: '500 subscribers! You\'re becoming a recognized creator.',
            icon: '⭐',
            color: '#FFC107',
            badge: 'Silver'
        },
        {
            count: 1000,
            label: '1K',
            emoji: '🔥',
            title: 'On Fire',
            message: '1K subscribers! You\'re officially a content creator!',
            icon: '🚀',
            color: '#FF9800',
            badge: 'Silver'
        },
        {
            count: 5000,
            label: '5K',
            emoji: '💎',
            title: 'Community Builder',
            message: '5K subscribers! You\'ve built a thriving community.',
            icon: '🏗️',
            color: '#9C27B0',
            badge: 'Gold'
        },
        {
            count: 10000,
            label: '10K',
            emoji: '⭐',
            title: 'Star Creator',
            message: '10K subscribers! You\'re a star in the making!',
            icon: '🌟',
            color: '#E91E63',
            badge: 'Gold'
        },
        {
            count: 50000,
            label: '50K',
            emoji: '🏆',
            title: 'Influencer',
            message: '50K subscribers! You\'re a true influencer.',
            icon: '👑',
            color: '#F44336',
            badge: 'Platinum'
        },
        {
            count: 100000,
            label: '100K',
            emoji: '🏆',
            title: 'YouTube Legend',
            message: '100K subscribers! You\'ve reached the Silver Play Button!',
            icon: '🎬',
            color: '#607D8B',
            badge: 'Platinum'
        },
        {
            count: 1000000,
            label: '1M',
            emoji: '👑',
            title: 'YouTube Icon',
            message: '1 MILLION subscribers! You\'re a YouTube icon! Golden Play Button unlocked!',
            icon: '🏆',
            color: '#FFD700',
            badge: 'Diamond'
        }
    ];

    useEffect(() => {
        if (!user) {
            navigate('/');
            return;
        }

        const loadMilestones = () => {
            // Calculate subscriber count
            let count = 0;
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('subscriptions_')) {
                    try {
                        const subscriptions = JSON.parse(localStorage.getItem(key) || '[]');
                        if (subscriptions.includes(user.username)) {
                            count++;
                        }
                    } catch (e) {}
                }
            }
            setSubscriberCount(count);

            // Get achieved milestones
            const achieved = getAchievedMilestones(count);
            setAchievedMilestones(achieved);

            // Get shown milestones
            const shown = getShownMilestones(user.id);
            setShownMilestones(shown);

            setLoading(false);
        };

        loadMilestones();
    }, [user, navigate]);

    const formatSubscriberCount = (count) => {
        if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
        if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
        return count;
    };

    const getNextMilestone = () => {
        for (const milestone of allMilestones) {
            if (milestone.count > subscriberCount) {
                return milestone;
            }
        }
        return null;
    };

    const getProgressPercentage = () => {
        const next = getNextMilestone();
        if (!next) return 100;
        
        const prev = allMilestones.filter(m => m.count < next.count);
        const prevCount = prev.length > 0 ? prev[prev.length - 1].count : 0;
        const current = subscriberCount - prevCount;
        const total = next.count - prevCount;
        return Math.min((current / total) * 100, 100);
    };

    const isMilestoneAchieved = (milestoneCount) => {
        return subscriberCount >= milestoneCount;
    };

    const isMilestoneShown = (milestoneCount) => {
        return shownMilestones.includes(milestoneCount);
    };

    const handleMilestoneClick = (milestone) => {
        setSelectedMilestone(selectedMilestone?.count === milestone.count ? null : milestone);
    };

    if (loading) {
        return (
            <div className="milestones-container">
                <div className="loading-spinner"></div>
                <p>Loading your milestones...</p>
            </div>
        );
    }

    const nextMilestone = getNextMilestone();
    const progress = getProgressPercentage();

    return (
        <div className="milestones-container">
            <div className="milestones-header">
                <h1>🏆 Milestones</h1>
                <p>Track your achievements and celebrate your journey</p>
            </div>

            {/* Stats Summary */}
            <div className="milestones-stats">
                <div className="stat-card">
                    <div className="stat-number">{formatSubscriberCount(subscriberCount)}</div>
                    <div className="stat-label">Subscribers</div>
                </div>
                <div className="stat-card">
                    <div className="stat-number">{achievedMilestones.length}</div>
                    <div className="stat-label">Milestones Achieved</div>
                </div>
                <div className="stat-card">
                    <div className="stat-number">{allMilestones.length - achievedMilestones.length}</div>
                    <div className="stat-label">Milestones Remaining</div>
                </div>
            </div>

            {/* Next Milestone Progress */}
            <div className="next-milestone">
                <h2>Next Milestone</h2>
                {nextMilestone ? (
                    <div className="next-milestone-card">
                        <div className="next-milestone-icon">{nextMilestone.emoji}</div>
                        <div className="next-milestone-info">
                            <div className="next-milestone-label">{nextMilestone.label}</div>
                            <div className="next-milestone-title">{nextMilestone.title}</div>
                            <div className="progress-container">
                                <div className="progress-bar" style={{ width: `${progress}%` }}></div>
                            </div>
                            <div className="progress-text">
                                {formatSubscriberCount(subscriberCount)} / {formatSubscriberCount(nextMilestone.count)} subscribers
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="next-milestone-complete">
                        🎉 You've achieved all milestones! You're a YouTube legend!
                    </div>
                )}
            </div>

            {/* Milestones Grid */}
            <div className="milestones-grid">
                {allMilestones.map((milestone) => {
                    const achieved = isMilestoneAchieved(milestone.count);
                    const shown = isMilestoneShown(milestone.count);
                    const isSelected = selectedMilestone?.count === milestone.count;

                    return (
                        <div
                            key={milestone.count}
                            className={`milestone-card ${achieved ? 'achieved' : 'locked'} ${shown ? 'celebrated' : ''}`}
                            onClick={() => handleMilestoneClick(milestone)}
                            style={{ borderColor: achieved ? milestone.color : '#2a2a2a' }}
                        >
                            <div className="milestone-badge">
                                {achieved ? (
                                    <span className="milestone-check">✅</span>
                                ) : (
                                    <span className="milestone-lock">🔒</span>
                                )}
                            </div>
                            <div className="milestone-emoji">{milestone.emoji}</div>
                            <div className="milestone-count">{milestone.label}</div>
                            <div className="milestone-title">{milestone.title}</div>
                            <div className="milestone-badge-label">{milestone.badge}</div>
                            
                            {isSelected && (
                                <div className="milestone-details-expanded">
                                    <div className="milestone-icon-large">{milestone.icon}</div>
                                    <div className="milestone-message">{milestone.message}</div>
                                    {achieved && (
                                        <div className="milestone-achieved-date">
                                            ✅ Achieved!
                                            {shown && <span> 🎉 Celebrated!</span>}
                                        </div>
                                    )}
                                    {!achieved && (
                                        <div className="milestone-progress-text">
                                            {formatSubscriberCount(subscriberCount)} / {formatSubscriberCount(milestone.count)}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default Milestones;