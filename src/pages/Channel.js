import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import VideoCard from "../components/VideoCard";
import defaultVideos from "../data/videos";
import { videoApi } from "../services/api";
import "../styles/Channel.css";

function Channel() {
  const { creator } = useParams();
  const [creatorVideos, setCreatorVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [subscribed, setSubscribed] = useState(
    localStorage.getItem(`user_sub_${creator}`) === "true"
  );

  useEffect(() => {
    const loadCreatorVideos = async () => {
      setLoading(true);
      setError('');
      
      try {
        // Try to get videos from database
        const response = await videoApi.getAll();
        const allVideos = response.data || [];
        
        // Filter videos by creator name
        const filteredVideos = allVideos.filter(
          video => video.creator?.toLowerCase() === creator?.toLowerCase()
        );
        
        // Also check localStorage for videos from this creator
        const localVideos = JSON.parse(localStorage.getItem('videos') || '[]');
        const localCreatorVideos = localVideos.filter(
          video => video.creator?.toLowerCase() === creator?.toLowerCase()
        );
        
        // Combine and remove duplicates
        const combinedVideos = [...filteredVideos];
        localCreatorVideos.forEach(localVideo => {
          const exists = combinedVideos.some(v => v.id === localVideo.id);
          if (!exists) {
            combinedVideos.push(localVideo);
          }
        });
        
        // If no videos in database, fallback to default videos
        if (combinedVideos.length === 0) {
          const defaultFiltered = defaultVideos.filter(
            video => video.creator?.toLowerCase() === creator?.toLowerCase()
          );
          setCreatorVideos(defaultFiltered);
        } else {
          setCreatorVideos(combinedVideos);
        }
        
      } catch (error) {
        console.error('Error loading creator videos:', error);
        // Fallback to localStorage and default videos
        const localVideos = JSON.parse(localStorage.getItem('videos') || '[]');
        const localCreatorVideos = localVideos.filter(
          video => video.creator?.toLowerCase() === creator?.toLowerCase()
        );
        const defaultFiltered = defaultVideos.filter(
          video => video.creator?.toLowerCase() === creator?.toLowerCase()
        );
        setCreatorVideos([...localCreatorVideos, ...defaultFiltered]);
        setError('Could not load all videos. Showing available videos.');
      }
      
      setLoading(false);
    };

    if (creator) {
      loadCreatorVideos();
    }
  }, [creator]);

  const handleSubscribe = () => {
    const newState = !subscribed;
    setSubscribed(newState);
    localStorage.setItem(`user_sub_${creator}`, newState);
  };

  if (loading) {
    return (
      <div className="channel-container">
        <div className="channel-loading">
          <div className="loading-spinner"></div>
          <p>Loading channel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="channel-container">
      <div className="channel-banner"></div>

      <div className="channel-profile">
        <div className="channel-avatar">
          {creator?.charAt(0).toUpperCase() || 'U'}
        </div>

        <div className="channel-info">
          <div className="channel-title-row">
            <h1>{creator || 'Unknown Creator'}</h1>
            <button
              className={`subscribe-btn ${subscribed ? 'subscribed' : ''}`}
              onClick={handleSubscribe}
            >
              {subscribed ? 'Subscribed ✓' : 'Subscribe'}
            </button>
          </div>

          <p>
            {creatorVideos.length} Videos •{' '}
            {subscribed ? 1 : 0} Subscribers
          </p>
        </div>
      </div>

      {error && <div className="channel-error">{error}</div>}

      <h2 className="videos-heading">Videos</h2>

      {creatorVideos.length > 0 ? (
        <div className="channel-videos">
          {creatorVideos.map((video) => (
            <VideoCard
              key={video.id || video._id || Date.now() + Math.random() * 1000}
              id={video.id}
              title={video.title}
              creator={video.creator}
              thumbnail={video.thumbnail || 'https://picsum.photos/300/180'}
              likes={video.likes || 0}
              views={video.views || 0}
              uploadedAt={video.uploadedAt}
            />
          ))}
        </div>
      ) : (
        <div className="no-videos">
          <p>No videos uploaded by {creator} yet.</p>
        </div>
      )}
    </div>
  );
}

export default Channel;