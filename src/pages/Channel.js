import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import VideoCard from "../components/VideoCard";
import defaultVideos from "../data/videos";
import { videoApi } from "../services/api";
import { useAuth } from '../contexts/AuthContext';
import "../styles/Channel.css";

function Channel() {
  const { creator } = useParams();
  const { user } = useAuth();
  const [creatorVideos, setCreatorVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shareSuccess, setShareSuccess] = useState(false);

  // ✅ Check if user is the channel owner
  const isOwnChannel = user && user.username === creator;

  // ✅ Subscription state - only for non-owners
  const [subscribed, setSubscribed] = useState(() => {
    // If user is the owner, they are not subscribed
    if (isOwnChannel) return false;
    return localStorage.getItem(`user_sub_${creator}`) === "true";
  });

  useEffect(() => {
    const loadCreatorVideos = async () => {
      setLoading(true);
      setError('');
      
      try {
        const response = await videoApi.getAll();
        const allVideos = response.data || [];
        
        const filteredVideos = allVideos.filter(
          video => video.creator?.toLowerCase() === creator?.toLowerCase()
        );
        
        const localVideos = JSON.parse(localStorage.getItem('videos') || '[]');
        const localCreatorVideos = localVideos.filter(
          video => video.creator?.toLowerCase() === creator?.toLowerCase()
        );
        
        const combinedVideos = [...filteredVideos];
        localCreatorVideos.forEach(localVideo => {
          const exists = combinedVideos.some(v => v.id === localVideo.id);
          if (!exists) {
            combinedVideos.push(localVideo);
          }
        });
        
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

  // ✅ Handle subscribe - prevent self-subscription
  const handleSubscribe = () => {
    // Don't allow self-subscription
    if (isOwnChannel) {
      alert('You cannot subscribe to your own channel');
      return;
    }

    if (!user) {
      alert('Please login to subscribe');
      return;
    }

    const newState = !subscribed;
    setSubscribed(newState);
    localStorage.setItem(`user_sub_${creator}`, newState);
  };

  // ✅ Handle share - with multiple methods
  const handleShare = async () => {
    const url = window.location.href;
    const channelName = creator || 'Unknown Channel';
    const shareText = `Check out ${channelName}'s channel on Play+! 🎬\n\n${url}`;

    // Try native share API first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${channelName} - Play+ Channel`,
          text: shareText,
          url: url
        });
        return;
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Share error:', error);
        }
      }
    }

    // Fallback: Copy to clipboard
    try {
      await navigator.clipboard.writeText(shareText);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 3000);
      alert('✅ Channel link copied to clipboard!');
    } catch (error) {
      // Last resort: prompt
      const copied = window.prompt('Copy this link to share:', url);
      if (copied) {
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 3000);
      }
    }
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

  // ✅ Determine button text
  const getButtonText = () => {
    if (isOwnChannel) return 'Your Channel';
    if (!user) return 'Login to Subscribe';
    return subscribed ? 'Subscribed ✓' : 'Subscribe';
  };

  // ✅ Determine if button should be disabled
  const isButtonDisabled = () => {
    return isOwnChannel || !user;
  };

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
            <div className="channel-actions-row">
              <button
                className={`subscribe-btn ${subscribed ? 'subscribed' : ''} ${isOwnChannel ? 'own-channel' : ''}`}
                onClick={handleSubscribe}
                disabled={isButtonDisabled()}
              >
                {getButtonText()}
              </button>
              
              <button
                className="share-btn"
                onClick={handleShare}
                title="Share this channel"
              >
                🔗 Share
              </button>
            </div>
          </div>

          <p>
            {creatorVideos.length} Videos •{' '}
            {subscribed && !isOwnChannel ? '1' : '0'} Subscribers
          </p>

          {shareSuccess && (
            <div className="share-success">
              ✅ Link copied to clipboard!
            </div>
          )}
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