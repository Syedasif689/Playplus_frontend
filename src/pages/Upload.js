import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { videoApi } from '../services/api';
import '../styles/Upload.css';

// 🔥 REPLACE WITH YOUR CLOUDINARY CREDENTIALS 🔥
const CLOUDINARY_CLOUD_NAME = 'duvjw7dti'; // <-- CHANGE THIS
const CLOUDINARY_UPLOAD_PRESET = 'playplus_uploads';   // <-- CHANGE THIS

function Upload() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: '',
        creator: '',
        description: '',
        thumbnail: '',
        videoUrl: ''
    });
    const [thumbnailPreview, setThumbnailPreview] = useState(null);
    const [videoPreview, setVideoPreview] = useState(null);
    const [videoFile, setVideoFile] = useState(null);
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (!user) {
            navigate('/');
            alert('Please login to upload videos');
        } else {
            setFormData(prev => ({
                ...prev,
                creator: user.username || ''
            }));
        }
    }, [user, navigate]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleThumbnailSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setThumbnailFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setThumbnailPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleVideoSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setVideoFile(file);
            const videoUrl = URL.createObjectURL(file);
            setVideoPreview(videoUrl);
        }
    };

    // Upload file to Cloudinary
    const uploadToCloudinary = async (file, resourceType) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        formData.append('folder', `playplus/${user.username}`);

        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`);
            
            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const progress = Math.round((event.loaded / event.total) * 100);
                    setUploadProgress(progress);
                }
            };

            xhr.onload = () => {
                if (xhr.status === 200) {
                    const response = JSON.parse(xhr.responseText);
                    resolve(response.secure_url);
                } else {
                    reject(new Error('Upload failed: ' + xhr.statusText));
                }
            };
            xhr.onerror = () => reject(new Error('Network error'));
            xhr.send(formData);
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);
        setUploadProgress(0);

        // Validation
        if (!formData.title.trim()) {
            setError('Title is required');
            setLoading(false);
            return;
        }
        if (!formData.creator.trim()) {
            setError('Creator name is required');
            setLoading(false);
            return;
        }
        if (!videoFile) {
            setError('Please select a video file');
            setLoading(false);
            return;
        }

        try {
            let videoUrl, thumbnailUrl;

            // 1. Upload video to Cloudinary
            setError('Uploading video to cloud...');
            videoUrl = await uploadToCloudinary(videoFile, 'video');
            console.log('Video uploaded:', videoUrl);

            // 2. Upload thumbnail if provided
            if (thumbnailFile) {
                setError('Uploading thumbnail...');
                thumbnailUrl = await uploadToCloudinary(thumbnailFile, 'image');
                console.log('Thumbnail uploaded:', thumbnailUrl);
            }

            // 3. Generate random thumbnail if not provided
            if (!thumbnailUrl) {
                const randomId = Math.floor(Math.random() * 1000);
                thumbnailUrl = `https://picsum.photos/seed/${randomId}/300/180`;
            }

            // 4. Save video data to database
            const videoData = {
                title: formData.title.trim(),
                creator: formData.creator.trim(),
                description: formData.description.trim(),
                videoUrl: videoUrl,
                thumbnail: thumbnailUrl,
                creatorId: user.id
            };

            console.log('Saving to database:', videoData);

            // Save to database and get the saved video
            const savedVideo = await videoApi.upload(videoData);
            console.log('Saved video:', savedVideo.data);
            
            setSuccess('✅ Video uploaded successfully to the cloud!');
            setUploadProgress(100);
            
            // Reset form
            setFormData({
                title: '',
                creator: user.username || '',
                description: '',
                thumbnail: '',
                videoUrl: ''
            });
            setThumbnailPreview(null);
            setVideoPreview(null);
            setVideoFile(null);
            setThumbnailFile(null);

            setTimeout(() => {
                navigate('/profile');
            }, 2000);

        } catch (error) {
            console.error('Upload error:', error);
            setError('Failed to upload: ' + error.message);
        }
        setLoading(false);
    };

    return (
        <div className="upload-container">
            <div className="upload-card">
                <h1>Upload Video</h1>
                <p className="upload-subtitle">Your videos are stored securely in the cloud</p>

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
                        <label>Creator Name *</label>
                        <input
                            type="text"
                            name="creator"
                            placeholder="Enter creator name..."
                            value={formData.creator}
                            onChange={handleChange}
                            required
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
                        <label>Thumbnail (Optional)</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleThumbnailSelect}
                        />
                        {thumbnailPreview && (
                            <div className="preview-container">
                                <img src={thumbnailPreview} alt="Thumbnail preview" className="thumbnail-preview" />
                                <small style={{ color: '#aaa', display: 'block', marginTop: '4px' }}>
                                    ✓ Thumbnail ready
                                </small>
                            </div>
                        )}
                        <small style={{ color: '#606060' }}>
                            Upload a custom thumbnail or leave empty for auto-generated
                        </small>
                    </div>

                    <div className="form-group">
                        <label>Video File *</label>
                        <input
                            type="file"
                            accept="video/*"
                            onChange={handleVideoSelect}
                            required
                        />
                        {videoPreview && (
                            <div className="preview-container">
                                <video controls className="video-preview">
                                    <source src={videoPreview} />
                                </video>
                                <small style={{ color: '#aaa', display: 'block', marginTop: '4px' }}>
                                    ✓ Video ready to upload
                                </small>
                            </div>
                        )}
                    </div>

                    {uploadProgress > 0 && uploadProgress < 100 && (
                        <div className="progress-container">
                            <div className="progress-bar" style={{ width: `${uploadProgress}%` }}>
                                Uploading... {uploadProgress}%
                            </div>
                        </div>
                    )}

                    {error && <div className="error-message">{error}</div>}
                    {success && <div className="success-message">{success}</div>}

                    <button type="submit" disabled={loading}>
                        {loading ? `Uploading... ${uploadProgress}%` : '📤 Upload to Cloud'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Upload;