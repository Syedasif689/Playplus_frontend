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
    getVideo: (videoId) => API.get(`/videos/${videoId}`),
    getByCreator: (creatorId) => API.get(`/videos/creator/${creatorId}`),
    getReaction: (videoId) => API.get(`/videos/${videoId}/reaction`),
    like: (videoId) => API.post(`/videos/${videoId}/like`),
    dislike: (videoId) => API.post(`/videos/${videoId}/dislike`),
    upload: (videoData) => API.post('/videos/upload', videoData),
    update: (videoId, videoData) => API.put(`/videos/${videoId}`, videoData),
    delete: (videoId) => API.delete(`/videos/${videoId}`),
    // ✅ ADDED: Track video view
    trackView: (videoId) => {
        console.log('📤 Sending view tracking request for video:', videoId);
        return API.post(`/videos/${videoId}/view`);
    },
};

// Comment API calls
export const commentApi = {
    // Get comments for a video
    getComments: (videoId) => API.get(`/comments/video/${videoId}`),
    
    // Add a comment
    addComment: (videoId, text, parentCommentId = null) => 
        API.post(`/comments/video/${videoId}`, { text, parentCommentId }),
    
    // Update a comment
    updateComment: (commentId, text) => 
        API.put(`/comments/${commentId}`, { text }),
    
    // Delete a comment
    deleteComment: (commentId) => 
        API.delete(`/comments/${commentId}`),
    
    // Like/Unlike a comment
    likeComment: (commentId) => 
        API.post(`/comments/${commentId}/like`),
};

export default API;