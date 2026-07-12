import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { videoApi, channelApi, userApi } from '../services/api';import { checkMilestone, markMilestoneShown, hasShownMilestone } from '../services/milestoneService';
import MilestoneNotification from '../components/MilestoneNotification';
import MilestoneCelebration from '../components/MilestoneCelebration';
import '../styles/Profile.css';
import {
  FiEdit,
  FiTrash2,
  FiUpload,
  FiLogOut,
  FiUsers,
  FiVideo,
  FiEye,
  FiCalendar,
  FiThumbsUp
} from "react-icons/fi";
import { uploadToCloudinary } from "../utils/cloudinaryUpload";

function Profile() {
    const { user, setUser, logout, loading: authLoading } = useAuth();    
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
     const handleProfileImage = async (e) => {

    const file = e.target.files[0];

    if (!file) return;

    try {

        const imageUrl = await uploadToCloudinary(
            file,
            "image",
            `playplus/${user.username}/profile`
        );

        console.log(imageUrl);

        // Save into database
       await userApi.updateProfileImage(imageUrl);

       const updatedUser = {
       ...user,
       profileImage: imageUrl
    };

    setUser(updatedUser);

    localStorage.setItem(
    "user",
    JSON.stringify(updatedUser)
   );

    } catch (err) {

        console.error(err);
        alert("Failed to upload profile picture.");

    }
};
 
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

    // Redirect if not logged in
    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/');
            return;
        }
    }, [authLoading, user, navigate]);

    // Load user videos and channel info
    useEffect(() => {
        if (!user) return;

        const loadUserData = async () => {
            try {
                const channelResponse = await channelApi.getChannel(user.username);
                const channelData = channelResponse.data;
                setSubscriberCount(channelData.subscriberCount || 0);

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

                const lastNotified = localStorage.getItem(`lastSubCount_${user.id}`);
                const prevCount = lastNotified ? parseInt(lastNotified) : 0;
                if (channelData.subscriberCount > prevCount) {
                    checkForMilestone(channelData.subscriberCount, prevCount);
                }
                localStorage.setItem(`lastSubCount_${user.id}`, channelData.subscriberCount);

            } catch (error) {
                console.error('Error loading user data:', error);
            }
            setLoading(false);
        };

        loadUserData();
    }, [user, checkForMilestone]);

    

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
            alert('Video deleted successfully!');
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
      
    // ✅ UPDATED: Wave loading animation
    if (authLoading || loading) {
        
    return (
        <div className="profile-container">
            <div className="loading-wrapper">
                {/* Animation container - circle and waves share this space */}
                <div className="loading-animation">
                    {/* Spinner - rotates */}
                    <div className="spinner-wrapper">
                        <div className="spinner-ring"></div>
                    </div>
                    
                    {/* Waves - separate, NOT rotating, same position */}
                    <div className="wave-wrapper">
                        <div className="wave-container">
                            <div className="wave-bar"></div>
                            <div className="wave-bar"></div>
                            <div className="wave-bar"></div>
                            <div className="wave-bar"></div>
                            <div className="wave-bar"></div>
                        </div>
                    </div>
                </div>
                
                {/* Loading text - below the animation, completely separate */}
                <div className="loading-text">
                    Loading<span>.</span><span>.</span><span>.</span>
                </div>
            </div>
        </div>
    );
}

    if (!user) {
        return null;
    }
        console.log("Current User:", user);
        console.log("Profile Image:", user?.profileImage);
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

                           <div
    className="avatar-wrapper"
    onClick={() => document.getElementById("profileImageInput").click()}
>

    {user.profileImage ? (
        <img
        src={`${user.profileImage}?t=${Date.now()}`}
        className="avatar-image"
        alt={user.username}
        />
    ) : (
        <div className="avatar-placeholder">
            {user.username?.charAt(0).toUpperCase()}
        </div>
    )}

</div>

<input
    id="profileImageInput"
    type="file"
    accept="image/*"
    hidden
    onChange={handleProfileImage}
/>
                       </div>
                    <div className="profile-info">
                        <div className="profile-header-row">
                            <h1>{user.username}</h1>
                            <button className="edit-profile-btn">
                               <FiEdit />
                                <span>Edit Profile</span>
                              </button>
                        </div>
                        <p className="profile-email">{user.email}</p>

                        {/* Subscriber Count */}
                        <div className="profile-subscriber-count">
                          <FiUsers className="subscriber-icon" />
                          <span className="subscriber-number">{subscriberCount}</span>
                          <span className="subscriber-label">Subscribers</span>
                        </div>

                        <div className="profile-stats">
    <div className="stat-item">
        <FiVideo className="stat-icon" />
        <span className="stat-number">{stats.totalVideos}</span>
        <span className="stat-label">Videos</span>
    </div>

    <div className="stat-item">
        <FiEye className="stat-icon" />
        <span className="stat-number">{stats.totalViews}</span>
        <span className="stat-label">Views</span>
    </div>

    <div className="stat-item">
        <FiThumbsUp className="stat-icon" />
        <span className="stat-number">{stats.totalLikes}</span>
        <span className="stat-label">Likes</span>
    </div>
</div>

                    </div>
                    <button className="logout-profile-btn" onClick={handleLogout}>
                      <>
                          <FiLogOut />
                         <span>Sign Out</span>
                     </>
                    </button>
                </div>
            </div>

            {/* Uploaded Videos Section */}
            <div className="profile-videos-section">
                <div className="section-header">
                    <h2>My Videos</h2>
                    <Link to="/upload" className="upload-btn-small">
                       <>
                         <FiUpload />
                             <span>Upload New</span>
                        </>
                    </Link>
                </div>

                {userVideos.length > 0 ? (
                    <div className="videos-grid">
                        {userVideos.map(video => (
                            <div key={video.id} className="video-card">
                                <Link to={`/watch/${video.id}`}>
                                    <div className="video-thumbnail">
                                        <img src={video.thumbnail || 'https://picsum.photos/300/180'} alt={video.title} />
                                        <div className="video-duration">
                                         <FiEye />
                                          <span>{video.views || 0} views</span>
                                        </div>
                                    </div>
                                    <div className="video-info">
                                        <h3>{video.title}</h3>
                                        <p>{video.description?.slice(0, 60)}...</p>
                                        <div className="video-meta">
                                        <span>
                                           <FiThumbsUp />
                                           {video.likes || 0}
                                            </span>

                                            <span>
                                            <FiCalendar />
                                            {new Date(video.uploadedAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                                <div className="video-actions">
                                    <Link to={`/edit/${video.id}`} className="edit-btn">
                                     <>
                                      <FiEdit />
                                       <span>Edit</span>
                                     </>
                                    </Link>
                                    <button 
                                        className="delete-btn" 
                                        onClick={() => handleDelete(video.id)}
                                        disabled={deleting === video.id}
                                    >
                                     <>
                                      <FiTrash2 />
                                       <span>Delete</span>
                                     </>
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