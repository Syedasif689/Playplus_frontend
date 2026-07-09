import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { userApi } from '../services/api';
import VideoCard from '../components/VideoCard';
import '../styles/LikedVideos.css';
import { MdFavorite, MdFavoriteBorder } from "react-icons/md";

function LikedVideos() {
    const { user } = useAuth();
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }
        const loadLiked = async () => {
            try {
                const response = await userApi.getLikedVideos();
                setVideos(response.data);
            } catch (err) {
                setError('Failed to load liked videos');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadLiked();
    }, [user]);

    if (!user) {
        return (
            <div className="liked-container">
                <p>Please login to see liked videos.</p>
                <Link to="/" className="browse-btn">Go Home</Link>
            </div>
        );
    }

    if (loading) return <div className="liked-container"><p>Loading liked videos...</p></div>;

    return (
        <div className="liked-container">
            <div className="liked-header">
                <h1 className="liked-title">
                <MdFavorite className="liked-title-icon" />
                 Liked Videos
                </h1>
                <span className="liked-count">{videos.length} videos</span>
            </div>
            {error && <div className="liked-error">{error}</div>}
            {videos.length === 0 ? (
                <div className="no-liked">
                   <div className="no-liked-icon">
                     <MdFavoriteBorder />
                    </div>
                     <p>You haven't liked any videos yet.</p>
                  <Link to="/" className="browse-btn">Browse Videos</Link>
                </div>
            ) : (
                <div className="liked-grid">
                    {videos.map(video => (
                        <VideoCard
                            key={video.id}
                            id={video.id}
                            title={video.title}
                            creator={video.creator}
                            thumbnail={video.thumbnail}
                            views={video.views}
                            likes={video.likes}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default LikedVideos;