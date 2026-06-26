import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  MdPersonAdd,
  MdComment,
  MdDone,
  MdDelete,
  MdNotifications,
  MdVideoLibrary,
} from "react-icons/md";
import { useAuth } from "../contexts/AuthContext";
import { videoApi, commentApi, channelApi } from "../services/api";
import "../styles/Notifications.css";

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subscribedChannels, setSubscribedChannels] = useState([]);

  // 🎯 Format relative time
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return `${diff} seconds ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
    return date.toLocaleDateString();
  };

  // 📺 Get subscribed channels
  const loadSubscribedChannels = useCallback(async () => {
    try {
      const response = await channelApi.getUserSubscriptions();
      setSubscribedChannels(response.data || []);
    } catch (error) {
      console.error("Error loading subscriptions:", error);
      // Fallback to localStorage
      const localSubs = JSON.parse(
        localStorage.getItem(`subscriptions_${user?.id}`) || "[]"
      );
      setSubscribedChannels(localSubs);
    }
  }, [user]);

  // 🔔 Generate notifications from subscribed channels' uploads and comments
  const generateNotifications = useCallback(async () => {
    if (!subscribedChannels.length) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    try {
      // 1️⃣ Fetch all videos
      const response = await videoApi.getAll();
      const allVideos = response.data || [];

      // 2️⃣ Filter videos from subscribed channels
      const subscribedVideos = allVideos.filter((video) =>
        subscribedChannels.includes(video.creator)
      );

      // 3️⃣ Sort by upload date (newest first)
      const sortedVideos = subscribedVideos.sort((a, b) => {
        const dateA = a.uploadedAt ? new Date(a.uploadedAt) : new Date(0);
        const dateB = b.uploadedAt ? new Date(b.uploadedAt) : new Date(0);
        return dateB - dateA;
      });

      // 4️⃣ Create upload notifications (limit to 10 most recent)
      const uploadNotifications = sortedVideos.slice(0, 10).map((video) => ({
        id: `upload_${video.id}`,
        type: "upload",
        message: `${video.creator} uploaded a new video: "${video.title}"`,
        videoId: video.id,
        videoTitle: video.title,
        creator: video.creator,
        time: video.uploadedAt ? formatTime(video.uploadedAt) : "Recently",
        read: false,
        link: `/watch/${video.id}`,
        icon: <MdVideoLibrary size={20} />,
      }));

      // 5️⃣ Fetch comments for subscribed channels' videos
      let commentNotifications = [];
      for (const video of sortedVideos.slice(0, 20)) {
        try {
          const commentsResponse = await commentApi.getComments(video.id);
          const comments = commentsResponse.data || [];

          // Only get recent comments (last 7 days)
          const recentComments = comments.filter((c) => {
            const commentDate = new Date(c.createdAt);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return commentDate > weekAgo;
          });

          recentComments.forEach((comment) => {
            // Don't notify if the comment is from the channel owner
            if (comment.user === video.creator) return;

            commentNotifications.push({
              id: `comment_${comment.id}`,
              type: "comment",
              message: `${comment.user} commented on "${video.title}"`,
              videoId: video.id,
              videoTitle: video.title,
              commentText: comment.text?.slice(0, 60),
              creator: video.creator,
              time: formatTime(comment.createdAt),
              read: false,
              link: `/watch/${video.id}`,
              icon: <MdComment size={20} />,
            });
          });
        } catch (e) {
          console.error("Error fetching comments for video:", video.id, e);
        }
      }

      // 6️⃣ Combine and sort all notifications by time (newest first)
      const allNotifications = [
        ...uploadNotifications,
        ...commentNotifications,
      ].sort((a, b) => {
        const dateA = new Date(a.time);
        const dateB = new Date(b.time);
        return dateB - dateA;
      });

      // 7️⃣ Limit to 50 most recent
      setNotifications(allNotifications.slice(0, 50));

      // 8️⃣ Store in localStorage for persistence
      if (user?.id) {
        localStorage.setItem(
          `notifications_${user.id}`,
          JSON.stringify(allNotifications.slice(0, 50))
        );
      }
    } catch (error) {
      console.error("Error generating notifications:", error);
      // Fallback to localStorage
      const saved = localStorage.getItem(`notifications_${user?.id}`);
      if (saved) {
        setNotifications(JSON.parse(saved));
      }
    }
    setLoading(false);
  }, [subscribedChannels, user]);

  // 🔄 Load data on mount
  useEffect(() => {
    if (user) {
      loadSubscribedChannels();
    } else {
      setLoading(false);
    }
  }, [user, loadSubscribedChannels]);

  // 🔄 Generate notifications when subscribed channels change
  useEffect(() => {
    if (subscribedChannels.length > 0) {
      generateNotifications();
    } else if (subscribedChannels.length === 0 && !loading) {
      setNotifications([]);
      setLoading(false);
    }
  }, [subscribedChannels, generateNotifications, loading]);

  // ✅ Mark as read
  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    // Update localStorage
    if (user?.id) {
      const updated = notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
      localStorage.setItem(`notifications_${user.id}`, JSON.stringify(updated));
    }
  };

  // ❌ Delete notification
  const deleteNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (user?.id) {
      const updated = notifications.filter((n) => n.id !== id);
      localStorage.setItem(`notifications_${user.id}`, JSON.stringify(updated));
    }
  };

  // ✅ Mark all as read
  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    if (user?.id) {
      const updated = notifications.map((n) => ({ ...n, read: true }));
      localStorage.setItem(`notifications_${user.id}`, JSON.stringify(updated));
    }
  };

  // 🔢 Unread count
  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return (
      <div className="notifications-page">
        <div className="notifications-container">
          <div className="notifications-header">
            <h1>Notifications</h1>
          </div>
          <div className="notifications-loading">
            <div className="loading-spinner"></div>
            <p>Loading notifications...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="notifications-page">
      <div className="notifications-container">
        {/* Header */}
        <div className="notifications-header">
          <div className="notifications-header-left">
            <h1>Notifications</h1>
            {unreadCount > 0 && (
              <span className="notifications-badge">{unreadCount}</span>
            )}
          </div>
          {notifications.length > 0 && (
            <button className="mark-all-btn" onClick={markAllRead}>
              <MdDone size={18} />
              Mark All Read
            </button>
          )}
        </div>

        {/* Empty State */}
        {notifications.length === 0 ? (
          <div className="notifications-empty">
            <div className="empty-icon">
              <MdNotifications size={56} />
            </div>
            <h2>No Notifications</h2>
            <p>
              {subscribedChannels.length === 0
                ? "Subscribe to channels to get notifications about their new uploads."
                : "You're all caught up! New notifications will appear here."}
            </p>
            {subscribedChannels.length === 0 && (
              <Link to="/" className="empty-action-btn">
                Browse Channels
              </Link>
            )}
          </div>
        ) : (
          <div className="notifications-list">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`notification-item ${
                  !notification.read ? "unread" : ""
                }`}
                onClick={() => markAsRead(notification.id)}
              >
                {/* Icon */}
                <div className="notification-icon-wrapper">
                  <div
                    className={`notification-icon ${
                      notification.type === "upload" ? "upload-icon" : "comment-icon"
                    }`}
                  >
                    {notification.icon}
                  </div>
                </div>

                {/* Content */}
                <div className="notification-content">
                  <Link to={notification.link} className="notification-message">
                    <span className="notification-text">{notification.message}</span>
                    {notification.commentText && (
                      <span className="notification-comment-preview">
                        "{notification.commentText}"
                      </span>
                    )}
                  </Link>
                  <div className="notification-meta">
                    <span className="notification-time">{notification.time}</span>
                    {!notification.read && (
                      <span className="notification-unread-dot">●</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="notification-actions">
                  {!notification.read && (
                    <button
                      className="notification-mark-read-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notification.id);
                      }}
                      title="Mark as read"
                    >
                      <MdDone size={16} />
                    </button>
                  )}
                  <button
                    className="notification-delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification.id);
                    }}
                    title="Delete notification"
                  >
                    <MdDelete size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;