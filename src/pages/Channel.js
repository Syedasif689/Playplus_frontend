import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import VideoCard from "../components/VideoCard";
import defaultVideos from "../data/videos";
import { videoApi, channelApi } from "../services/api";
import { useAuth } from '../contexts/AuthContext';
import "../styles/Channel.css";
import {
  FaShareAlt,
  FaUserCircle,
  FaCheckCircle,
  FaBell,
  FaVideo,
  FaUsers,
  FaSpinner,
  FaTimes
} from "react-icons/fa";

function Channel() {
  const { creator } = useParams();
  const { user } = useAuth();
  const [creatorVideos, setCreatorVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shareSuccess, setShareSuccess] = useState(false);

  // Channel info state
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [subscribed, setSubscribed] = useState(false);
  const [isOwnChannel, setIsOwnChannel] = useState(false);
  const [loadingChannel, setLoadingChannel] = useState(true);
  const [bio, setBio] = useState("");
  const [socialLinks, setSocialLinks] = useState([]);
  const [profileImage, setProfileImage] = useState(null);

  // Modal state
  const [showImageModal, setShowImageModal] = useState(false);

  // Format subscriber count
  const formatSubscriberCount = (count) => {
    if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
    if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
    return count.toString();
  };

  // Load channel info
  useEffect(() => {
    const loadChannelInfo = async () => {
      setLoadingChannel(true);
      try {
        const response = await channelApi.getChannel(creator);
        const data = response.data;
        setBio(data.bio || "");
        setProfileImage(data.profileImage || null);
        setSocialLinks(data.socialLinks || []);
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

  // Load creator videos (same as before)
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

  // Handle subscribe
  const handleSubscribe = async () => {
    if (isOwnChannel) {
      alert('You cannot subscribe to your own channel');
      return;
    }

    if (!user) {
      alert('Please login to subscribe');
      return;
    }

    const newSubscribed = !subscribed;
    setSubscribed(newSubscribed);
    setSubscriberCount(prev => newSubscribed ? prev + 1 : Math.max(0, prev - 1));

    try {
      let response;
      if (newSubscribed) {
        response = await channelApi.subscribe(creator);
      } else {
        response = await channelApi.unsubscribe(creator);
      }
      setSubscribed(response.data.subscribed);
      setSubscriberCount(response.data.subscriberCount);
    } catch (error) {
      console.error('Error toggling subscription:', error);
      setSubscribed(!newSubscribed);
      setSubscriberCount(prev => !newSubscribed ? prev + 1 : Math.max(0, prev - 1));
      alert(error.response?.data?.error || 'Failed to update subscription');
    }
  };

  // Handle share
  const handleShare = async () => {
    const url = window.location.href;
    const channelName = creator || 'Unknown Channel';

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${channelName} - Play+ Channel`,
          text: `Check out ${channelName}'s channel on Play+! 🎬`,
          url: url
        });
        return;
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Share error:', error);
        }
      }
    }

    const shareText = `Check out ${channelName}'s channel on Play+! 🎬\n\n${url}`;
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

  if (loading || loadingChannel) {
    return (
      <div className="channel-container">
        <div className="channel-loading">
          <FaSpinner className="spin" size={45} />
          <p>Loading channel...</p>
        </div>
      </div>
    );
  }

  const isButtonDisabled = () => isOwnChannel || !user;

  return (
    <div className="channel-container">
      <div className="channel-banner"></div>

      {/* Profile Section */}
      <div className="channel-profile">
        {/* Avatar – clickable to open modal */}
        <div className="channel-avatar" onClick={() => profileImage && setShowImageModal(true)}>
          {profileImage ? (
            <img src={profileImage} alt={creator} className="channel-profile-image" />
          ) : (
            <FaUserCircle size={80} />
          )}
        </div>

        {/* Info – simple vertical stack */}
        <div className="channel-info">
          <h1>{creator || 'Unknown Creator'}</h1>

          {bio && <p className="channel-bio">{bio}</p>}

          {socialLinks.length > 0 && (
            <div className="channel-links">
              {socialLinks.map((link, index) => (
                <a key={index} href={link.url} target="_blank" rel="noreferrer">
                  {link.platform}
                </a>
              ))}
            </div>
          )}

          <p className="channel-stats">
            <FaVideo />
            <span>{creatorVideos.length} Videos</span>
            <FaUsers />
            <span>{formatSubscriberCount(subscriberCount)} Subscribers</span>
          </p>

          {/* Buttons row – always side‑by‑side */}
          <div className="channel-actions-row">
            <button
              className={`subscribe-btn ${subscribed ? 'subscribed' : ''} ${isOwnChannel ? 'own-channel' : ''}`}
              onClick={handleSubscribe}
              disabled={isButtonDisabled()}
            >
              {isOwnChannel ? (
                <>
                  <FaUserCircle />
                  <span>Your Channel</span>
                </>
              ) : !user ? (
                <>
                  <FaBell />
                  <span>Login to Subscribe</span>
                </>
              ) : subscribed ? (
                <>
                  <FaCheckCircle />
                  <span>Subscribed</span>
                </>
              ) : (
                <>
                  <FaBell />
                  <span>Subscribe</span>
                </>
              )}
              {!isOwnChannel && subscriberCount > 0 && (
                <span className="sub-count">• {formatSubscriberCount(subscriberCount)}</span>
              )}
            </button>

            <button
              className="share-btn"
              onClick={handleShare}
              title="Share this channel"
            >
              <FaShareAlt />
              <span>Share</span>
            </button>
          </div>

          {shareSuccess && (
            <div className="share-success">✅ Link copied to clipboard!</div>
          )}
        </div>
      </div>

      {error && <div className="channel-error">{error}</div>}

      <h2 className="videos-heading">
        <FaVideo />
        <span>Videos</span>
      </h2>

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

      {/* Profile Image Modal – circular */}
      {showImageModal && (
        <div className="image-modal-overlay" onClick={() => setShowImageModal(false)}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="image-modal-close" onClick={() => setShowImageModal(false)}>
              <FaTimes />
            </button>
            <img src={profileImage} alt={creator} />
          </div>
        </div>
      )}
    </div>
  );
}

export default Channel;