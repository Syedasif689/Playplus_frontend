import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import defaultVideos from "../data/videos";
import "../styles/watch.css";
import { videoApi, commentApi, channelApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import VideoPlayer from '../components/VideoPlayer';
import {
  MdThumbUp,
  MdThumbDown,
  MdShare,
  MdDownload,
  MdReply,
  MdEdit,
  MdDelete,
  MdClose
} from "react-icons/md";

function Watch() {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();

  // UI States
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [sortType, setSortType] = useState("newest");
  const [showComments, setShowComments] = useState(true);
  const [replyText, setReplyText] = useState({});
  const [commentText, setCommentText] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingParentId, setEditingParentId] = useState(null);
  const [editText, setEditText] = useState("");
  const [showReplyInput, setShowReplyInput] = useState({});
  const [showRepliesFor, setShowRepliesFor] = useState({});
  
  // Video state
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [videoError, setVideoError] = useState(false);

  // Video Stats
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [views, setViews] = useState(0);
  const [viewTracked, setViewTracked] = useState(false);

  // Channel info
  const [creatorInfo, setCreatorInfo] = useState(null);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isOwnChannel, setIsOwnChannel] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  
  // Related videos (from backend)
  const [relatedVideos, setRelatedVideos] = useState([]);
  
  // Navigation - History management
  const [history, setHistory] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const isNavigating = useRef(false);
  
  // Share states
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  
  // Video Reaction
  const [reaction, setReaction] = useState(null);

  // Comments State
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(true);

  // Loading states for async operations
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [isPostingReply, setIsPostingReply] = useState(false);
  const [isReacting, setIsReacting] = useState(false);
  const [isEditingComment, setIsEditingComment] = useState(false);
  
  // Ref to track pending like requests
  const pendingLikes = useRef(new Map());

  // Helper to generate download URL for Cloudinary videos
  const getDownloadUrl = (url) => {
    if (!url) return url;
    if (url.includes('cloudinary.com')) {
      const parts = url.split('/upload/');
      if (parts.length === 2) {
        return parts[0] + '/upload/fl_attachment/' + parts[1];
      }
    }
    return url;
  };

  // Add video to history
  const addToHistory = useCallback((videoId) => {
    setHistory(prev => {
      if (isNavigating.current) {
        return prev;
      }
      
      const existingIndex = prev.indexOf(videoId);
      
      if (existingIndex !== -1) {
        const newHistory = [...prev];
        newHistory.splice(existingIndex, 1);
        newHistory.push(videoId);
        setCurrentIndex(newHistory.length - 1);
        return newHistory;
      }
      
      if (currentIndex !== -1 && currentIndex < prev.length - 1) {
        const newHistory = prev.slice(0, currentIndex + 1);
        newHistory.push(videoId);
        setCurrentIndex(newHistory.length - 1);
        return newHistory;
      }
      
      const newHistory = [...prev, videoId];
      setCurrentIndex(newHistory.length - 1);
      return newHistory;
    });
  }, [currentIndex]);

  const navigateToVideo = useCallback((videoId, addToHistoryFlag = true) => {
    if (!videoId) return;
    if (videoId === id) return;
    
    if (!addToHistoryFlag) {
      isNavigating.current = true;
    }
    
    navigate(`/watch/${videoId}`);
    window.scrollTo(0, 0);
    
    setTimeout(() => {
      isNavigating.current = false;
    }, 100);
  }, [navigate, id]);

  const getNextFromRelated = useCallback(() => {
    const relatedIndex = relatedVideos.findIndex(v => v.id === video?.id);
    if (relatedIndex < relatedVideos.length - 1 && relatedVideos[relatedIndex + 1]) {
      return relatedVideos[relatedIndex + 1];
    }
    return null;
  }, [relatedVideos, video]);

  const getPreviousFromRelated = useCallback(() => {
    const relatedIndex = relatedVideos.findIndex(v => v.id === video?.id);
    if (relatedIndex > 0 && relatedVideos[relatedIndex - 1]) {
      return relatedVideos[relatedIndex - 1];
    }
    return null;
  }, [relatedVideos, video]);

  const handlePreviousVideo = useCallback(() => {
    if (currentIndex > 0) {
      const prevVideoId = history[currentIndex - 1];
      navigateToVideo(prevVideoId, false);
      return;
    }
    const prevRelated = getPreviousFromRelated();
    if (prevRelated) {
      navigateToVideo(prevRelated.id, true);
    }
  }, [currentIndex, history, navigateToVideo, getPreviousFromRelated]);

  const handleNextVideo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      const nextVideoId = history[currentIndex + 1];
      navigateToVideo(nextVideoId, false);
      return;
    }
    const nextRelated = getNextFromRelated();
    if (nextRelated) {
      navigateToVideo(nextRelated.id, true);
    }
  }, [currentIndex, history, navigateToVideo, getNextFromRelated]);

  // Load video from database or fallback to local
  useEffect(() => {
    const loadVideo = async () => {
      setLoading(true);
      setVideoError(false);
      try {
        const response = await videoApi.getVideo(id);
        if (response.data) {
          setVideo(response.data);
          setLikes(response.data.likes || 0);
          setDislikes(response.data.dislikes || 0);
          setViews(response.data.views || 0);
          
          if (response.data.creator) {
            try {
              const channelResponse = await channelApi.getChannel(response.data.creator);
              setCreatorInfo(channelResponse.data);
              setSubscriberCount(channelResponse.data.subscriberCount || 0);
              setIsSubscribed(channelResponse.data.isSubscribed || false);
              setIsOwnChannel(channelResponse.data.isOwnChannel || false);
            } catch (err) {
              console.warn('Could not fetch creator info:', err);
            }
          }
          
          await loadRelatedVideos(response.data);
          
          if (!isNavigating.current) {
            addToHistory(id);
          } else {
            isNavigating.current = false;
          }
        }
      } catch (error) {
        console.log("Video not in database, using local data");
        const localVideo = defaultVideos.find(v => v.id === Number(id));
        if (localVideo) {
          setVideo(localVideo);
          setLikes(localVideo.likes || 120);
          setDislikes(localVideo.dislikes || 5);
          setViews(localVideo.views || 0);
          
          if (!isNavigating.current) {
            addToHistory(id);
          } else {
            isNavigating.current = false;
          }
        } else {
          setVideoError(true);
        }
      }
      setLoading(false);
    };
    
    if (id) {
      loadVideo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadRelatedVideos = useCallback(async (currentVideo) => {
    try {
      const response = await videoApi.getAll();
      const allVideos = response.data || [];
      
      let filtered = allVideos.filter(v => v.id !== currentVideo.id);
      
      if (currentVideo.creator) {
        const creatorVideos = filtered.filter(v => v.creator === currentVideo.creator);
        const otherVideos = filtered.filter(v => v.creator !== currentVideo.creator);
        filtered = [...creatorVideos, ...otherVideos];
      }
      
      if (filtered.length === 0) {
        const localVideos = defaultVideos.filter(v => v.id !== Number(id));
        setRelatedVideos(localVideos.slice(0, 6));
        return;
      }
      
      setRelatedVideos(filtered.slice(0, 6));
      
    } catch (error) {
      console.error('Error loading related videos:', error);
      const localVideos = defaultVideos.filter(v => v.id !== Number(id));
      setRelatedVideos(localVideos.slice(0, 6));
    }
  }, [id]);

  useEffect(() => {
    setViewTracked(false);
  }, [video?.id]);

  useEffect(() => {
    const trackView = async () => {
      if (video?.id && !viewTracked && !videoError) {
        try {
          const response = await videoApi.trackView(video.id);
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
  }, [video?.id, viewTracked, videoError]);

  useEffect(() => {
    const loadReaction = async () => {
      if (user?.id && video?.id && !videoError) {
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
  }, [user, video?.id, videoError]);

  useEffect(() => {
    const loadComments = async () => {
      if (video?.id && !videoError) {
        setCommentsLoading(true);
        try {
          const response = await commentApi.getComments(video.id);

          const formattedComments = response.data.map((dbComment) => ({
            id: dbComment.id,
            text: dbComment.text,
            user: dbComment.user,
            userId: dbComment.userId,
            likes: dbComment.likes || 0,
            likedBy: dbComment.likedBy || [],
            replies: dbComment.replies || [],
            createdAt: new Date(dbComment.createdAt).getTime(),
            userAvatar: dbComment.user ? getUserAvatar(dbComment.user) : "G",
            avatarColor: dbComment.user
              ? getAvatarColor(dbComment.user)
              : "#3ea6ff"
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
  }, [video?.id, id, videoError]);

  useEffect(() => {
    if (id && comments.length > 0) {
      localStorage.setItem(`comments_${id}`, JSON.stringify(comments));
    }
  }, [comments, id]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

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
    return nodes
      .filter(node => node.id !== targetId)
      .map(node => ({
        ...node,
        replies: node.replies ? findAndDeleteNode(node.replies, targetId) : []
      }));
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

  const findOriginalNode = useCallback((nodes, commentId) => {
    for (const node of nodes) {
      if (node.id === commentId) return node;
      if (node.replies) {
        const found = findOriginalNode(node.replies, commentId);
        if (found) return found;
      }
    }
    return null;
  }, []);

  const getUserAvatar = (username) => {
    if (!username) return 'G';
    return username.charAt(0).toUpperCase();
  };

  const getAvatarColor = (username) => {
    if (!username) return '#3ea6ff';
    const colors = ['#3ea6ff', '#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff6bff', '#ff9f43', '#00d2d3'];
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const formatNumber = useCallback((count) => {
    if (!count) return '0';
    if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
    if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
    return count.toString();
  }, []);

  const formatViews = formatNumber;
  const formatSubscriberCount = formatNumber;

  // SHARE FUNCTIONALITY
  const handleShare = async () => {
    const url = window.location.href;
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
    window.open(`https://wa.me/?text=${encodeURIComponent(window.location.href)}`, '_blank');
  };

  const handleTwitterShare = () => {
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}`, '_blank');
  };

  const handleFacebookShare = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank');
  };

  const handleRedditShare = () => {
    window.open(`https://www.reddit.com/submit?url=${encodeURIComponent(window.location.href)}`, '_blank');
  };

  const closeShareModal = () => {
    setShowShareModal(false);
    setShareCopied(false);
  };

  // COMMENT LIKE SYSTEM
  const handleCommentLike = useCallback(async (commentId) => {
    if (!user?.id) {
      alert("Please login");
      return;
    }

    if (pendingLikes.current.has(commentId)) return;

    pendingLikes.current.set(commentId, true);

    const previousComments = JSON.parse(JSON.stringify(comments));
    try {
      setComments(prev =>
        findAndUpdateNode(prev, commentId, node => {
          const liked = (node.likedBy || []).includes(user.id);
          return {
            ...node,
            likes: liked
              ? Math.max(0, node.likes - 1)
              : node.likes + 1,
            likedBy: liked
              ? node.likedBy.filter(id => id !== user.id)
              : [...(node.likedBy || []), user.id]
          };
        })
      );

      await commentApi.likeComment(commentId);

    } catch (error) {
      console.error(error);
      setComments(previousComments);
    } finally {
      pendingLikes.current.delete(commentId);
    }
  }, [user, comments, findAndUpdateNode]);

  // COMMENT CRUD OPERATIONS
  const handleAddComment = useCallback(async () => {
    if (!commentText.trim() || !user?.id || isPostingComment) {
      if (!user?.id) alert("Please login to comment");
      return;
    }

    const text = commentText.trim();
    const tempId = `temp_${Date.now()}_${Math.random()}`;

    const tempComment = {
      id: tempId,
      text: text,
      user: user.username,
      userId: user.id,
      likes: 0,
      likedBy: [],
      replies: [],
      createdAt: Date.now(),
      userAvatar: getUserAvatar(user.username),
      avatarColor: getAvatarColor(user.username),
      isTemp: true
    };

    setIsPostingComment(true);
    setComments(prev => [tempComment, ...prev]);
    setCommentText("");

    try {
      const response = await commentApi.addComment(video.id, text);
      
      setComments(prev => {
        const index = prev.findIndex(c => c.id === tempId);
        if (index === -1) return prev;
        
        const newComments = [...prev];
        newComments[index] = {
          id: response.data.id,
          text: response.data.text,
          user: response.data.user,
          userId: response.data.userId,
          likes: response.data.likes || 0,
          likedBy: response.data.likedBy || [],
          replies: response.data.replies || [],
          createdAt: new Date(response.data.createdAt).getTime(),
          userAvatar: response.data.user ? getUserAvatar(response.data.user) : 'G',
          avatarColor: response.data.user ? getAvatarColor(response.data.user) : '#3ea6ff'
        };
        return newComments;
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      setComments(prev => prev.filter(c => c.id !== tempId));
      alert('Failed to add comment. Please try again.');
    } finally {
      setIsPostingComment(false);
    }
  }, [commentText, user, video?.id, isPostingComment]);

  const handleEditComment = useCallback(async () => {
    if (!editText.trim() || !editingId || isEditingComment) return;

    const commentId = editingId;
    const newText = editText.trim();
    let originalText = '';
    
    setComments(prev => {
      const findOriginal = (nodes) => {
        for (const node of nodes) {
          if (node.id === commentId) {
            originalText = node.text;
            return true;
          }
          if (node.replies && findOriginal(node.replies)) return true;
        }
        return false;
      };
      findOriginal(prev);
      
      return findAndUpdateNode(prev, commentId, node => ({
        ...node,
        text: newText
      }));
    });
    
    setEditingId(null);
    setEditingParentId(null);
    setEditText("");
    setIsEditingComment(true);

    try {
      await commentApi.updateComment(commentId, newText);
    } catch (error) {
      console.error('Error updating comment:', error);
      setComments(prev => findAndUpdateNode(prev, commentId, node => ({
        ...node,
        text: originalText
      })));
      alert('Failed to update comment. Please try again.');
    } finally {
      setIsEditingComment(false);
    }
  }, [editText, editingId, findAndUpdateNode, isEditingComment]);

  const handleDeleteComment = useCallback(async (commentId) => {
    if (typeof commentId === 'string' && commentId.startsWith('temp_')) {
      alert('Please wait for the comment to be posted before deleting.');
      return;
    }

    if (!window.confirm("Are you sure you want to delete this comment?")) return;
    const deletedComment = findOriginalNode(comments, commentId);
    setComments(prev => findAndDeleteNode(prev, commentId));

    try {
      await commentApi.deleteComment(commentId);
      alert('✅ Comment deleted successfully!');
    } catch (error) {
      console.error('Error deleting comment:', error);
      if (deletedComment) {
        setComments(prev => [...prev, deletedComment].sort((a, b) => b.createdAt - a.createdAt));
      }
      alert('Failed to delete comment. Please try again.');
    }
  }, [findAndDeleteNode, findOriginalNode, comments]);

  const handleStartEdit = useCallback((commentId, currentText, parentId = null, e) => {
    if (e) {
      e.stopPropagation();
    }
    
    setEditingId(commentId);
    setEditingParentId(parentId);
    setEditText(currentText);
    setShowReplyInput({});
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditingParentId(null);
    setEditText("");
  }, []);

  // REPLY SYSTEM
  const handleReply = useCallback(async (parentId) => {
    if (!user?.id) {
      alert("Please login to reply");
      return;
    }
    const text = replyText[parentId];
    if (!text?.trim() || isPostingReply) return;

    const tempReplyId = `temp_reply_${Date.now()}_${Math.random()}`;
    
    const tempReply = {
      id: tempReplyId,
      text: text.trim(),
      user: user.username,
      userId: user.id,
      likes: 0,
      likedBy: [],
      replies: [],
      createdAt: Date.now(),
      userAvatar: getUserAvatar(user.username),
      avatarColor: getAvatarColor(user.username),
      isTemp: true
    };

    setIsPostingReply(true);
    setComments(prev => insertReplyNode(prev, parentId, tempReply));
    setReplyText(prev => ({ ...prev, [parentId]: "" }));
    setShowReplyInput(prev => ({ ...prev, [parentId]: false }));
    setShowRepliesFor(prev => ({ ...prev, [parentId]: true }));

    try {
      const response = await commentApi.addComment(video.id, text.trim(), parentId);
      
      setComments(prev => {
        const replaceReply = (nodes) => {
          return nodes.map(node => {
            if (node.id === parentId) {
              const replies = node.replies || [];
              const index = replies.findIndex(r => r.id === tempReplyId);
              if (index !== -1) {
                const newReplies = [...replies];
                newReplies[index] = {
                  id: response.data.id,
                  text: response.data.text,
                  user: response.data.user,
                  userId: response.data.userId,
                  likes: response.data.likes || 0,
                  likedBy: response.data.likedBy || [],
                  replies: response.data.replies || [],
                  createdAt: new Date(response.data.createdAt).getTime(),
                  userAvatar: response.data.user ? getUserAvatar(response.data.user) : 'G',
                  avatarColor: response.data.user ? getAvatarColor(response.data.user) : '#3ea6ff'
                };
                return { ...node, replies: newReplies };
              }
              return node;
            }
            if (node.replies) {
              return { ...node, replies: replaceReply(node.replies) };
            }
            return node;
          });
        };
        return replaceReply(prev);
      });
    } catch (error) {
      console.error('Error adding reply:', error);
      setComments(prev => {
        const removeTempReply = (nodes) => {
          return nodes.map(node => {
            if (node.id === parentId) {
              return {
                ...node,
                replies: (node.replies || []).filter(r => r.id !== tempReplyId)
              };
            }
            if (node.replies) {
              return { ...node, replies: removeTempReply(node.replies) };
            }
            return node;
          });
        };
        return removeTempReply(prev);
      });
      alert('Failed to add reply. Please try again.');
    } finally {
      setIsPostingReply(false);
    }
  }, [replyText, user, video?.id, insertReplyNode, isPostingReply]);

  const toggleReplyInput = useCallback((id) => {
    setShowReplyInput(prev => ({ ...prev, [id]: !prev[id] }));
    if (editingId) {
      setEditingId(null);
      setEditingParentId(null);
      setEditText("");
    }
  }, [editingId]);

  const toggleRepliesVisibility = useCallback((commentId) => {
    setShowRepliesFor(prev => ({ ...prev, [commentId]: !prev[commentId] }));
  }, []);

  // VIDEO LIKE/DISLIKE
  const handleVideoReaction = async (type) => {
    if (!user?.id) {
      alert("Login required");
      return;
    }

    if (isReacting) return;

    setIsReacting(true);

    const oldReaction = reaction;

    try {
      if (oldReaction === type) {
        setReaction(null);

        if (type === "like") {
          setLikes(prev => Math.max(0, prev - 1));
        } else {
          setDislikes(prev => Math.max(0, prev - 1));
        }
      } else {
        setReaction(type);

        if (type === "like") {
          setLikes(prev => prev + 1);

          if (oldReaction === "dislike") {
            setDislikes(prev => Math.max(0, prev - 1));
          }
        } else {
          setDislikes(prev => prev + 1);

          if (oldReaction === "like") {
            setLikes(prev => Math.max(0, prev - 1));
          }
        }
      }

      if (type === "like") {
        await videoApi.like(video.id);
      } else {
        await videoApi.dislike(video.id);
      }

    } catch (error) {
      console.error(error);
    } finally {
      setIsReacting(false);
    }
  };

  // SUBSCRIBE HANDLER
  const handleSubscribe = async () => {
    if (!user) {
      alert('Please login to subscribe');
      return;
    }
    if (isOwnChannel) {
      alert('You cannot subscribe to your own channel');
      return;
    }
    
    const newSubscribed = !isSubscribed;
    setIsSubscribed(newSubscribed);
    setSubscriberCount(prev => newSubscribed ? prev + 1 : Math.max(0, prev - 1));
    setIsSubscribing(true);
    
    try {
      let response;
      if (newSubscribed) {
        response = await channelApi.subscribe(video.creator);
      } else {
        response = await channelApi.unsubscribe(video.creator);
      }
      setIsSubscribed(response.data.subscribed);
      setSubscriberCount(response.data.subscriberCount);
    } catch (error) {
      console.error('Subscribe error:', error);
      setIsSubscribed(!newSubscribed);
      setSubscriberCount(prev => !newSubscribed ? prev + 1 : Math.max(0, prev - 1));
      alert(error.response?.data?.error || 'Failed to update subscription');
    } finally {
      setIsSubscribing(false);
    }
  };

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

  const renderReplies = useCallback((replies, depth = 0, parentId = null) => {
    if (!replies || replies.length === 0) return null;
    return (
      <div className={`replies-section depth-${Math.min(depth, 3)}`}>
        {replies.map(reply => {
          const isEditing = editingId === reply.id && editingParentId === parentId;
          
          return (
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
              
              {isEditing ? (
                <div className="edit-comment">
                  <input
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleEditComment()}
                    autoFocus
                  />
                  <button 
                    onClick={handleEditComment}
                    disabled={isEditingComment || !editText.trim()}
                  >
                    {isEditingComment ? 'Saving...' : 'Save'}
                  </button>
                  <button 
                    onClick={handleCancelEdit}
                    disabled={isEditingComment}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <div className="reply-text">{reply.text}</div>
                  <div className="reply-actions">
                    <button 
                      onClick={() => handleCommentLike(reply.id)}
                      disabled={typeof reply.id === 'string' && reply.id.startsWith('temp_')}
                    >
                      <MdThumbUp size={16} /> {reply.likes}
                    </button>
                    
                    <button onClick={() => toggleReplyInput(reply.id)}>
                      <MdReply size={16} /> Reply
                    </button>

                    {user?.id === reply.userId && (
                      <>
                        <button 
                          onClick={(e) => handleStartEdit(reply.id, reply.text, parentId, e)}
                          disabled={isEditingComment}
                        >
                          <MdEdit size={16} /> Edit
                        </button>

                        <button 
                          onClick={() => handleDeleteComment(reply.id)}
                          disabled={typeof reply.id === 'string' && reply.id.startsWith('temp_')}
                        >
                          <MdDelete size={16} /> Delete
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
              
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
              {reply.replies && reply.replies.length > 0 && renderReplies(reply.replies, depth + 1, reply.id)}
            </div>
          );
        })}
      </div>
    );
  }, [
    editingId,
    editingParentId,
    editText,
    handleEditComment,
    isEditingComment,
    handleCancelEdit,
    handleCommentLike,
    toggleReplyInput,
    replyText,
    handleReply,
    handleStartEdit,
    handleDeleteComment,
    user,
    showReplyInput
  ]);

  const sortedComments = useMemo(() => {
    return [...comments].sort((a, b) => {
      if (sortType === "top") return b.likes - a.likes;
      return b.createdAt - a.createdAt;
    });
  }, [comments, sortType]);

  if (loading) {
    return (
      <div className="watch-layout">
        <div className="main-content">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading video...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!video || videoError) {
    return (
      <div className="watch-layout">
        <div className="main-content">
          <div className="error-container">
            <h2>Video not found</h2>
            <p>The video you're looking for doesn't exist or has been removed.</p>
            <Link to="/" className="back-home-btn">Go back home</Link>
          </div>
        </div>
      </div>
    );
  }

  const hasPrevious = currentIndex > 0 || 
                      relatedVideos.findIndex(v => v.id === video.id) > 0;
  
  const hasNext = currentIndex < history.length - 1 ||
                  relatedVideos.findIndex(v => v.id === video.id) < relatedVideos.length - 1;

  return (
    <div className="watch-layout">
      <div className="main-content">
        <div className="sticky-video-container">
          <VideoPlayer 
            src={video.videoUrl} 
            title={video.title} 
            key={video.id}
            onPrevious={handlePreviousVideo}
            onNext={handleNextVideo}
            hasPrevious={hasPrevious}
            hasNext={hasNext}
          />
        </div>

        <div className="scrollable-content">
          {/* Video Title with Views - fixed: added margin-top to push it down */}
          <div className="video-header" style={{ marginTop: '20px' }}>
            <h2 style={{ color: '#f1f1f1' }}>{video.title || 'Untitled Video'}</h2>
            <p className="video-views">{formatViews(views)} views</p>
          </div>

          {/* Channel Row with Avatar, Name, Subscribe */}
          <div className="channel-row">
            <div className="channel-avatar-row">
              <Link to={`/channel/${video.creator}`} className="channel-link">
                <div className="channel-avatar-small">
                  {creatorInfo?.profilePicture ? (
                    <img src={creatorInfo.profilePicture} alt={video.creator} />
                  ) : (
                    <div className="avatar-initial" style={{ backgroundColor: getAvatarColor(video.creator) }}>
                      {video.creator?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                <span className="channel-name">
                  {creatorInfo?.name || video.creator || 'Unknown Channel'}
                </span>
              </Link>
              {!isOwnChannel && (
                <span className="subscriber-count">{formatSubscriberCount(subscriberCount)} subscribers</span>
              )}
            </div>
            <button
              className={`subscribe-btn ${isSubscribed ? 'subscribed' : ''} ${isOwnChannel ? 'own-channel' : ''}`}
              onClick={handleSubscribe}
              disabled={isOwnChannel || !user || isSubscribing}
            >
              {isOwnChannel ? 'Your Channel' : isSubscribed ? 'Subscribed ✓' : 'Subscribe'}
              {!isOwnChannel && isSubscribing && '...'}
            </button>
          </div>

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
              <MdThumbUp size={22} /> {likes}
            </button>

            <button
              onClick={() => handleVideoReaction("dislike")}
              className={`action-btn ${reaction === "dislike" ? "active" : ""}`}
            >
              <MdThumbDown size={22} /> {dislikes}
            </button>

            <button onClick={handleShare} className="action-btn">
              <MdShare size={22} /> Share
            </button>

            {video.allowDownload && (
              <a
                href={getDownloadUrl(video.videoUrl)}
                download
                className="action-btn"
                target="_blank"
                rel="noopener noreferrer"
              >
                <MdDownload size={22} /> Download
              </a>
            )}
          </div>

          {/* ============ COMMENTS SECTION ============ */}
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
                          placeholder={user ? "Add a comment..." : "Please login to comment"}
                          onKeyPress={(e) => e.key === "Enter" && handleAddComment()}
                          disabled={!user}
                        />
                        <div className="comment-input-actions">
                          <button className="cancel-btn" onClick={() => setCommentText("")}>Cancel</button>
                          <button
                            className="comment-submit-btn"
                            onClick={handleAddComment}
                            disabled={!commentText.trim() || isPostingComment || !user}
                          >
                            {isPostingComment ? 'Posting...' : 'Comment'}
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
                          const isEditing = editingId === comment.id && editingParentId === null;

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

                                {isEditing ? (
                                  <div className="edit-comment">
                                    <input
                                      type="text"
                                      value={editText}
                                      onChange={(e) => setEditText(e.target.value)}
                                      onKeyPress={(e) => e.key === "Enter" && handleEditComment()}
                                      autoFocus
                                    />
                                    <button 
                                      onClick={handleEditComment}
                                      disabled={isEditingComment || !editText.trim()}
                                    >
                                      {isEditingComment ? 'Saving...' : 'Save'}
                                    </button>
                                    <button 
                                      onClick={handleCancelEdit}
                                      disabled={isEditingComment}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <div className="comment-text">{comment.text}</div>
                                    <div className="comment-actions">
                                      <button
                                        onClick={() => handleCommentLike(comment.id)}
                                        className="like-btn"
                                        disabled={typeof comment.id === 'string' && comment.id.startsWith('temp_')}
                                      >
                                        <MdThumbUp size={18} /> {comment.likes}
                                      </button>

                                      <button
                                        onClick={() => toggleReplyInput(comment.id)}
                                        className="reply-btn"
                                      >
                                        <MdReply size={18} /> Reply
                                      </button>

                                      {user?.id === comment.userId && (
                                        <>
                                          <button 
                                            onClick={(e) => handleStartEdit(comment.id, comment.text, null, e)}
                                            disabled={isEditingComment}
                                          >
                                            <MdEdit size={18} /> Edit
                                          </button>

                                          <button 
                                            onClick={() => handleDeleteComment(comment.id)}
                                            disabled={typeof comment.id === 'string' && comment.id.startsWith('temp_')}
                                          >
                                            <MdDelete size={18} /> Delete
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
                                              <button onClick={() => toggleReplyInput(comment.id)}>Cancel</button>
                                              <button 
                                                onClick={() => handleReply(comment.id)}
                                                disabled={isPostingReply}
                                              >
                                                {isPostingReply ? 'Posting...' : 'Reply'}
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
                                        {comment.replies && comment.replies.length > 0 && renderReplies(comment.replies, 0, comment.id)}
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
          {/* ============ END COMMENTS ============ */}
        </div>
      </div>

      {/* RIGHT SIDE - RELATED VIDEOS */}
      <div className="related-sidebar">
        <h3>Related Videos</h3>
        {relatedVideos.length > 0 ? (
          relatedVideos.map(relatedVideo => (
            <Link key={relatedVideo.id} to={`/watch/${relatedVideo.id}`} className="related-video">
              <img src={relatedVideo.thumbnail || 'https://picsum.photos/300/180'} alt={relatedVideo.title} />
              <div className="related-video-info">
                <h4>{relatedVideo.title}</h4>
                <p>{relatedVideo.creator || 'Unknown'}</p>
              </div>
            </Link>
          ))
        ) : (
          <p style={{ color: '#888', fontSize: '14px' }}>No related videos found.</p>
        )}
      </div>

      {/* SHARE MODAL */}
      {showShareModal && (
        <div className="share-modal-overlay" onClick={closeShareModal}>
          <div className="share-modal" onClick={(e) => e.stopPropagation()}>
            <div className="share-modal-header">
              <h3>Share Video</h3>
              <button className="share-modal-close" onClick={closeShareModal}>
                <MdClose size={24} />
              </button>
            </div>
            <div className="share-modal-body">
              <div className="share-link-section">
                <input type="text" value={window.location.href} readOnly className="share-link-input" />
                <button className={`share-copy-btn ${shareCopied ? 'copied' : ''}`} onClick={handleCopyLink}>
                  {shareCopied ? '✅ Copied!' : '📋 Copy'}
                </button>
              </div>
              <div className="share-social-section">
                <p>Share via:</p>
                <div className="share-social-buttons">
                  <button onClick={handleWhatsAppShare} className="share-social-btn whatsapp">💬 WhatsApp</button>
                  <button onClick={handleTwitterShare} className="share-social-btn twitter">🐦 Twitter</button>
                  <button onClick={handleFacebookShare} className="share-social-btn facebook">📘 Facebook</button>
                  <button onClick={handleRedditShare} className="share-social-btn reddit">🤖 Reddit</button>
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