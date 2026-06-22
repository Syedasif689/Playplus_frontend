import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import VideoCard from "../components/VideoCard";
import defaultVideos from "../data/videos";
import { videoApi, channelApi } from "../services/api";
import { useAuth } from '../contexts/AuthContext';
import "../styles/Channel.css";

function Channel() {
  const { creator } = useParams();
  const { user } = useAuth();
  const [creatorVideos, setCreatorVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shareSuccess, setShareSuccess] = useState(false);

  // ✅ State for channel info from backend
  const [channelInfo, setChannelInfo] = useState(null);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [subscribed, setSubscribed] = useState(false);
  const [isOwnChannel, setIsOwnChannel] = useState(false);
  const [loadingChannel, setLoadingChannel] = useState(true);

  // ✅ Load channel info from backend
  useEffect(() => {
    const loadChannelInfo = async () => {
      setLoadingChannel(true);
      try {
        const response = await channelApi.getChannel(creator);
        const data = response.data;
        setChannelInfo(data);
        setSubscriberCount(data.subscriberCount || 0);
        setSubscribed(data.isSubscribed || false);
        setIsOwnChannel(data.isOwnChannel || false);
      } catch (error) {
        console.error('Error loading channel info:', error);
        setError('Failed to load channel information');
      } finally {
        setLoadingChannel(false);
      }
    };

    if (creator) {
      loadChannelInfo();
    }
  }, [creator]);

  // ✅ Load creator videos (existing logic, but we can use channelInfo.videoCount)
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

  // ✅ Handle subscribe - using API
  const handleSubscribe = async () => {
    if (isOwnChannel) {
      alert('You cannot subscribe to your own channel');
      return;
    }

    if (!user) {
      alert('Please login to subscribe');
      return;
    }

    try {
      let response;
      if (subscribed) {
        // Unsubscribe
        response = await channelApi.unsubscribe(creator);
      } else {
        // Subscribe
        response = await channelApi.subscribe(creator);
      }
      
      // Update state with response
      setSubscribed(response.data.subscribed);
      setSubscriberCount(response.data.subscriberCount);
      
    } catch (error) {
      console.error('Error toggling subscription:', error);
      alert(error.response?.data?.error || 'Failed to update subscription');
    }
  };

  // ✅ Handle share - same as before
  const handleShare = async () => {
    const url = window.location.href;
    const channelName = creator || 'Unknown Channel';
    const shareText = `Check out ${channelName}'s channel on Play+! 🎬\n\n${url}`;

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

    try {
      await navigator.clipboard.writeText(shareText);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 3000);
    } catch (error) {
      const copied = window.prompt('Copy this link to share:', url);
      if (copied) {
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 3000);
      }
    }
  };

  // ✅ Combined loading state
  if (loading || loadingChannel) {
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
                {!isOwnChannel && subscriberCount > 0 && (
                  <span className="sub-count">• {subscriberCount}</span>
                )}
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
            {creatorVideos.length} Videos • {subscriberCount} Subscribers
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