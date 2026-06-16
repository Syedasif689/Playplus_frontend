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
    // Get all videos
    getAll: () => API.get('/videos/all'),
    
    // Get video by ID
    getVideo: (videoId) => API.get(`/videos/${videoId}`),
    
    // Get videos by creator
    getByCreator: (creatorId) => API.get(`/videos/creator/${creatorId}`),
    
    // Get user reaction
    getReaction: (videoId) => API.get(`/videos/${videoId}/reaction`),
    
    // Like a video
    like: (videoId) => API.post(`/videos/${videoId}/like`),
    
    // Dislike a video
    dislike: (videoId) => API.post(`/videos/${videoId}/dislike`),
    
    // Upload a video
    upload: (videoData) => API.post('/videos/upload', videoData),
    
    // Update a video
    update: (videoId, videoData) => API.put(`/videos/${videoId}`, videoData),
    
    // Delete a video
    delete: (videoId) => API.delete(`/videos/${videoId}`),
};

export default API;