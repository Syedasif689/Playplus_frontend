import axios from 'axios';

const API = axios.create({
    baseURL: 'http://localhost:8080/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests
API.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Video API calls
export const videoApi = {
    getAll: () => API.get('/videos/all'),
    getVideo: (videoId) => API.get(`/videos/video/${videoId}`),  // ✅ FIXED
    getByCreator: (creatorId) => API.get(`/videos/creator/${creatorId}`),
    getReaction: (videoId) => API.get(`/videos/${videoId}/reaction`),
    like: (videoId) => API.post(`/videos/${videoId}/like`),
    dislike: (videoId) => API.post(`/videos/${videoId}/dislike`),
    upload: (videoData) => API.post('/videos/upload', videoData),
    update: (videoId, videoData) => API.put(`/videos/${videoId}`, videoData),
    delete: (videoId) => API.delete(`/videos/${videoId}`),
    trackView: (videoId) => {
        console.log('📤 Sending view tracking request for video:', videoId);
        return API.post(`/videos/${videoId}/view`);
    },
};

// Comment API calls
export const commentApi = {
    getComments: (videoId) => API.get(`/comments/video/${videoId}`),
    addComment: (videoId, text, parentCommentId = null) => 
        API.post(`/comments/video/${videoId}`, { text, parentCommentId }),
    updateComment: (commentId, text) => 
        API.put(`/comments/${commentId}`, { text }),
    deleteComment: (commentId) => 
        API.delete(`/comments/${commentId}`),
    likeComment: (commentId) => 
        API.post(`/comments/${commentId}/like`),
};

// Channel API calls
export const channelApi = {
    getChannel: (username) => API.get(`/channels/${username}`),
    subscribe: (username) => API.post(`/channels/${username}/subscribe`),
    unsubscribe: (username) => API.delete(`/channels/${username}/subscribe`),
    getSubscriptionStatus: (username) => API.get(`/channels/${username}/subscribed`),
    getUserSubscriptions: () => API.get('/user/subscriptions'),
};

// User API calls (History & Liked)
export const userApi = {
    getHistory: () => API.get('/user/history'),
    clearHistory: () => API.delete('/user/history'),
    getLikedVideos: () => API.get('/user/liked-videos'),
};

export default API;