import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { videoApi, channelApi } from '../services/api';
import defaultVideos from '../data/videos';
import '../styles/Subscriptions.css';

function Subscriptions() {
    const { user } = useAuth();
    const [subscribedChannels, setSubscribedChannels] = useState([]);
    const [channelData, setChannelData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const loadSubscriptions = async () => {
            setLoading(true);
            try {
                // ✅ Fetch subscribed channels from backend
                const response = await channelApi.getUserSubscriptions();
                const subscriptions = response.data || [];
                const uniqueSubscriptions = [...new Set(subscriptions)];
                setSubscribedChannels(uniqueSubscriptions);

                // Update localStorage for backward compatibility (optional)
                localStorage.setItem(`subscriptions_${user.id}`, JSON.stringify(uniqueSubscriptions));

                // Get all videos
                const videosResponse = await videoApi.getAll();
                const allVideos = videosResponse.data || [];
                const localVideos = JSON.parse(localStorage.getItem('videos') || '[]');
                const combinedVideos = [...allVideos, ...localVideos, ...defaultVideos];

                // Build channel data from videos
                const channelMap = {};
                for (const channelName of uniqueSubscriptions) {
                    const channelVideos = combinedVideos.filter(v => v.creator === channelName);
                    const latestVideo = channelVideos.sort((a, b) => {
                        const dateA = a.uploadedAt ? new Date(a.uploadedAt) : new Date(0);
                        const dateB = b.uploadedAt ? new Date(b.uploadedAt) : new Date(0);
                        return dateB - dateA;
                    })[0];

                    // Get subscriber count from backend (already available, but we can use the cached count)
                    let subscriberCount = 0;
                    try {
                        const channelInfo = await channelApi.getChannel(channelName);
                        subscriberCount = channelInfo.data.subscriberCount || 0;
                    } catch (e) {
                        console.warn(`Could not fetch subscriber count for ${channelName}`, e);
                    }

                    channelMap[channelName] = {
                        name: channelName,
                        videoCount: channelVideos.length,
                        latestVideo: latestVideo,
                        thumbnail: latestVideo?.thumbnail || 'https://picsum.photos/seed/' + channelName + '/300/180',
                        subscribers: subscriberCount
                    };
                }

                const channelArray = Object.values(channelMap).sort((a, b) =>
                    a.name.localeCompare(b.name)
                );

                setChannelData(channelArray);
            } catch (error) {
                console.error('Error loading subscriptions:', error);
                // Fallback to localStorage if backend fails
                const fallbackSubscriptions = JSON.parse(localStorage.getItem(`subscriptions_${user.id}`) || '[]');
                setSubscribedChannels(fallbackSubscriptions);
                // Optionally rebuild channel data with fallback list (simplified)
                // For simplicity, just show empty or we can rebuild with fallback
                // Let's rebuild with fallback
                const fallbackUnique = [...new Set(fallbackSubscriptions)];
                const videosResponse = await videoApi.getAll().catch(() => ({ data: [] }));
                const allVideos = videosResponse.data || [];
                const localVideos = JSON.parse(localStorage.getItem('videos') || '[]');
                const combinedVideos = [...allVideos, ...localVideos, ...defaultVideos];
                const channelMap = {};
                for (const channelName of fallbackUnique) {
                    const channelVideos = combinedVideos.filter(v => v.creator === channelName);
                    const latestVideo = channelVideos.sort((a, b) => {
                        const dateA = a.uploadedAt ? new Date(a.uploadedAt) : new Date(0);
                        const dateB = b.uploadedAt ? new Date(b.uploadedAt) : new Date(0);
                        return dateB - dateA;
                    })[0];
                    let subscriberCount = 0;
                    try {
                        const channelInfo = await channelApi.getChannel(channelName);
                        subscriberCount = channelInfo.data.subscriberCount || 0;
                    } catch (e) {}
                    channelMap[channelName] = {
                        name: channelName,
                        videoCount: channelVideos.length,
                        latestVideo: latestVideo,
                        thumbnail: latestVideo?.thumbnail || 'https://picsum.photos/seed/' + channelName + '/300/180',
                        subscribers: subscriberCount
                    };
                }
                setChannelData(Object.values(channelMap).sort((a, b) => a.name.localeCompare(b.name)));
            }
            setLoading(false);
        };

        loadSubscriptions();
    }, [user]);

    const handleUnsubscribe = async (channelName) => {
        if (!window.confirm(`Are you sure you want to unsubscribe from ${channelName}?`)) {
            return;
        }

        try {
            // Use backend API to unsubscribe
            await channelApi.unsubscribe(channelName);

            // Update localStorage (for backward compatibility and quick UI update)
            const subscriptions = JSON.parse(localStorage.getItem(`subscriptions_${user.id}`) || '[]');
            const updatedSubscriptions = subscriptions.filter(sub => sub !== channelName);
            localStorage.setItem(`subscriptions_${user.id}`, JSON.stringify(updatedSubscriptions));

            // Update local state
            setSubscribedChannels(updatedSubscriptions);
            setChannelData(channelData.filter(channel => channel.name !== channelName));
        } catch (error) {
            console.error('Error unsubscribing:', error);
            alert('Failed to unsubscribe. Please try again.');
        }
    };

    if (!user) {
        return (
            <div className="subscriptions-container">
                <div className="login-prompt">
                    <h2>📺 Subscribe to channels</h2>
                    <p>Log in to see channels you subscribe to</p>
                    <Link to="/" className="login-btn">
                        Go to Home
                    </Link>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="subscriptions-container">
                <div className="loading-spinner"></div>
                <p>Loading your subscriptions...</p>
            </div>
        );
    }

    return (
        <div className="subscriptions-container">
            <div className="subscriptions-header">
                <h1>📺 Subscriptions</h1>
                <p>Channels you've subscribed to</p>
            </div>

            {subscribedChannels.length === 0 ? (
                <div className="no-subscriptions">
                    <div className="no-subscriptions-icon">📺</div>
                    <h2>No subscriptions yet</h2>
                    <p>Subscribe to channels to see their latest content here</p>
                    <Link to="/" className="browse-btn">
                        Browse Videos
                    </Link>
                </div>
            ) : (
                <div className="subscriptions-grid">
                    {channelData.map(channel => (
                        <div key={channel.name} className="subscription-channel">
                            <Link to={`/channel/${channel.name}`} className="channel-link">
                                <div className="channel-thumbnail">
                                    <img
                                        src={channel.thumbnail}
                                        alt={channel.name}
                                        onError={(e) => {
                                            e.target.src = 'https://picsum.photos/seed/' + channel.name + '/300/180';
                                        }}
                                    />
                                    <div className="channel-overlay">
                                        <div className="channel-avatar-small">
                                            {channel.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="channel-name-overlay">
                                            {channel.name}
                                        </div>
                                    </div>
                                </div>
                                <div className="channel-info">
                                    <div className="channel-name-row">
                                        <h3>{channel.name}</h3>
                                        <button
                                            className="unsubscribe-btn"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleUnsubscribe(channel.name);
                                            }}
                                        >
                                            Unsubscribe
                                        </button>
                                    </div>
                                    <p className="channel-stats">
                                        {channel.videoCount} videos • {channel.subscribers} subscribers
                                    </p>
                                    {channel.latestVideo && (
                                        <div className="latest-video">
                                            <span className="latest-label">Latest:</span>
                                            <span className="latest-title">{channel.latestVideo.title}</span>
                                        </div>
                                    )}
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Subscriptions;