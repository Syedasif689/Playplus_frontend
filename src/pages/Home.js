import { useEffect, useState } from "react";
import VideoCard from "../components/VideoCard";
import "../styles/Home.css";
import defaultVideos from "../data/videos";
import { videoApi } from "../services/api";

function Home() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadVideos = async () => {
      setLoading(true);
      setError('');
      
      try {
        // Try to get videos from database
        const response = await videoApi.getAll();
        const dbVideos = response.data || [];
        
        // Get uploaded videos from localStorage (for backward compatibility)
        const localVideos = JSON.parse(localStorage.getItem('videos') || '[]');
        
        // Combine: Database videos first, then local videos
        let allVideos = [...dbVideos];
        
        // Add local videos that aren't already in database (by id)
        localVideos.forEach(localVideo => {
          const exists = allVideos.some(v => v.id === localVideo.id);
          if (!exists) {
            allVideos.push(localVideo);
          }
        });
        
        // If no videos in database, use default videos
        if (allVideos.length === 0) {
          // Map default videos to match the expected structure
          const defaultVideosWithId = defaultVideos.map(v => ({
            ...v,
            id: v.id || Date.now() + Math.random() * 1000
          }));
          allVideos = defaultVideosWithId;
        }
        
        setVideos(allVideos);
        
      } catch (error) {
        console.error('Error loading videos:', error);
        // Fallback to localStorage and default videos
        const localVideos = JSON.parse(localStorage.getItem('videos') || '[]');
        const defaultVideosWithId = defaultVideos.map(v => ({
          ...v,
          id: v.id || Date.now() + Math.random() * 1000
        }));
        setVideos([...localVideos, ...defaultVideosWithId]);
        setError('Could not load all videos. Showing available videos.');
      }
      
      setLoading(false);
    };

    loadVideos();
  }, []);

  if (loading) {
    return (
      <div className="home-loading">
        <div className="loading-spinner"></div>
        
      </div>
    );
  }

  return (
    <div className="home-container">
      {error && <div className="home-error">{error}</div>}
      
      {videos.length > 0 ? (
        <div className="video-grid">
          {videos.map((video) => (
            <VideoCard
              key={video.id || video._id || Date.now() + Math.random() * 1000}
              id={video.id}
              title={video.title}
              creator={video.creator || 'Unknown'}
              thumbnail={video.thumbnail || 'https://picsum.photos/300/180'}
              likes={video.likes || 0}
              views={video.views || 0}
              uploadedAt={video.uploadedAt}
            />
          ))}
        </div>
      ) : (
        <div className="no-videos">
          <p>No videos available yet. Be the first to upload!</p>
        </div>
      )}
    </div>
  );
}

export default Home;