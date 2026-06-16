import { useEffect, useState, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import defaultVideos from "../data/videos";
import "../styles/watch.css";
import { videoApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

function Watch() {
  const { user } = useAuth(); // Use the AuthContext instead of localStorage
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
  
  // Video state - will be loaded from database or fallback to local
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);

  // Video Stats
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [shares, setShares] = useState(0);
  
  // Video Reaction
  const [reaction, setReaction] = useState(null);

  // Get videos from localStorage + defaults
  const uploadedVideos = JSON.parse(localStorage.getItem("videos") || "[]");
  const allVideos = [...uploadedVideos, ...defaultVideos];
  const relatedVideos = allVideos.filter(v => v.id !== Number(id)).slice(0, 6);
  
  // Comments State
  const [comments, setComments] = useState([]);

  // Load video from database or fallback to local
  useEffect(() => {
    const loadVideo = async () => {
      setLoading(true);
      try {
        // Try to get video from database
        const response = await videoApi.getVideo(id);
        if (response.data) {
          setVideo(response.data);
          setLikes(response.data.likes || 0);
          setDislikes(response.data.dislikes || 0);
          setShares(response.data.shareCount || 0);
        }
      } catch (error) {
        console.log("Video not in database, using local data");
        // Fallback to local video
        const localVideo = allVideos.find(v => v.id === Number(id));
        if (localVideo) {
          setVideo(localVideo);
          setLikes(localVideo.likes || 120);
          setDislikes(localVideo.dislikes || 5);
          setShares(localVideo.shares || 20);
        }
      }
      setLoading(false);
    };
    
    if (id) {
      loadVideo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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

  // Load/Save Comments
  useEffect(() => {
    const savedComments = localStorage.getItem(`comments_${id}`);
    if (savedComments) {
      setComments(JSON.parse(savedComments));
    } else {
      setComments([]);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      localStorage.setItem(`comments_${id}`, JSON.stringify(comments));
    }
  }, [comments, id]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  // Helper: Recursively find and update a comment/reply
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

  // Helper: Recursively find and delete a comment/reply
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

  // Helper: Recursively insert a reply
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

  // COMMENT CRUD OPERATIONS
  const handleAddComment = useCallback(() => {
    if (!commentText.trim()) return;

    const newComment = {
      id: Date.now(),
      text: commentText.trim(),
      user: user?.username || "Guest",
      userId: user?.id,
      userAvatar: user?.username ? getUserAvatar(user.username) : 'G',
      avatarColor: user?.username ? getAvatarColor(user.username) : '#3ea6ff',
      likes: 0,
      likedBy: [],
      replies: [],
      createdAt: Date.now()
    };

    setComments(prev => [newComment, ...prev]);
    setCommentText("");
  }, [commentText, user]);

  const handleEditComment = useCallback(() => {
    if (!editText.trim()) return;

    setComments(prev => findAndUpdateNode(prev, editingId, node => ({
      ...node,
      text: editText.trim()
    })));
    
    setEditingId(null);
    setEditText("");
  }, [editText, editingId, findAndUpdateNode]);

  const handleDeleteComment = useCallback((commentId) => {
    if (window.confirm("Are you sure you want to delete this comment?")) {
      setComments(prev => findAndDeleteNode(prev, commentId));
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
  const handleCommentLike = useCallback((commentId) => {
    if (!user?.id) {
      alert("Please login to like comments");
      return;
    }

    setComments(prev => findAndUpdateNode(prev, commentId, node => {
      const hasLiked = node.likedBy?.includes(user.id);
      
      return {
        ...node,
        likes: hasLiked ? node.likes - 1 : node.likes + 1,
        likedBy: hasLiked 
          ? node.likedBy.filter(id => id !== user.id)
          : [...(node.likedBy || []), user.id]
      };
    }));
  }, [user, findAndUpdateNode]);

  // REPLY SYSTEM
  const handleReply = useCallback((parentId) => {
    const text = replyText[parentId];
    if (!text?.trim()) return;

    const newReply = {
      id: Date.now(),
      text: text.trim(),
      user: user?.username || "Guest",
      userId: user?.id,
      userAvatar: user?.username ? getUserAvatar(user.username) : 'G',
      avatarColor: user?.username ? getAvatarColor(user.username) : '#3ea6ff',
      replies: [],
      createdAt: Date.now()
    };

    setComments(prev => insertReplyNode(prev, parentId, newReply));
    setReplyText(prev => ({ ...prev, [parentId]: "" }));
    setShowReplyInput(prev => ({ ...prev, [parentId]: false }));
    setShowRepliesFor(prev => ({ ...prev, [parentId]: true }));
  }, [replyText, user, insertReplyNode]);

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

  const handleShare = useCallback(() => {
    setShares(prev => prev + 1);
    navigator.clipboard?.writeText(window.location.href);
    alert("Link copied to clipboard!");
  }, []);

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
          <div className="video-wrapper">
            <video className="video-player" controls src={video.videoUrl} />
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="scrollable-content">
          {/* Video Title */}
          <h2>{video.title}</h2>

          {/* Channel Link */}
          <Link to={`/channel/${video.creator}`} className="channel-link">
            {video.creator}
          </Link>

          {/* Description */}
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

          {/* Video Actions */}
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

            <button onClick={handleShare} className="action-btn">
              🔗 Share {shares}
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
                  {/* Add Comment Input */}
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

                  {/* Comments List */}
                  <div className="comments-list-container">
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
                                      className={`like-btn ${comment.likedBy?.includes(user?.id) ? "liked" : ""}`}
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
    </div>
  );
}

export default Watch;