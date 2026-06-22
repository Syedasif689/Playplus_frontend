import { useEffect, useState, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import defaultVideos from "../data/videos";
import "../styles/watch.css";
import { videoApi, commentApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import VideoPlayer from '../components/VideoPlayer';
function Watch() {
  const { user } = useAuth();
  const { id } = useParams();

  // UI States
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [sortType, setSortType] = useState("newest");
  const [showComments, setShowComments] = useState(true);
  const [replyText, setReplyText] = useState({});
  const [commentText, setCommentText] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [showReplyInput, setShowReplyInput] = useState({});
  const [showRepliesFor, setShowRepliesFor] = useState({});
  
  // Video state
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);

  // Video Stats
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [views, setViews] = useState(0);
  const [viewTracked, setViewTracked] = useState(false);
  
  // Share states
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  
  // Video Reaction
  const [reaction, setReaction] = useState(null);

  // Get videos from localStorage + defaults
  const uploadedVideos = JSON.parse(localStorage.getItem("videos") || "[]");
  const allVideos = [...uploadedVideos, ...defaultVideos];
  const relatedVideos = allVideos.filter(v => v.id !== Number(id)).slice(0, 6);
  
  // Comments State
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(true);

  // Load video from database or fallback to local
  useEffect(() => {
    const loadVideo = async () => {
      setLoading(true);
      try {
        const response = await videoApi.getVideo(id);
        if (response.data) {
          setVideo(response.data);
          setLikes(response.data.likes || 0);
          setDislikes(response.data.dislikes || 0);
          setViews(response.data.views || 0);
        }
      } catch (error) {
        console.log("Video not in database, using local data");
        const localVideo = allVideos.find(v => v.id === Number(id));
        if (localVideo) {
          setVideo(localVideo);
          setLikes(localVideo.likes || 120);
          setDislikes(localVideo.dislikes || 5);
          setViews(localVideo.views || 0);
        }
      }
      setLoading(false);
    };
    
    if (id) {
      loadVideo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Track view after video loads
  useEffect(() => {
    const trackView = async () => {
      if (video?.id && !viewTracked) {
        try {
          console.log('📊 Tracking view for video:', video.id);
          const response = await videoApi.trackView(video.id);
          console.log('📊 View tracking response:', response.data);
          
          if (response.data && response.data.views !== undefined) {
            setViews(response.data.views);
          }
          setViewTracked(true);
        } catch (error) {
          console.error('❌ Error tracking view:', error);
        }
      }
    };

    const timeoutId = setTimeout(() => {
      trackView();
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [video?.id, viewTracked]);

  // Load user reaction
  useEffect(() => {
    const loadReaction = async () => {
      if (user?.id && video?.id) {
        try {
          const response = await videoApi.getReaction(video.id);
          setReaction(response.data.reaction);
        } catch (error) {
          console.error("Error loading reaction:", error);
        }
      }
    };
    if (video?.id) {
      loadReaction();
    }
  }, [user, video?.id]);

  // Load comments from database
  useEffect(() => {
    const loadComments = async () => {
      if (video?.id) {
        setCommentsLoading(true);
        try {
          const response = await commentApi.getComments(video.id);
          const formattedComments = response.data.map(dbComment => ({
            id: dbComment.id,
            text: dbComment.text,
            user: dbComment.user,
            userId: dbComment.userId,
            likes: dbComment.likes || 0,
            likedBy: dbComment.likedBy || [],
            replies: dbComment.replies || [],
            createdAt: new Date(dbComment.createdAt).getTime(),
            userAvatar: dbComment.user ? getUserAvatar(dbComment.user) : 'G',
            avatarColor: dbComment.user ? getAvatarColor(dbComment.user) : '#3ea6ff'
          }));
          setComments(formattedComments);
        } catch (error) {
          console.error('Error loading comments from database:', error);
          const savedComments = localStorage.getItem(`comments_${id}`);
          if (savedComments) {
            setComments(JSON.parse(savedComments));
          }
        }
        setCommentsLoading(false);
      }
    };
    loadComments();
  }, [video?.id, id]);

  // Save comments to localStorage as backup
  useEffect(() => {
    if (id && comments.length > 0) {
      localStorage.setItem(`comments_${id}`, JSON.stringify(comments));
    }
  }, [comments, id]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  // Helper functions
  const findAndUpdateNode = useCallback((nodes, targetId, updateFn) => {
    return nodes.map(node => {
      if (node.id === targetId) {
        return updateFn(node);
      }
      if (node.replies && node.replies.length > 0) {
        return {
          ...node,
          replies: findAndUpdateNode(node.replies, targetId, updateFn)
        };
      }
      return node;
    });
  }, []);

  const findAndDeleteNode = useCallback((nodes, targetId) => {
    return nodes.filter(node => {
      if (node.id === targetId) {
        return false;
      }
      if (node.replies && node.replies.length > 0) {
        node.replies = findAndDeleteNode(node.replies, targetId);
      }
      return true;
    });
  }, []);

  const insertReplyNode = useCallback((nodes, parentId, newReply) => {
    return nodes.map(node => {
      if (node.id === parentId) {
        return {
          ...node,
          replies: [...(node.replies || []), newReply]
        };
      }
      if (node.replies && node.replies.length > 0) {
        return {
          ...node,
          replies: insertReplyNode(node.replies, parentId, newReply)
        };
      }
      return node;
    });
  }, []);

  // Get user avatar
  const getUserAvatar = (username) => {
    if (!username) return 'G';
    return username.charAt(0).toUpperCase();
  };

  // Get user avatar color
  const getAvatarColor = (username) => {
    if (!username) return '#3ea6ff';
    const colors = ['#3ea6ff', '#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff6bff', '#ff9f43', '#00d2d3'];
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Format views count
  const formatViews = (count) => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M';
    } else if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count;
  };

  // SHARE FUNCTIONALITY - No share count tracking
  const handleShare = async () => {
    const url = window.location.href;

    // Try native share API first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${video?.title || 'Play+ Video'} - Play+`,
          text: `Check out "${video?.title || 'Play+ Video'}" by ${video?.creator || 'Play+'}`,
          url: url
        });
        return;
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Share error:', error);
        }
      }
    }

    // If native share fails, show custom modal
    setShowShareModal(true);
  };

  const handleCopyLink = async () => {
    const url = window.location.href;

    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 3000);
    } catch (error) {
      window.prompt('Copy this link to share:', url);
    }
  };

  const handleWhatsAppShare = () => {
    const url = window.location.href;
    const text = `🎬 Check out "${video?.title || 'Play+ Video'}" on Play+!\n\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleTwitterShare = () => {
    const url = window.location.href;
    const text = `🎬 Check out "${video?.title || 'Play+ Video'}" on Play+!`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
  };

  const handleFacebookShare = () => {
    const url = window.location.href;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
  };

  const handleRedditShare = () => {
    const url = window.location.href;
    const text = `🎬 Check out "${video?.title || 'Play+ Video'}" on Play+!`;
    window.open(`https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`, '_blank');
  };

  const closeShareModal = () => {
    setShowShareModal(false);
    setShareCopied(false);
  };

  // COMMENT CRUD OPERATIONS
  const handleAddComment = useCallback(async () => {
    if (!commentText.trim()) return;
    if (!user?.id) {
      alert("Please login to comment");
      return;
    }

    try {
      const response = await commentApi.addComment(video.id, commentText.trim());
      const newComment = {
        id: response.data.id,
        text: response.data.text,
        user: response.data.user,
        userId: response.data.userId,
        likes: response.data.likes || 0,
        likedBy: [],
        replies: [],
        createdAt: new Date(response.data.createdAt).getTime(),
        userAvatar: response.data.user ? getUserAvatar(response.data.user) : 'G',
        avatarColor: response.data.user ? getAvatarColor(response.data.user) : '#3ea6ff'
      };
      setComments(prev => [newComment, ...prev]);
      setCommentText("");
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment. Please try again.');
    }
  }, [commentText, user, video?.id]);

  const handleEditComment = useCallback(async () => {
    if (!editText.trim()) return;

    try {
      await commentApi.updateComment(editingId, editText.trim());
      setComments(prev => findAndUpdateNode(prev, editingId, node => ({
        ...node,
        text: editText.trim()
      })));
      setEditingId(null);
      setEditText("");
    } catch (error) {
      console.error('Error updating comment:', error);
      alert('Failed to update comment. Please try again.');
    }
  }, [editText, editingId, findAndUpdateNode]);

  const handleDeleteComment = useCallback(async (commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;

    try {
      await commentApi.deleteComment(commentId);
      setComments(prev => findAndDeleteNode(prev, commentId));
      alert('✅ Comment deleted successfully!');
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment. Please try again.');
    }
  }, [findAndDeleteNode]);

  const handleStartEdit = useCallback((commentId, currentText) => {
    setEditingId(commentId);
    setEditText(currentText);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditText("");
  }, []);

  // COMMENT LIKE SYSTEM
  const handleCommentLike = useCallback(async (commentId) => {
    if (!user?.id) {
      alert("Please login to like comments");
      return;
    }

    try {
      const response = await commentApi.likeComment(commentId);
      setComments(prev => findAndUpdateNode(prev, commentId, node => ({
        ...node,
        likes: response.data.likes
      })));
    } catch (error) {
      console.error('Error liking comment:', error);
      alert('Failed to like comment. Please try again.');
    }
  }, [user, findAndUpdateNode]);

  // REPLY SYSTEM
  const handleReply = useCallback(async (parentId) => {
    const text = replyText[parentId];
    if (!text?.trim()) return;

    try {
      const response = await commentApi.addComment(video.id, text.trim(), parentId);
      const newReply = {
        id: response.data.id,
        text: response.data.text,
        user: response.data.user,
        userId: response.data.userId,
        likes: response.data.likes || 0,
        likedBy: [],
        replies: [],
        createdAt: new Date(response.data.createdAt).getTime(),
        userAvatar: response.data.user ? getUserAvatar(response.data.user) : 'G',
        avatarColor: response.data.user ? getAvatarColor(response.data.user) : '#3ea6ff'
      };
      
      setComments(prev => insertReplyNode(prev, parentId, newReply));
      setReplyText(prev => ({ ...prev, [parentId]: "" }));
      setShowReplyInput(prev => ({ ...prev, [parentId]: false }));
      setShowRepliesFor(prev => ({ ...prev, [parentId]: true }));
    } catch (error) {
      console.error('Error adding reply:', error);
      alert('Failed to add reply. Please try again.');
    }
  }, [replyText, video?.id, insertReplyNode]);

  const toggleReplyInput = useCallback((id) => {
    setShowReplyInput(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const toggleRepliesVisibility = useCallback((commentId) => {
    setShowRepliesFor(prev => ({ ...prev, [commentId]: !prev[commentId] }));
  }, []);

  // VIDEO LIKE/DISLIKE SYSTEM
  const handleVideoReaction = useCallback(async (type) => {
    if (!user?.id) {
      alert("Login required to like/dislike videos");
      return;
    }

    if (!video?.id) {
      alert("Video not found");
      return;
    }

    try {
      let response;
      if (type === "like") {
        response = await videoApi.like(video.id);
      } else {
        response = await videoApi.dislike(video.id);
      }
      
      setLikes(response.data.likes);
      setDislikes(response.data.dislikes);
      setReaction(response.data.reaction);
      
    } catch (error) {
      console.error("Error updating reaction:", error);
      
      if (error.response?.status === 404) {
        alert("Video not found in database. Please seed videos first.");
      } else {
        alert("Failed to update reaction. Please try again.");
      }
    }
  }, [user, video]);

  const countReplies = useCallback((replies) => {
    if (!replies || replies.length === 0) return 0;
    let count = replies.length;
    replies.forEach(reply => {
      if (reply.replies && reply.replies.length > 0) {
        count += countReplies(reply.replies);
      }
    });
    return count;
  }, []);

  const renderReplies = useCallback((replies, depth = 0) => {
    if (!replies || replies.length === 0) return null;
    
    return (
      <div className={`replies-section depth-${Math.min(depth, 3)}`}>
        {replies.map(reply => (
          <div key={reply.id} className="reply-item">
            <div className="reply-header">
              <div className="reply-avatar-small" style={{ backgroundColor: reply.avatarColor || '#3ea6ff' }}>
                {reply.userAvatar || reply.user?.charAt(0).toUpperCase() || 'G'}
              </div>
              <strong>{reply.user}</strong>
              <span className="reply-date">
                {new Date(reply.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="reply-text">{reply.text}</div>
            
            <div className="reply-actions">
              <button onClick={() => toggleReplyInput(reply.id)}>
                Reply
              </button>
              {user?.id === reply.userId && (
                <>
                  <button onClick={() => handleStartEdit(reply.id, reply.text)}>
                    Edit
                  </button>
                  <button onClick={() => handleDeleteComment(reply.id)}>
                    Delete
                  </button>
                </>
              )}
            </div>

            {showReplyInput[reply.id] && (
              <div className="reply-input-form">
                <input
                  type="text"
                  placeholder="Write a reply..."
                  value={replyText[reply.id] || ""}
                  onChange={(e) => setReplyText(prev => ({ ...prev, [reply.id]: e.target.value }))}
                  onKeyPress={(e) => e.key === "Enter" && handleReply(reply.id)}
                  autoFocus
                />
                <button onClick={() => handleReply(reply.id)}>Reply</button>
                <button onClick={() => toggleReplyInput(reply.id)}>Cancel</button>
              </div>
            )}
            
            {reply.replies && reply.replies.length > 0 && renderReplies(reply.replies, depth + 1)}
          </div>
        ))}
      </div>
    );
  }, [replyText, handleReply, handleStartEdit, handleDeleteComment, toggleReplyInput, showReplyInput, user]);

  const sortedComments = [...comments].sort((a, b) => {
    if (sortType === "top") return b.likes - a.likes;
    return b.createdAt - a.createdAt;
  });

  if (loading) {
    return (
      <div className="watch-layout">
        <div className="main-content">
          <h2>Loading video...</h2>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="watch-layout">
        <div className="main-content">
          <h2>Video not found</h2>
          <Link to="/">Go back home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="watch-layout">
      {/* LEFT SIDE - MAIN CONTENT */}
      <div className="main-content">
        {/* Sticky Video Player Container */}
       <div className="sticky-video-container">
       <VideoPlayer src={video.videoUrl} title={video.title} />
      </div>

        {/* Scrollable Content */}
        <div className="scrollable-content">
          {/* Video Title with Views */}
          <div className="video-header">
            <h2>{video.title}</h2>
            <p className="video-views">{formatViews(views)} views</p>
          </div>

          <Link to={`/channel/${video.creator}`} className="channel-link">
            {video.creator}
          </Link>

          <div className="video-description">
            <p>
              {showFullDescription
                ? video.description
                : video.description?.slice(0, 120)}
              {video.description?.length > 120 && !showFullDescription && "..."}
            </p>
            {video.description?.length > 120 && (
              <button className="show-more-btn" onClick={() => setShowFullDescription(prev => !prev)}>
                {showFullDescription ? "Show Less" : "Show More"}
              </button>
            )}
          </div>

          <div className="actions">
            <button 
              onClick={() => handleVideoReaction("like")}
              className={`action-btn ${reaction === "like" ? "active" : ""}`}
            >
              👍 {likes}
            </button>

            <button 
              onClick={() => handleVideoReaction("dislike")}
              className={`action-btn ${reaction === "dislike" ? "active" : ""}`}
            >
              👎 {dislikes}
            </button>

            {/* Share Button - No count */}
            <button onClick={handleShare} className="action-btn">
              🔗 Share
            </button>
          </div>

          {/* Comments Section */}
          <div className="comments-section">
            <div className="comments-card">
              <div className="comments-card-header">
                <div className="comments-header-left">
                  <h3>Comments</h3>
                  <span className="comments-count">{comments.length}</span>
                </div>
                
                <div className="comments-controls">
                  <button onClick={() => setShowComments(prev => !prev)}>
                    {showComments ? "Hide Comments" : "Show Comments"}
                  </button>
                  
                  <select value={sortType} onChange={(e) => setSortType(e.target.value)}>
                    <option value="newest">Newest First</option>
                    <option value="top">Top Comments</option>
                  </select>
                </div>
              </div>

              {showComments && (
                <>
                  <div className="comment-input-area">
                    <div className="comment-input-wrapper">
                      <div className="comment-avatar">
                        <div 
                          className="avatar" 
                          style={{ 
                            backgroundColor: user?.username ? getAvatarColor(user.username) : '#3ea6ff' 
                          }}
                        >
                          {user?.username ? getUserAvatar(user.username) : 'G'}
                        </div>
                      </div>
                      <div className="comment-input-field">
                        <input
                          type="text"
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder="Add a comment..."
                          onKeyPress={(e) => e.key === "Enter" && handleAddComment()}
                        />
                        <div className="comment-input-actions">
                          <button 
                            className="cancel-btn" 
                            onClick={() => setCommentText("")}
                          >
                            Cancel
                          </button>
                          <button 
                            className="comment-submit-btn" 
                            onClick={handleAddComment} 
                            disabled={!commentText.trim()}
                          >
                            Comment
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="comments-list-container">
                    {commentsLoading ? (
                      <div className="loading-comments">Loading comments...</div>
                    ) : (
                      <div className="comments-list">
                        {sortedComments.map(comment => {
                          const replyCount = countReplies(comment.replies);
                          const hasReplies = replyCount > 0;
                          const showReplies = showRepliesFor[comment.id] || false;
                          
                          return (
                            <div key={comment.id} className="comment-card-item">
                              <div className="comment-avatar">
                                <div 
                                  className="avatar small" 
                                  style={{ 
                                    backgroundColor: comment.avatarColor || getAvatarColor(comment.user) 
                                  }}
                                >
                                  {comment.userAvatar || comment.user?.charAt(0).toUpperCase() || 'G'}
                                </div>
                              </div>
                              <div className="comment-content-wrapper">
                                <div className="comment-header">
                                  <strong>{comment.user}</strong>
                                  <span className="comment-date">
                                    {new Date(comment.createdAt).toLocaleDateString()}
                                  </span>
                                </div>

                                {editingId === comment.id ? (
                                  <div className="edit-comment">
                                    <input
                                      type="text"
                                      value={editText}
                                      onChange={(e) => setEditText(e.target.value)}
                                      onKeyPress={(e) => e.key === "Enter" && handleEditComment()}
                                      autoFocus
                                    />
                                    <button onClick={handleEditComment}>Save</button>
                                    <button onClick={handleCancelEdit}>Cancel</button>
                                  </div>
                                ) : (
                                  <>
                                    <div className="comment-text">{comment.text}</div>
                                    <div className="comment-actions">
                                      <button 
                                        onClick={() => handleCommentLike(comment.id)}
                                        className="like-btn"
                                      >
                                        👍 {comment.likes}
                                      </button>

                                      <button 
                                        onClick={() => toggleReplyInput(comment.id)}
                                        className="reply-btn"
                                      >
                                        Reply
                                      </button>

                                      {user?.id === comment.userId && (
                                        <>
                                          <button onClick={() => handleStartEdit(comment.id, comment.text)}>
                                            Edit
                                          </button>
                                          <button onClick={() => handleDeleteComment(comment.id)}>
                                            Delete
                                          </button>
                                        </>
                                      )}
                                    </div>

                                    {showReplyInput[comment.id] && (
                                      <div className="inline-reply-input">
                                        <div className="reply-input-wrapper">
                                          <div className="reply-avatar">
                                            <div 
                                              className="avatar tiny" 
                                              style={{ 
                                                backgroundColor: user?.username ? getAvatarColor(user.username) : '#3ea6ff' 
                                              }}
                                            >
                                              {user?.username ? getUserAvatar(user.username) : 'G'}
                                            </div>
                                          </div>
                                          <div className="reply-input-field">
                                            <input
                                              type="text"
                                              placeholder="Write a reply..."
                                              value={replyText[comment.id] || ""}
                                              onChange={(e) => setReplyText(prev => ({ ...prev, [comment.id]: e.target.value }))}
                                              onKeyPress={(e) => e.key === "Enter" && handleReply(comment.id)}
                                              autoFocus
                                            />
                                            <div className="reply-input-actions">
                                              <button onClick={() => toggleReplyInput(comment.id)}>
                                                Cancel
                                              </button>
                                              <button onClick={() => handleReply(comment.id)}>
                                                Reply
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {hasReplies && (
                                      <div className="replies-toggle">
                                        <button 
                                          onClick={() => toggleRepliesVisibility(comment.id)}
                                          className="replies-toggle-btn"
                                        >
                                          {showReplies ? "▼" : "▶"} {replyCount} {replyCount === 1 ? "Reply" : "Replies"}
                                        </button>
                                      </div>
                                    )}

                                    {hasReplies && showReplies && (
                                      <div className="replies-container">
                                        {comment.replies && comment.replies.length > 0 && renderReplies(comment.replies, 0)}
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {comments.length === 0 && (
                          <div className="no-comments">
                            <p>No comments yet. Be the first to comment!</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - RELATED VIDEOS */}
      <div className="related-sidebar">
        <h3>Related Videos</h3>
        {relatedVideos.map(relatedVideo => (
          <Link 
            key={relatedVideo.id} 
            to={`/watch/${relatedVideo.id}`} 
            className="related-video"
          >
            <img src={relatedVideo.thumbnail} alt={relatedVideo.title} />
            <div className="related-video-info">
              <h4>{relatedVideo.title}</h4>
              <p>{relatedVideo.creator}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* SHARE MODAL */}
      {showShareModal && (
        <div className="share-modal-overlay" onClick={closeShareModal}>
          <div className="share-modal" onClick={(e) => e.stopPropagation()}>
            <div className="share-modal-header">
              <h3>Share Video</h3>
              <button className="share-modal-close" onClick={closeShareModal}>✕</button>
            </div>
            
            <div className="share-modal-body">
              <div className="share-link-section">
                <input 
                  type="text" 
                  value={`${window.location.href}`} 
                  readOnly 
                  className="share-link-input"
                />
                <button 
                  className={`share-copy-btn ${shareCopied ? 'copied' : ''}`} 
                  onClick={handleCopyLink}
                >
                  {shareCopied ? '✅ Copied!' : '📋 Copy'}
                </button>
              </div>

              <div className="share-social-section">
                <p>Share via:</p>
                <div className="share-social-buttons">
                  <button onClick={handleWhatsAppShare} className="share-social-btn whatsapp">
                    💬 WhatsApp
                  </button>
                  <button onClick={handleTwitterShare} className="share-social-btn twitter">
                    🐦 Twitter
                  </button>
                  <button onClick={handleFacebookShare} className="share-social-btn facebook">
                    📘 Facebook
                  </button>
                  <button onClick={handleRedditShare} className="share-social-btn reddit">
                    🤖 Reddit
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Watch;