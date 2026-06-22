import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { videoApi } from '../services/api';
import defaultVideos from '../data/videos';
import '../styles/Trending.css';

function Trending() {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [timeFilter, setTimeFilter] = useState('today'); // today, week, month, all

    // Helper to get date from video (fallback to now if missing)
    const getVideoDate = (video) => {
        if (video.uploadedAt) {
            return new Date(video.uploadedAt);
        }
        // If no date, treat as very old so it won't show in "today/week/month"
        return new Date(0);
    };

    // Helper to check if video is within time range
    const isWithinTimeRange = (videoDate, filter) => {
        const now = new Date();
        switch (filter) {
            case 'today':
                return videoDate.toDateString() === now.toDateString();
            case 'week':
                const weekAgo = new Date(now);
                weekAgo.setDate(now.getDate() - 7);
                return videoDate >= weekAgo;
            case 'month':
                const monthAgo = new Date(now);
                monthAgo.setMonth(now.getMonth() - 1);
                return videoDate >= monthAgo;
            case 'all':
            default:
                return true;
        }
    };

    // Calculate trending score: likes*2 + views*1 + (recency bonus)
    const calculateTrendingScore = (video) => {
        const likes = video.likes || 0;
        const views = video.views || 0;
        // Basic score: likes weighted more than views
        let score = likes * 2 + views;

        // Optional recency bonus (newer videos get a small boost)
        if (video.uploadedAt) {
            const ageInDays = (Date.now() - new Date(video.uploadedAt).getTime()) / (1000 * 60 * 60 * 24);
            // Boost videos uploaded in the last 7 days
            if (ageInDays < 7) {
                score += 50 * (1 - ageInDays / 7);
            }
        }
        return score;
    };

    useEffect(() => {
        const loadTrendingVideos = async () => {
            setLoading(true);
            setError('');
            try {
                // Fetch all videos from backend
                const response = await videoApi.getAll();
                let allVideos = response.data || [];

                // Also include local videos (for backward compatibility)
                const localVideos = JSON.parse(localStorage.getItem('videos') || '[]');
                const combinedVideos = [...allVideos, ...localVideos];

                // Remove duplicates (by id)
                const uniqueVideos = [];
                const seenIds = new Set();
                combinedVideos.forEach(v => {
                    if (v.id && !seenIds.has(v.id)) {
                        seenIds.add(v.id);
                        uniqueVideos.push(v);
                    }
                });

                // Filter by time range
                const filteredByTime = uniqueVideos.filter(v => {
                    const date = getVideoDate(v);
                    return isWithinTimeRange(date, timeFilter);
                });

                // Calculate score and sort descending
                const trendingVideos = filteredByTime
                    .map(v => ({
                        ...v,
                        score: calculateTrendingScore(v)
                    }))
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 20); // Top 20

                setVideos(trendingVideos);
            } catch (error) {
                console.error('Error loading trending videos:', error);
                setError('Could not load trending videos. Showing fallback videos.');

                // Fallback: use default videos shuffled
                const fallback = defaultVideos
                    .sort(() => Math.random() - 0.5)
                    .slice(0, 6);
                setVideos(fallback);
            }
            setLoading(false);
        };

        loadTrendingVideos();
    }, [timeFilter]);

    if (loading) {
        return (
            <div className="trending-container">
                <div className="loading-spinner"></div>
                <p>Loading trending videos...</p>
            </div>
        );
    }

    return (
        <div className="trending-container">
            <div className="trending-header">
                <h1>🔥 Trending</h1>
                <div className="trending-filters">
                    <button 
                        className={`filter-btn ${timeFilter === 'today' ? 'active' : ''}`}
                        onClick={() => setTimeFilter('today')}
                    >
                        Today
                    </button>
                    <button 
                        className={`filter-btn ${timeFilter === 'week' ? 'active' : ''}`}
                        onClick={() => setTimeFilter('week')}
                    >
                        This Week
                    </button>
                    <button 
                        className={`filter-btn ${timeFilter === 'month' ? 'active' : ''}`}
                        onClick={() => setTimeFilter('month')}
                    >
                        This Month
                    </button>
                    <button 
                        className={`filter-btn ${timeFilter === 'all' ? 'active' : ''}`}
                        onClick={() => setTimeFilter('all')}
                    >
                        All Time
                    </button>
                </div>
            </div>

            {error && <div className="trending-error">{error}</div>}

            {videos.length > 0 ? (
                <div className="trending-grid">
                    {videos.map((video, index) => (
                        <Link to={`/watch/${video.id}`} key={video.id} className="trending-video">
                            <div className="trending-number">{index + 1}</div>
                            <div className="trending-thumbnail">
                                <img 
                                    src={video.thumbnail || 'https://picsum.photos/300/180'} 
                                    alt={video.title} 
                                />
                                <div className="trending-badge">🔥 Trending</div>
                            </div>
                            <div className="trending-info">
                                <h3>{video.title}</h3>
                                <p className="trending-creator">{video.creator || 'Unknown'}</p>
                                <div className="trending-stats">
                                    <span>👍 {video.likes || 0}</span>
                                    <span>👁️ {video.views || 0}</span>
                                    {video.uploadedAt && (
                                        <span>📅 {new Date(video.uploadedAt).toLocaleDateString()}</span>
                                    )}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="no-trending">
                    <p>No trending videos in this time range. Upload and share your content!</p>
                    <Link to="/upload" className="upload-btn">
                        Upload Video
                    </Link>
                </div>
            )}
        </div>
    );
}

export default Trending;