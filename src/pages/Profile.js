import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { videoApi } from '../services/api';
import '../styles/Profile.css';

function Profile() {
    const { user, logout, loading: authLoading } = useAuth(); // ✅ Get loading state
    const navigate = useNavigate();
    const [userVideos, setUserVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(null);
    const [subscriberCount, setSubscriberCount] = useState(0);
    const [stats, setStats] = useState({
        totalVideos: 0,
        totalViews: 0,
        totalLikes: 0
    });

    // ✅ Wait for auth to load before checking user
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
                
                // Only show videos where creator matches current user
                const userVideosList = allVideos.filter(v => 
                    v.creator === user.username
                );
                
                setUserVideos(userVideosList);
                
                const totalViews = userVideosList.reduce((sum, v) => sum + (v.views || 0), 0);
                const totalLikes = userVideosList.reduce((sum, v) => sum + (v.likes || 0), 0);
                
                setStats({
                    totalVideos: userVideosList.length,
                    totalViews: totalViews,
                    totalLikes: totalLikes
                });

                // Calculate subscriber count
                const subCount = calculateSubscriberCount(user.username);
                setSubscriberCount(subCount);

            } catch (error) {
                console.error('Error loading user videos:', error);
            }
            setLoading(false);
        };

        loadUserVideos();
    }, [user]);

    // Calculate subscriber count from all users
    const calculateSubscriberCount = (channelName) => {
        let count = 0;
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('subscriptions_')) {
                try {
                    const subscriptions = JSON.parse(localStorage.getItem(key) || '[]');
                    if (subscriptions.includes(channelName)) {
                        count++;
                    }
                } catch (e) {
                    // Skip invalid data
                }
            }
        }
        
        return count;
    };

    const handleDelete = async (videoId) => {
        if (!window.confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
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

    // ✅ Show loading while auth is loading
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
            {/* Channel Banner */}
            <div className="profile-banner">
                <div className="profile-banner-content">
                    <div className="profile-avatar">
                        <div className="avatar-large">
                            {user.username?.charAt(0).toUpperCase() || 'U'}
                        </div>
                    </div>
                    <div className="profile-info">
                        <h1>{user.username}</h1>
                        <p className="profile-email">{user.email}</p>
                        
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