import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { videoApi } from '../services/api';
import '../styles/Upload.css';

function EditVideo() {
    const { user } = useAuth();
    const { videoId } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        videoUrl: '',
        thumbnail: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Redirect if not logged in
    useEffect(() => {
        if (!user) {
            navigate('/');
            alert('Please login to edit videos');
        }
    }, [user, navigate]);

    // Load video data
    useEffect(() => {
        const loadVideo = async () => {
            try {
                const response = await videoApi.getVideo(videoId);
                const video = response.data;
                
                // Check if user owns this video
                if (video.creatorId !== user?.id) {
                    alert('You don\'t have permission to edit this video');
                    navigate('/profile');
                    return;
                }
                
                setFormData({
                    title: video.title || '',
                    description: video.description || '',
                    videoUrl: video.videoUrl || '',
                    thumbnail: video.thumbnail || ''
                });
            } catch (error) {
                console.error('Error loading video:', error);
                setError('Failed to load video');
            } finally {
                setLoading(false);
            }
        };
        
        if (videoId && user) {
            loadVideo();
        }
    }, [videoId, user, navigate]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setSaving(true);

        // Validate
        if (!formData.title.trim()) {
            setError('Title is required');
            setSaving(false);
            return;
        }
        if (!formData.videoUrl.trim()) {
            setError('Video URL is required');
            setSaving(false);
            return;
        }

        try {
            await videoApi.update(videoId, formData);
            setSuccess('✅ Video updated successfully!');
            
            setTimeout(() => {
                navigate(`/watch/${videoId}`);
            }, 1500);

        } catch (error) {
            console.error('Update error:', error);
            setError(error.response?.data || 'Failed to update video');
        }
        setSaving(false);
    };

    if (loading) {
        return (
            <div className="upload-container">
                <div className="upload-card">
                    <h2>Loading video...</h2>
                </div>
            </div>
        );
    }

    return (
        <div className="upload-container">
            <div className="upload-card">
                <h1>Edit Video</h1>
                <p className="upload-subtitle">Update your video details</p>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Video Title *</label>
                        <input
                            type="text"
                            name="title"
                            placeholder="Enter video title..."
                            value={formData.title}
                            onChange={handleChange}
                            required
                            maxLength={100}
                        />
                    </div>

                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            name="description"
                            placeholder="Enter video description..."
                            value={formData.description}
                            onChange={handleChange}
                            rows={4}
                        />
                    </div>

                    <div className="form-group">
                        <label>Video URL *</label>
                        <input
                            type="url"
                            name="videoUrl"
                            placeholder="https://www.youtube.com/watch?v=..."
                            value={formData.videoUrl}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Thumbnail URL</label>
                        <input
                            type="url"
                            name="thumbnail"
                            placeholder="https://example.com/thumbnail.jpg"
                            value={formData.thumbnail}
                            onChange={handleChange}
                        />
                    </div>

                    {error && <div className="error-message">{error}</div>}
                    {success && <div className="success-message">{success}</div>}

                    <div className="button-group">
                        <button type="submit" disabled={saving}>
                            {saving ? 'Saving...' : '💾 Save Changes'}
                        </button>
                        <button 
                            type="button" 
                            className="cancel-btn"
                            onClick={() => navigate(`/watch/${videoId}`)}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EditVideo;