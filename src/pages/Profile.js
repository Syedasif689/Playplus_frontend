import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { videoApi } from '../services/api';
import { checkMilestone, markMilestoneShown, hasShownMilestone } from '../services/milestoneService';
import MilestoneNotification from '../components/MilestoneNotification';
import MilestoneCelebration from '../components/MilestoneCelebration';
import '../styles/Profile.css';

function Profile() {
    const { user, logout, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [userVideos, setUserVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(null);
    const [subscriberCount, setSubscriberCount] = useState(0);
    const [showMilestone, setShowMilestone] = useState(false);
    const [milestoneData, setMilestoneData] = useState(null);
    const [showCelebration, setShowCelebration] = useState(false);
    const [stats, setStats] = useState({
        totalVideos: 0,
        totalViews: 0,
        totalLikes: 0
    });

    // Edit Profile States
    const [isEditing, setIsEditing] = useState(false);
    const [bio, setBio] = useState('');
    const [editedBio, setEditedBio] = useState('');
    const [links, setLinks] = useState([]);
    const [newLink, setNewLink] = useState({ title: '', url: '' });
    const [socialLinks, setSocialLinks] = useState({
        youtube: '',
        twitter: '',
        instagram: '',
        github: '',
        website: ''
    });
    const [editedSocialLinks, setEditedSocialLinks] = useState({});
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Load profile data from localStorage
    useEffect(() => {
        if (user) {
            // Load bio
            const savedBio = localStorage.getItem(`bio_${user.id}`);
            if (savedBio) {
                setBio(savedBio);
                setEditedBio(savedBio);
            }

            // Load social links
            const savedSocialLinks = localStorage.getItem(`socialLinks_${user.id}`);
            if (savedSocialLinks) {
                const parsed = JSON.parse(savedSocialLinks);
                setSocialLinks(parsed);
                setEditedSocialLinks(parsed);
            }

            // Load custom links
            const savedLinks = localStorage.getItem(`customLinks_${user.id}`);
            if (savedLinks) {
                setLinks(JSON.parse(savedLinks));
            }
        }
    }, [user]);

    // Calculate subscriber count
    const calculateSubscriberCount = useCallback((channelName) => {
        let count = 0;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('subscriptions_')) {
                try {
                    const subscriptions = JSON.parse(localStorage.getItem(key) || '[]');
                    if (subscriptions.includes(channelName)) {
                        count++;
                    }
                } catch (e) {}
            }
        }
        return count;
    }, []);

    // Check for milestone
    const checkForMilestone = useCallback((currentCount, prevCount) => {
        const milestone = checkMilestone(currentCount, prevCount);
        
        if (milestone) {
            const alreadyShown = hasShownMilestone(user?.id, milestone.count);
            
            if (!alreadyShown && user?.id) {
                setMilestoneData(milestone);
                setShowCelebration(true);
                
                setTimeout(() => {
                    setShowCelebration(false);
                    setShowMilestone(true);
                }, 3000);
                
                markMilestoneShown(user.id, milestone.count);
            }
        }
    }, [user]);

    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/');
            return;
        }
    }, [authLoading, user, navigate]);

    useEffect(() => {
        if (!user) return;

        const loadUserVideos = async () => {
            try {
                const response = await videoApi.getAll();
                const allVideos = response.data || [];
                const userVideosList = allVideos.filter(v => v.creator === user.username);
                
                setUserVideos(userVideosList);
                
                const totalViews = userVideosList.reduce((sum, v) => sum + (v.views || 0), 0);
                const totalLikes = userVideosList.reduce((sum, v) => sum + (v.likes || 0), 0);
                
                setStats({
                    totalVideos: userVideosList.length,
                    totalViews: totalViews,
                    totalLikes: totalLikes
                });

                const prevCount = subscriberCount;
                const subCount = calculateSubscriberCount(user.username);
                setSubscriberCount(subCount);

                checkForMilestone(subCount, prevCount);

            } catch (error) {
                console.error('Error loading user videos:', error);
            }
            setLoading(false);
        };

        loadUserVideos();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, calculateSubscriberCount, checkForMilestone]);

    // Profile Edit Functions
    const handleStartEdit = () => {
        setEditedBio(bio);
        setEditedSocialLinks({...socialLinks});
        setIsEditing(true);
        setSaveSuccess(false);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setSaveSuccess(false);
    };

    const handleSaveProfile = () => {
        // Save bio
        localStorage.setItem(`bio_${user.id}`, editedBio);
        setBio(editedBio);

        // Save social links
        localStorage.setItem(`socialLinks_${user.id}`, JSON.stringify(editedSocialLinks));
        setSocialLinks(editedSocialLinks);

        // Save custom links
        localStorage.setItem(`customLinks_${user.id}`, JSON.stringify(links));

        setIsEditing(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
    };

    const handleSocialLinkChange = (platform, value) => {
        setEditedSocialLinks(prev => ({
            ...prev,
            [platform]: value
        }));
    };

    const handleAddCustomLink = () => {
        if (newLink.title.trim() && newLink.url.trim()) {
            // Add http:// if not present
            let url = newLink.url;
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                url = 'https://' + url;
            }
            setLinks([...links, { ...newLink, url }]);
            setNewLink({ title: '', url: '' });
        }
    };

    const handleRemoveCustomLink = (index) => {
        setLinks(links.filter((_, i) => i !== index));
    };

    const handleMilestoneClose = () => {
        setShowMilestone(false);
        setMilestoneData(null);
    };

    const handleCelebrationComplete = () => {
        setShowCelebration(false);
    };

    const handleDelete = async (videoId) => {
        if (!window.confirm('Are you sure you want to delete this video?')) {
            return;
        }

        setDeleting(videoId);
        try {
            await videoApi.delete(videoId);
            setUserVideos(prev => prev.filter(v => v.id !== videoId));
            setStats(prev => ({
                ...prev,
                totalVideos: prev.totalVideos - 1
            }));
            alert('✅ Video deleted successfully!');
        } catch (error) {
            console.error('Error deleting video:', error);
            alert('Failed to delete video. Please try again.');
        }
        setDeleting(null);
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    if (authLoading || loading) {
        return (
            <div className="profile-container">
                <div className="loading-spinner">Loading profile...</div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="profile-container">
            {/* Milestone Notification */}
            {showMilestone && milestoneData && (
                <MilestoneNotification 
                    milestone={milestoneData} 
                    onClose={handleMilestoneClose}
                />
            )}
            
            {/* Milestone Celebration */}
            {showCelebration && milestoneData && (
                <MilestoneCelebration 
                    milestone={milestoneData} 
                    onComplete={handleCelebrationComplete}
                />
            )}

            {/* Channel Banner */}
            <div className="profile-banner">
                <div className="profile-banner-content">
                    <div className="profile-avatar">
                        <div className="avatar-large">
                            {user.username?.charAt(0).toUpperCase() || 'U'}
                        </div>
                    </div>
                    <div className="profile-info">
                        <div className="profile-header-row">
                            <h1>{user.username}</h1>
                            {!isEditing && (
                                <button className="edit-profile-btn" onClick={handleStartEdit}>
                                    ✏️ Edit Profile
                                </button>
                            )}
                        </div>
                        <p className="profile-email">{user.email}</p>
                        
                        {/* Bio Section */}
                        {!isEditing ? (
                            bio ? (
                                <div className="profile-bio">
                                    <p>{bio}</p>
                                    {links.length > 0 && (
                                        <div className="profile-links">
                                            {links.map((link, index) => (
                                                <a 
                                                    key={index}
                                                    href={link.url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="profile-link"
                                                >
                                                    🔗 {link.title}
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                    {Object.entries(socialLinks).some(([_, value]) => value) && (
                                        <div className="profile-social-links">
                                            {socialLinks.youtube && (
                                                <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer">
                                                    <span className="social-icon">▶️</span>
                                                </a>
                                            )}
                                            {socialLinks.twitter && (
                                                <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer">
                                                    <span className="social-icon">🐦</span>
                                                </a>
                                            )}
                                            {socialLinks.instagram && (
                                                <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer">
                                                    <span className="social-icon">📸</span>
                                                </a>
                                            )}
                                            {socialLinks.github && (
                                                <a href={socialLinks.github} target="_blank" rel="noopener noreferrer">
                                                    <span className="social-icon">💻</span>
                                                </a>
                                            )}
                                            {socialLinks.website && (
                                                <a href={socialLinks.website} target="_blank" rel="noopener noreferrer">
                                                    <span className="social-icon">🌐</span>
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="profile-bio-empty">No bio yet. Click "Edit Profile" to add one.</p>
                            )
                        ) : (
                            // Edit Mode
                            <div className="profile-edit-mode">
                                <div className="edit-section">
                                    <label>Bio</label>
                                    <textarea
                                        value={editedBio}
                                        onChange={(e) => setEditedBio(e.target.value)}
                                        placeholder="Tell your viewers about yourself..."
                                        rows={4}
                                        className="bio-textarea"
                                    />
                                </div>

                                <div className="edit-section">
                                    <label>Social Links</label>
                                    <div className="social-links-edit">
                                        <div className="social-link-input">
                                            <span className="social-label">▶️ YouTube</span>
                                            <input
                                                type="url"
                                                value={editedSocialLinks.youtube || ''}
                                                onChange={(e) => handleSocialLinkChange('youtube', e.target.value)}
                                                placeholder="https://youtube.com/@yourchannel"
                                            />
                                        </div>
                                        <div className="social-link-input">
                                            <span className="social-label">🐦 Twitter</span>
                                            <input
                                                type="url"
                                                value={editedSocialLinks.twitter || ''}
                                                onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
                                                placeholder="https://twitter.com/yourhandle"
                                            />
                                        </div>
                                        <div className="social-link-input">
                                            <span className="social-label">📸 Instagram</span>
                                            <input
                                                type="url"
                                                value={editedSocialLinks.instagram || ''}
                                                onChange={(e) => handleSocialLinkChange('instagram', e.target.value)}
                                                placeholder="https://instagram.com/yourhandle"
                                            />
                                        </div>
                                        <div className="social-link-input">
                                            <span className="social-label">💻 GitHub</span>
                                            <input
                                                type="url"
                                                value={editedSocialLinks.github || ''}
                                                onChange={(e) => handleSocialLinkChange('github', e.target.value)}
                                                placeholder="https://github.com/yourusername"
                                            />
                                        </div>
                                        <div className="social-link-input">
                                            <span className="social-label">🌐 Website</span>
                                            <input
                                                type="url"
                                                value={editedSocialLinks.website || ''}
                                                onChange={(e) => handleSocialLinkChange('website', e.target.value)}
                                                placeholder="https://yourwebsite.com"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="edit-section">
                                    <label>Custom Links</label>
                                    <div className="custom-links-edit">
                                        {links.map((link, index) => (
                                            <div key={index} className="custom-link-item">
                                                <span>🔗 {link.title}</span>
                                                <button 
                                                    className="remove-link-btn"
                                                    onClick={() => handleRemoveCustomLink(index)}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                        <div className="add-link-row">
                                            <input
                                                type="text"
                                                placeholder="Link title (e.g., My Website)"
                                                value={newLink.title}
                                                onChange={(e) => setNewLink({...newLink, title: e.target.value})}
                                                className="link-title-input"
                                            />
                                            <input
                                                type="text"
                                                placeholder="URL"
                                                value={newLink.url}
                                                onChange={(e) => setNewLink({...newLink, url: e.target.value})}
                                                className="link-url-input"
                                            />
                                            <button className="add-link-btn" onClick={handleAddCustomLink}>
                                                + Add
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="edit-actions">
                                    <button className="save-btn" onClick={handleSaveProfile}>
                                        💾 Save Changes
                                    </button>
                                    <button className="cancel-btn" onClick={handleCancelEdit}>
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}

                        {saveSuccess && (
                            <div className="save-success">✅ Profile updated successfully!</div>
                        )}

                        {/* Subscriber Count */}
                        <div className="profile-subscriber-count">
                            <span className="subscriber-number">{subscriberCount}</span>
                            <span className="subscriber-label">Subscribers</span>
                        </div>

                        <div className="profile-stats">
                            <div className="stat-item">
                                <span className="stat-number">{stats.totalVideos}</span>
                                <span className="stat-label">Videos</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-number">{stats.totalViews}</span>
                                <span className="stat-label">Views</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-number">{stats.totalLikes}</span>
                                <span className="stat-label">Likes</span>
                            </div>
                        </div>
                    </div>
                    <button className="logout-profile-btn" onClick={handleLogout}>
                        Sign Out
                    </button>
                </div>
            </div>

            {/* Uploaded Videos Section */}
            <div className="profile-videos-section">
                <div className="section-header">
                    <h2>My Videos</h2>
                    <Link to="/upload" className="upload-btn-small">
                        + Upload New
                    </Link>
                </div>

                {loading ? (
                    <div className="loading-spinner">Loading your videos...</div>
                ) : userVideos.length > 0 ? (
                    <div className="videos-grid">
                        {userVideos.map(video => (
                            <div key={video.id} className="video-card">
                                <Link to={`/watch/${video.id}`}>
                                    <div className="video-thumbnail">
                                        <img src={video.thumbnail || 'https://picsum.photos/300/180'} alt={video.title} />
                                        <div className="video-duration">
                                            {video.views || 0} views
                                        </div>
                                    </div>
                                    <div className="video-info">
                                        <h3>{video.title}</h3>
                                        <p>{video.description?.slice(0, 60)}...</p>
                                        <div className="video-meta">
                                            <span>👍 {video.likes || 0}</span>
                                            <span>📅 {new Date(video.uploadedAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </Link>
                                <div className="video-actions">
                                    <Link to={`/edit/${video.id}`} className="edit-btn">
                                        ✏️ Edit
                                    </Link>
                                    <button 
                                        className="delete-btn" 
                                        onClick={() => handleDelete(video.id)}
                                        disabled={deleting === video.id}
                                    >
                                        {deleting === video.id ? 'Deleting...' : '🗑️ Delete'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="no-videos">
                        <p>You haven't uploaded any videos yet.</p>
                        <Link to="/upload" className="upload-btn-primary">
                            Upload Your First Video
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Profile;