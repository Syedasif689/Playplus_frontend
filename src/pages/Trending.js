import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { videoApi } from '../services/api';
import defaultVideos from '../data/videos';
import '../styles/Trending.css';

function Trending() {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeFilter, setTimeFilter] = useState('today'); // today, week, month, all

    useEffect(() => {
        const loadTrendingVideos = async () => {
            setLoading(true);
            try {
                const response = await videoApi.getAll();
                const allVideos = response.data || [];
                
                // Combine with default videos
                const localVideos = JSON.parse(localStorage.getItem('videos') || '[]');
                const combinedVideos = [...allVideos, ...localVideos];
                
                // Sort by likes and views to simulate trending
                const trendingVideos = combinedVideos
                    .filter(v => v.likes > 0 || v.views > 0)
                    .sort((a, b) => {
                        // Calculate trending score based on likes and views
                        const scoreA = (a.likes || 0) * 2 + (a.views || 0);
                        const scoreB = (b.likes || 0) * 2 + (b.views || 0);
                        return scoreB - scoreA;
                    })
                    .slice(0, 20);
                
                setVideos(trendingVideos);
            } catch (error) {
                console.error('Error loading trending videos:', error);
                // Fallback to default videos
                const trendingDefaults = defaultVideos
                    .sort(() => Math.random() - 0.5)
                    .slice(0, 6);
                setVideos(trendingDefaults);
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

            {videos.length > 0 ? (
                <div className="trending-grid">
                    {videos.map((video, index) => (
                        <Link to={`/watch/${video.id}`} key={video.id} className="trending-video">
                            <div className="trending-number">{index + 1}</div>
                            <div className="trending-thumbnail">
                                <img src={video.thumbnail || 'https://picsum.photos/300/180'} alt={video.title} />
                                <div className="trending-badge">🔥 Trending</div>
                            </div>
                            <div className="trending-info">
                                <h3>{video.title}</h3>
                                <p className="trending-creator">{video.creator || 'Unknown'}</p>
                                <div className="trending-stats">
                                    <span>👍 {video.likes || 0}</span>
                                    <span>👁️ {video.views || 0}</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="no-trending">
                    <p>No trending videos yet. Upload and share your content!</p>
                    <Link to="/upload" className="upload-btn">
                        Upload Video
                    </Link>
                </div>
            )}
        </div>
    );
}

export default Trending;