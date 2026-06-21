// Milestone thresholds
const MILESTONES = [
    { count: 50, label: '50', emoji: '🎉', message: 'You\'ve reached 50 subscribers! Keep creating!' },
    { count: 100, label: '100', emoji: '🎊', message: '100 subscribers! Your channel is growing!' },
    { count: 500, label: '500', emoji: '🌟', message: '500 subscribers! You\'re becoming a recognized creator!' },
    { count: 1000, label: '1K', emoji: '🔥', message: '1K subscribers! You\'re on fire!' },
    { count: 5000, label: '5K', emoji: '💎', message: '5K subscribers! You\'ve built a thriving community!' },
    { count: 10000, label: '10K', emoji: '⭐', message: '10K subscribers! You\'re a star!' },
    { count: 50000, label: '50K', emoji: '🏆', message: '50K subscribers! You\'re a true influencer!' },
    { count: 100000, label: '100K', emoji: '🏆', message: '100K subscribers! You\'ve reached the Silver Play Button!' },
    { count: 1000000, label: '1M', emoji: '👑', message: '1 MILLION subscribers! You\'re a YouTube icon!' },
];

// Check if a milestone has been reached
export const checkMilestone = (currentCount, previousCount) => {
    const reached = MILESTONES.find(m => 
        currentCount >= m.count && previousCount < m.count
    );
    
    if (reached) {
        return {
            ...reached,
            reached: true
        };
    }
    
    return null;
};

// Get all milestones a user has achieved
export const getAchievedMilestones = (subscriberCount) => {
    return MILESTONES.filter(m => subscriberCount >= m.count);
};

// Get all milestones
export const getAllMilestones = () => {
    return MILESTONES;
};

// Check if a milestone notification was already shown
export const hasShownMilestone = (userId, milestoneCount) => {
    const key = `milestone_${userId}_${milestoneCount}`;
    return localStorage.getItem(key) === 'true';
};

// Mark milestone as shown
export const markMilestoneShown = (userId, milestoneCount) => {
    const key = `milestone_${userId}_${milestoneCount}`;
    localStorage.setItem(key, 'true');
};

// Get all shown milestones
export const getShownMilestones = (userId) => {
    const milestones = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`milestone_${userId}_`)) {
            const count = parseInt(key.split('_')[2]);
            milestones.push(count);
        }
    }
    return milestones;
};